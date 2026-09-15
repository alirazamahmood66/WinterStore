import { pool } from "../config/db.js";

const ORDER_STATUSES = [
  { status: "pending", label: "Pending" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
  { status: "cancelled", label: "Cancelled" },
];

const LOW_STOCK_THRESHOLD = 5;

export const getStats = async (req, res) => {
  try {
    const [[{ products, orders, customers, revenue }]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS customers,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled') AS revenue
    `);

    const [[revenuePeriodsRow]] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled' AND created_at >= CURRENT_DATE) AS today,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)) AS week,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) AS month
    `);

    const [statusRows] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM orders GROUP BY status"
    );
    const statusCounts = {};
    for (const row of statusRows) statusCounts[row.status] = Number(row.count);
    const orderStatus = ORDER_STATUSES.map((s) => ({
      ...s,
      count: statusCounts[s.status] || 0,
    }));

    const [recentRows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.total, o.created_at,
              u.name AS customer_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.id DESC
       LIMIT 8`
    );
    const recentOrders = recentRows.map((row) => ({
      id: row.id,
      order_number: row.order_number,
      customer: row.customer_name || "Guest",
      total: Number(row.total),
      status: row.status,
      payment_status: row.payment_status,
      created_at: row.created_at,
    }));

    const [lowStockRows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.stock,
              c.name AS category_name, c.slug AS category_slug,
              (SELECT image FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id LIMIT 1) AS image
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.stock <= ?
       ORDER BY p.stock ASC, p.updated_at DESC
       LIMIT 8`,
      [LOW_STOCK_THRESHOLD]
    );
    const lowStock = lowStockRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: Number(row.price),
      stock: Number(row.stock),
      image: row.image || null,
      category: row.category_name ? { name: row.category_name, slug: row.category_slug } : null,
    }));

    return res.json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: {
        counts: {
          products: Number(products),
          orders: Number(orders),
          customers: Number(customers),
          revenue: Number(revenue),
        },
        revenuePeriods: {
          today: Number(revenuePeriodsRow.today),
          week: Number(revenuePeriodsRow.week),
          month: Number(revenuePeriodsRow.month),
        },
        orderStatus,
        recentOrders,
        lowStock,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve dashboard stats" });
  }
};