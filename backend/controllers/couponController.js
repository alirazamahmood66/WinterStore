import { pool } from "../config/db.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const DISCOUNT_TYPES = ["percent", "fixed"];
const COUPON_STATUSES = ["active", "inactive", "expired"];

const safeCoupon = (row) => ({
  id: Number(row.id),
  code: row.code,
  discount_type: row.discount_type,
  discount_value: Number(row.discount_value),
  minimum_amount: Number(row.minimum_amount || 0),
  expiry_date: row.expiry_date || null,
  usage_limit: row.usage_limit === null ? null : Number(row.usage_limit),
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const normalizeCode = (value) =>
  typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "-") : "";

const validateCouponBody = (body, { partial } = {}) => {
  const errors = [];
  const data = {};

  const require = (field) => !partial || body[field] !== undefined;

  if (require("code")) {
    const code = normalizeCode(body.code);
    if (!code) {
      errors.push("Coupon code is required");
    } else if (code.length > 50) {
      errors.push("Coupon code must be 50 characters or fewer");
    } else {
      data.code = code;
    }
  }

  if (require("discount_type")) {
    const type = String(body.discount_type).toLowerCase();
    if (!DISCOUNT_TYPES.includes(type)) {
      errors.push(`Discount type must be one of: ${DISCOUNT_TYPES.join(", ")}`);
    } else {
      data.discount_type = type;
    }
  }

  if (require("discount_value")) {
    const value = Number(body.discount_value);
    if (body.discount_value === "" || body.discount_value === null || Number.isNaN(value) || value < 0) {
      errors.push("Discount value must be a number greater than or equal to 0");
    } else if (data.discount_type === "percent" && value > 100) {
      errors.push("Percentage discount cannot exceed 100");
    } else {
      data.discount_value = value;
    }
  }

  if (body.minimum_amount !== undefined && body.minimum_amount !== null && body.minimum_amount !== "") {
    const min = Number(body.minimum_amount);
    if (Number.isNaN(min) || min < 0) {
      errors.push("Minimum amount must be a number greater than or equal to 0");
    } else {
      data.minimum_amount = min;
    }
  } else if (require("minimum_amount")) {
    data.minimum_amount = 0;
  }

  if (body.expiry_date !== undefined && body.expiry_date !== null && body.expiry_date !== "") {
    const date = String(body.expiry_date).trim();
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
    if (!iso || Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime())) {
      errors.push("Expiry date must be a valid date (YYYY-MM-DD)");
    } else {
      data.expiry_date = iso;
    }
  }

  if (body.usage_limit !== undefined && body.usage_limit !== null && body.usage_limit !== "") {
    const limit = Number(body.usage_limit);
    if (!Number.isInteger(limit) || limit < 1) {
      errors.push("Usage limit must be a positive whole number");
    } else {
      data.usage_limit = limit;
    }
  } else if (require("usage_limit")) {
    data.usage_limit = null;
  }

  if (body.status !== undefined && body.status !== null && body.status !== "") {
    const status = String(body.status).toLowerCase();
    if (!COUPON_STATUSES.includes(status)) {
      errors.push(`Status must be one of: ${COUPON_STATUSES.join(", ")}`);
    } else {
      data.status = status;
    }
  } else if (require("status")) {
    data.status = "active";
  }

  return { errors, data };
};

export const getCoupons = async (req, res) => {
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

    const where = [];
    const params = [];

    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    if (status) {
      if (!COUPON_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${COUPON_STATUSES.join(", ")}`,
        });
      }
      where.push("status = ?");
      params.push(status);
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      where.push("code LIKE ?");
      params.push(`%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM coupons ${whereSql}`,
      params
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await pool.query(
      `SELECT * FROM coupons
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM coupons) AS allCount,
        (SELECT COUNT(*) FROM coupons WHERE status = 'active') AS active,
        (SELECT COUNT(*) FROM coupons WHERE status = 'inactive') AS inactive,
        (SELECT COUNT(*) FROM coupons WHERE status = 'expired') AS expired
    `);

    return res.json({
      success: true,
      message: "Coupons retrieved successfully",
      data: rows.map(safeCoupon),
      counts: {
        all: Number(counts.allCount || 0),
        active: Number(counts.active || 0),
        inactive: Number(counts.inactive || 0),
        expired: Number(counts.expired || 0),
      },
      pagination: { page: currentPage, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve coupons" });
  }
};

export const getCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "A valid coupon id is required" });
    }
    const [rows] = await pool.query("SELECT * FROM coupons WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    return res.json({ success: true, message: "Coupon retrieved successfully", data: safeCoupon(rows[0]) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve coupon" });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { errors, data } = validateCouponBody(req.body, { partial: false });
    if (errors.length) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    if (data.expiry_date === undefined) {
      const defaultExpiry = new Date();
      defaultExpiry.setMonth(defaultExpiry.getMonth() + 3);
      data.expiry_date = defaultExpiry.toISOString().slice(0, 10);
    }

    const [result] = await pool.execute(
      `INSERT INTO coupons (code, discount_type, discount_value, minimum_amount, expiry_date, usage_limit, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.code,
        data.discount_type,
        data.discount_value,
        data.minimum_amount ?? 0,
        data.expiry_date ?? null,
        data.usage_limit ?? null,
        data.status ?? "active",
      ]
    );

    const [rows] = await pool.query("SELECT * FROM coupons WHERE id = ?", [result.insertId]);
    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: safeCoupon(rows[0]),
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "A coupon with this code already exists" });
    }
    return res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "A valid coupon id is required" });
    }

    const [existingRows] = await pool.query("SELECT id FROM coupons WHERE id = ?", [id]);
    if (!existingRows.length) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const { errors, data } = validateCouponBody(req.body, { partial: true });
    if (errors.length) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    if (data.code) {
      const [dups] = await pool.query("SELECT id FROM coupons WHERE code = ? AND id <> ?", [data.code, id]);
      if (dups.length) {
        return res.status(409).json({ success: false, message: "A coupon with this code already exists" });
      }
    }

    const updates = [];
    const values = [];
    for (const field of [
      "code",
      "discount_type",
      "discount_value",
      "minimum_amount",
      "expiry_date",
      "usage_limit",
      "status",
    ]) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    values.push(id);
    await pool.execute(`UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`, values);

    const [rows] = await pool.query("SELECT * FROM coupons WHERE id = ?", [id]);
    return res.json({
      success: true,
      message: "Coupon updated successfully",
      data: safeCoupon(rows[0]),
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "A coupon with this code already exists" });
    }
    return res.status(500).json({ success: false, message: "Failed to update coupon" });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "A valid coupon id is required" });
    }

    const [rows] = await pool.query("SELECT id FROM coupons WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    await pool.execute("DELETE FROM coupons WHERE id = ?", [id]);
    return res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
};