import { pool } from "../config/db.js";
import { isValidId } from "../utils/helpers.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

export const getCustomers = async (req, res) => {
  try {
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

    const where = ["u.role = 'customer'"];
    const params = [];

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const term = `%${search}%`;
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
      params.push(term, term, term);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM users u
       ${whereSql}`,
      params
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at,
              (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
              (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id = u.id AND o.status <> 'cancelled') AS total_spent,
              (SELECT MAX(o.created_at) FROM orders o WHERE o.user_id = u.id) AS latest_order_at
       FROM users u
       ${whereSql}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[summary]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total,
        (SELECT COUNT(DISTINCT o.user_id)
         FROM orders o
         INNER JOIN users u ON u.id = o.user_id
         WHERE o.user_id IS NOT NULL AND u.role = 'customer') AS with_orders,
        (SELECT COUNT(*) FROM users WHERE role = 'customer'
         AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS new_this_month
    `);

    return res.json({
      success: true,
      message: "Customers retrieved successfully",
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone || null,
        created_at: row.created_at,
        order_count: Number(row.order_count || 0),
        total_spent: Number(row.total_spent || 0),
        latest_order_at: row.latest_order_at || null,
      })),
      summary: {
        total: Number(summary.total || 0),
        withOrders: Number(summary.with_orders || 0),
        newThisMonth: Number(summary.new_this_month || 0),
      },
      pagination: { page: currentPage, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve customers" });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid customer id is required" });
    }

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at,
              (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
              (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id = u.id AND o.status <> 'cancelled') AS total_spent
       FROM users u
       WHERE u.id = ? AND u.role = 'customer'`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const customer = rows[0];

    const [orderRows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.total, o.created_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.id DESC
       LIMIT 10`,
      [id]
    );

    const [addressRows] = await pool.query(
      `SELECT id, full_name, phone, address, city, postal_code, created_at, updated_at
       FROM addresses
       WHERE user_id = ?
       ORDER BY id DESC`,
      [id]
    );

    return res.json({
      success: true,
      message: "Customer retrieved successfully",
      data: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || null,
        created_at: customer.created_at,
        order_count: Number(customer.order_count || 0),
        total_spent: Number(customer.total_spent || 0),
        recent_orders: orderRows.map((row) => ({
          id: row.id,
          order_number: row.order_number,
          status: row.status,
          payment_status: row.payment_status,
          total: Number(row.total),
          created_at: row.created_at,
        })),
        addresses: addressRows.map((row) => ({
          id: Number(row.id),
          full_name: row.full_name,
          phone: row.phone ?? null,
          address: row.address,
          city: row.city,
          postal_code: row.postal_code ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve customer" });
  }
};