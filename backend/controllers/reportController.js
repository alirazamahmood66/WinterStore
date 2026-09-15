import { pool } from "../config/db.js";

const PERIODS = {
  "7": 7,
  "30": 30,
  "90": 90,
  "365": 365,
};

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (d, days) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && value === toISODate(date);
};

/**
 * Resolve the effective date window and optional filters.
 * Supports either a period (7/30/90/365) or an explicit dateFrom/dateTo range.
 */
const resolveFilters = (req) => {
  const filters = {
    status: null,
    category: null,
    dateFrom: null,
    dateTo: null,
    prevFrom: null,
    prevTo: null,
  };

  const rawFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom.trim() : "";
  const rawTo = typeof req.query.dateTo === "string" ? req.query.dateTo.trim() : "";

  if (rawFrom || rawTo) {
    if (!rawFrom || !rawTo) {
      return { error: "Both dateFrom and dateTo are required when filtering by date" };
    }
    if (!isValidDate(rawFrom) || !isValidDate(rawTo)) {
      return { error: "Invalid date format. Use YYYY-MM-DD" };
    }
    if (rawFrom > rawTo) {
      return { error: "dateFrom cannot be after dateTo" };
    }
    filters.dateFrom = rawFrom;
    filters.dateTo = rawTo;

    const from = new Date(rawFrom);
    const to = new Date(rawTo);
    const windowMs = to.getTime() - from.getTime();
    const prevTo = addDays(from, -1);
    const prevFrom = new Date(prevTo.getTime() - windowMs);
    filters.prevFrom = toISODate(prevFrom);
    filters.prevTo = toISODate(prevTo);
  } else {
    const requested = req.query.period === undefined ? 30 : Number(req.query.period);
    const days = PERIODS[requested] || 30;
    const today = new Date();
    const from = addDays(today, -(days - 1));
    filters.dateFrom = toISODate(from);
    filters.dateTo = toISODate(today);
    filters.prevFrom = toISODate(addDays(from, -days));
    filters.prevTo = toISODate(addDays(from, -1));
  }

  if (req.query.status !== undefined && req.query.status !== "") {
    const status = String(req.query.status).toLowerCase();
    if (!ORDER_STATUSES.includes(status)) {
      return { error: `Status must be one of: ${ORDER_STATUSES.join(", ")}` };
    }
    filters.status = status;
  }

  if (req.query.category_id !== undefined && req.query.category_id !== "") {
    const categoryId = Number(req.query.category_id);
    if (Number.isNaN(categoryId) || !Number.isInteger(categoryId) || categoryId < 1) {
      return { error: "A valid category_id is required" };
    }
    filters.category = categoryId;
  }

  return { filters };
};

/**
 * Build WHERE clauses scoped to a date/status/category filter set.
 * Order-level filters use "o" as the orders alias.
 */
const buildWhere = (f) => {
  const where = [];
  const params = [];
  if (f.dateFrom) {
    where.push("DATE(o.created_at) >= ?");
    params.push(f.dateFrom);
  }
  if (f.dateTo) {
    where.push("DATE(o.created_at) <= ?");
    params.push(f.dateTo);
  }
  if (f.status) {
    where.push("o.status = ?");
    params.push(f.status);
  }
  if (f.category) {
    where.push(
      `EXISTS (
         SELECT 1
         FROM order_items oi_f
         INNER JOIN products p_f ON p_f.id = oi_f.product_id
         WHERE oi_f.order_id = o.id AND p_f.category_id = ?
         LIMIT 1
       )`
    );
    params.push(f.category);
  }
  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
};

/**
 * Returns order-level WHERE clauses, optionally excluding cancelled orders.
 * Handles the empty-clause case correctly (adds the leading WHERE).
 */
const whereFor = (f, { excludeCancelled = false } = {}) => {
  const base = buildWhere(f);
  if (!excludeCancelled) return base;
  if (base.whereSql) {
    return {
      whereSql: `${base.whereSql} AND o.status <> 'cancelled'`,
      params: base.params,
    };
  }
  return { whereSql: "WHERE o.status <> 'cancelled'", params: base.params };
};

/**
 * GET /admin/reports?period=30 | dateFrom=&dateTo=&status=&category_id=&page=&limit=
 * Professional e-commerce analytics for the admin Reports page.
 */
export const getReports = async (req, res) => {
  try {
    const resolved = resolveFilters(req);
    if (resolved.error) {
      return res.status(400).json({ success: false, message: resolved.error });
    }
    const f = resolved.filters;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;
    if (Number.isNaN(page) || page < 1) {
      return res.status(400).json({ success: false, message: "Page must be a positive integer" });
    }
    if (Number.isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const { whereSql } = buildWhere(f);

    // ---------- summary KPIs ----------
    const [[summary]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END), 0) AS revenue,
         COUNT(*) AS orders,
         COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) AS completed_orders,
         COALESCE(SUM(CASE WHEN status IN ('pending', 'processing') THEN 1 ELSE 0 END), 0) AS pending_orders,
         COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_orders,
         COALESCE(SUM(total), 0) AS order_total,
         COUNT(DISTINCT user_id) AS customers_with_orders
       FROM orders o
       ${whereSql}`,
      buildWhere(f).params
    );

    const [[salesRow]] = await pool.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) AS items_sold
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       ${whereFor(f, { excludeCancelled: true }).whereSql}`,
      whereFor(f, { excludeCancelled: true }).params
    );
    const items_sold = Number(salesRow?.items_sold || 0);

    const revenue = Number(summary.revenue || 0);

    const [[prevRow]] = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END), 0) AS revenue
       FROM orders o
       ${buildWhere({
         ...f,
         dateFrom: f.prevFrom,
         dateTo: f.prevTo,
       }).whereSql}`,
      buildWhere({
        ...f,
        dateFrom: f.prevFrom,
        dateTo: f.prevTo,
      }).params
    );

    const [[customerRow]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at >= CONCAT(?, ' 00:00:00') AND created_at <= CONCAT(?, ' 23:59:59')) AS new_customers,
         (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers`,
      [f.dateFrom, f.dateTo]
    );

    const orders = Number(summary.orders || 0);
    const avgOrderValue = orders > 0 ? revenue / orders : 0;

    // ---------- revenue / orders over time ----------
    const [revenueByDayRows] = await pool.query(
      `SELECT DATE(created_at) AS day, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
       FROM orders o
       ${whereFor(f, { excludeCancelled: true }).whereSql}
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      whereFor(f, { excludeCancelled: true }).params
    );

    const [ordersByDayRows] = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue
       FROM orders o
       ${whereSql}
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      buildWhere(f).params
    );

    // ---------- order status breakdown ----------
    const [ordersByStatusRows] = await pool.query(
      `SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue
       FROM orders o
       ${whereSql}
       GROUP BY status`,
      buildWhere(f).params
    );

    // ---------- payment methods ----------
    const [paymentRows] = await pool.query(
      `SELECT CASE
         WHEN payment_method = 'cod' THEN 'COD'
         WHEN payment_method IS NULL OR payment_method = '' THEN 'Unknown'
         ELSE payment_method
       END AS method,
       COUNT(*) AS count,
       COALESCE(SUM(total), 0) AS revenue
       FROM orders o
       ${whereSql}
       GROUP BY method
       ORDER BY revenue DESC`,
      buildWhere(f).params
    );

    // ---------- top products ----------
    const [topProductRows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price,
              COALESCE(SUM(oi.quantity), 0) AS qty,
              COALESCE(SUM(oi.subtotal), 0) AS revenue,
              (SELECT pi.image FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id LIMIT 1) AS image
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       INNER JOIN products p ON p.id = oi.product_id
       ${whereFor(f, { excludeCancelled: true }).whereSql}
       GROUP BY p.id, p.name, p.slug, p.price, image
       ORDER BY revenue DESC
       LIMIT 10`,
      whereFor(f, { excludeCancelled: true }).params
    );

    // ---------- top categories ----------
    const [topCategoryRows] = await pool.query(
      `SELECT c.id, c.name, c.slug,
              COALESCE(SUM(oi.quantity), 0) AS qty,
              COALESCE(SUM(oi.subtotal), 0) AS revenue,
              COUNT(DISTINCT o.id) AS orders
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       INNER JOIN products p ON p.id = oi.product_id
       INNER JOIN categories c ON c.id = p.category_id
       ${whereFor(f, { excludeCancelled: true }).whereSql}
       GROUP BY c.id, c.name, c.slug
       ORDER BY revenue DESC
       LIMIT 10`,
      whereFor(f, { excludeCancelled: true }).params
    );

    // ---------- sales by gender ----------
    const [genderRows] = await pool.query(
      `SELECT p.gender,
              COALESCE(SUM(oi.quantity), 0) AS qty,
              COALESCE(SUM(oi.subtotal), 0) AS revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       INNER JOIN products p ON p.id = oi.product_id
       ${whereFor(f, { excludeCancelled: true }).whereSql} AND p.gender IS NOT NULL
       GROUP BY p.gender
       ORDER BY revenue DESC`,
      whereFor(f, { excludeCancelled: true }).params
    );

    // ---------- top customers ----------
    const [topCustomerRows] = await pool.query(
      `SELECT u.id, u.name, u.email,
              COUNT(DISTINCT o.id) AS orders,
              COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END), 0) AS spent
       FROM orders o
       INNER JOIN users u ON u.id = o.user_id
       ${whereSql} AND o.user_id IS NOT NULL
       GROUP BY u.id, u.name, u.email
       ORDER BY spent DESC
       LIMIT 10`,
      [...buildWhere(f).params]
    );

    // ---------- monthly performance ----------
    const [monthlyRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              COUNT(*) AS orders,
              COALESCE(SUM(CASE WHEN status <> 'cancelled' THEN total ELSE 0 END), 0) AS revenue
       FROM orders o
       ${f.dateFrom ? `${whereSql}` : "WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)"}
       GROUP BY month
       ORDER BY month ASC`,
      f.dateFrom ? buildWhere(f).params : []
    );

    const [customerRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM users
       WHERE role = 'customer'
         AND created_at >= CONCAT(?, ' 00:00:00') AND created_at <= CONCAT(?, ' 23:59:59')
       GROUP BY month
       ORDER BY month ASC`,
      [f.dateFrom, f.dateTo]
    );

    // ---------- report table (paginated orders) ----------
    const [[tableTotalRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM orders o ${whereSql}`,
      buildWhere(f).params
    );
    const tableTotal = Number(tableTotalRow.total || 0);
    const tablePages = Math.max(1, Math.ceil(tableTotal / limit));
    const currentTablePage = Math.min(page, tablePages);
    const offset = (currentTablePage - 1) * limit;

    const [reportRows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
              o.subtotal, o.shipping_fee, o.discount, o.total, o.created_at,
              u.name AS customer_name, u.email AS customer_email
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ${whereSql}
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT ? OFFSET ?`,
      [...buildWhere(f).params, limit, offset]
    );

    const [tableItemCounts] = await pool.query(
      `SELECT order_id, COUNT(*) AS items, COALESCE(SUM(quantity), 0) AS units
       FROM order_items
       WHERE order_id IN (?)
       GROUP BY order_id`,
      [reportRows.length ? reportRows.map((r) => r.id) : [0]]
    );
    const itemCountMap = new Map(tableItemCounts.map((r) => [Number(r.order_id), r]));

    const reportTable = reportRows.map((row) => ({
      id: Number(row.id),
      order_number: row.order_number,
      status: row.status,
      payment_method: row.payment_method,
      customer: row.customer_name ? { name: row.customer_name, email: row.customer_email } : null,
      items: Number(itemCountMap.get(Number(row.id))?.items || 0),
      units: Number(itemCountMap.get(Number(row.id))?.units || 0),
      subtotal: Number(row.subtotal),
      shipping_fee: Number(row.shipping_fee),
      discount: Number(row.discount),
      total: Number(row.total),
      created_at: row.created_at,
    }));

    const byStatus = ordersByStatusRows.map((row) => ({
      status: row.status,
      label: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      count: Number(row.count || 0),
      revenue: Number(row.revenue || 0),
      pct: orders > 0 ? Number((((Number(row.count) || 0) / orders) * 100).toFixed(1)) : 0,
    }));

    return res.json({
      success: true,
      message: "Reports retrieved successfully",
      data: {
        filters: {
          dateFrom: f.dateFrom,
          dateTo: f.dateTo,
          status: f.status || null,
          category_id: f.category || null,
        },
        summary: {
          revenue,
          orders,
          completed_orders: Number(summary.completed_orders || 0),
          pending_orders: Number(summary.pending_orders || 0),
          cancelled_orders: Number(summary.cancelled_orders || 0),
          items_sold,
          avg_order_value: Number(avgOrderValue.toFixed(2)),
          new_customers: Number(customerRow.new_customers || 0),
          total_customers: Number(customerRow.total_customers || 0),
          customers_with_orders: Number(summary.customers_with_orders || 0),
          prev_revenue: Number(prevRow?.revenue || 0),
        },
        revenueByDay: revenueByDayRows.map((row) => ({
          day: row.day,
          revenue: Number(row.revenue || 0),
          orders: Number(row.orders || 0),
        })),
        ordersByDay: ordersByDayRows.map((row) => ({
          day: row.day,
          orders: Number(row.orders || 0),
          revenue: Number(row.revenue || 0),
        })),
        ordersByStatus: byStatus,
        paymentMethods: paymentRows.map((row) => ({
          method: row.method,
          count: Number(row.count || 0),
          revenue: Number(row.revenue || 0),
        })),
        topProducts: topProductRows.map((row) => ({
          id: Number(row.id),
          name: row.name,
          slug: row.slug,
          price: Number(row.price),
          qty: Number(row.qty || 0),
          revenue: Number(row.revenue || 0),
          image: row.image || null,
        })),
        topCategories: topCategoryRows.map((row) => ({
          id: Number(row.id),
          name: row.name,
          slug: row.slug,
          qty: Number(row.qty || 0),
          revenue: Number(row.revenue || 0),
          orders: Number(row.orders || 0),
        })),
        salesByGender: genderRows.map((row) => ({
          gender: row.gender,
          qty: Number(row.qty || 0),
          revenue: Number(row.revenue || 0),
        })),
        topCustomers: topCustomerRows.map((row) => ({
          id: Number(row.id),
          name: row.name,
          email: row.email,
          orders: Number(row.orders || 0),
          spent: Number(row.spent || 0),
        })),
        monthly: monthlyRows.map((row) => ({
          month: row.month,
          orders: Number(row.orders || 0),
          revenue: Number(row.revenue || 0),
        })),
        customersByMonth: customerRows.map((row) => ({
          month: row.month,
          count: Number(row.count || 0),
        })),
        reportTable,
        reportPagination: {
          page: currentTablePage,
          limit,
          total: tableTotal,
          totalPages: tablePages,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve reports" });
  }
};

/**
 * GET /admin/reports/export?dateFrom=&dateTo=&status=&category_id=
 * Streams a CSV (Excel-compatible) export of the filtered report table.
 */
const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const formatCsvDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toISOString().replace("T", " ").slice(0, 16);
  } catch {
    return value;
  }
};

export const getReportsExport = async (req, res) => {
  try {
    const resolved = resolveFilters(req);
    if (resolved.error) {
      return res.status(400).json({ success: false, message: resolved.error });
    }
    const f = resolved.filters;
    const { whereSql } = buildWhere(f);

    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
              o.subtotal, o.shipping_fee, o.discount, o.total, o.created_at,
              u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ${whereSql}
       ORDER BY o.created_at ASC, o.id ASC`,
      buildWhere(f).params
    );

    const [countRows] = await pool.query(
      `SELECT order_id, COUNT(*) AS items, COALESCE(SUM(quantity), 0) AS units
       FROM order_items
       WHERE order_id IN (?)
       GROUP BY order_id`,
      [rows.length ? rows.map((r) => r.id) : [0]]
    );
    const countMap = new Map(countRows.map((r) => [Number(r.order_id), r]));

    const headers = [
      "Order ID",
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Items",
      "Units",
      "Subtotal (Rs.)",
      "Shipping (Rs.)",
      "Discount (Rs.)",
      "Total (Rs.)",
      "Payment Method",
      "Payment Status",
      "Order Status",
    ];

    const lines = [headers.join(",")];
    for (const row of rows) {
      lines.push(
        [
          row.id,
          row.order_number,
          formatCsvDate(row.created_at),
          row.customer_name || "",
          row.customer_email || "",
          row.customer_phone || "",
          countMap.get(Number(row.id))?.items || 0,
          countMap.get(Number(row.id))?.units || 0,
          Number(row.subtotal),
          Number(row.shipping_fee),
          Number(row.discount),
          Number(row.total),
          row.payment_method,
          row.payment_status,
          row.status,
        ]
          .map(csvCell)
          .join(",")
      );
    }

    const dateLabel = `${f.dateFrom || "all"}_to_${f.dateTo || "all"}`;
    const statusLabel = f.status || "all_statuses";
    const fileName = `winterstore_report_${dateLabel}_${statusLabel}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("X-Report-Row-Count", String(rows.length));
    res.send(`\ufeff${lines.join("\r\n")}`);
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to export reports" });
  }
};