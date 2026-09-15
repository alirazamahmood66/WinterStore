import { pool } from "../config/db.js";
import { isValidId } from "../utils/helpers.js";

const LOW_STOCK_THRESHOLD = 5;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const SORTS = {
  id_asc: "p.id ASC",
  name_asc: "p.name ASC",
  name_desc: "p.name DESC",
  stock_asc: "p.stock ASC, p.name ASC",
  stock_desc: "p.stock DESC, p.name ASC",
  category_asc: "c.name ASC, p.name ASC",
  updated_desc: "p.updated_at DESC, p.id DESC",
};

const buildInventoryFilters = (req) => {
  const where = [];
  const params = [];
  const summaryWhere = [];
  const summaryParams = [];

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  if (search) {
    const term = `%${search}%`;
    where.push("(p.name LIKE ? OR p.slug LIKE ? OR p.description LIKE ?)");
    params.push(term, term, term);
    summaryWhere.push("(p.name LIKE ? OR p.slug LIKE ? OR p.description LIKE ?)");
    summaryParams.push(term, term, term);
  }

  if (req.query.category_id !== undefined && req.query.category_id !== "") {
    const categoryId = Number(req.query.category_id);
    if (!isValidId(categoryId)) {
      return { error: "A valid category_id is required" };
    }
    where.push("p.category_id = ?");
    params.push(categoryId);
    summaryWhere.push("p.category_id = ?");
    summaryParams.push(categoryId);
  }

  if (req.query.stock_status !== undefined && req.query.stock_status !== "") {
    const status = String(req.query.stock_status).toLowerCase();
    if (status === "in") {
      where.push("p.stock > ?");
      params.push(LOW_STOCK_THRESHOLD);
    } else if (status === "low") {
      where.push("p.stock BETWEEN 1 AND ?");
      params.push(LOW_STOCK_THRESHOLD);
    } else if (status === "out") {
      where.push("p.stock = ?");
      params.push(0);
    } else {
      return { error: "stock_status must be one of: in, low, out" };
    }
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
    summaryWhereSql: summaryWhere.length ? `WHERE ${summaryWhere.join(" AND ")}` : "",
    summaryParams,
  };
};

const stockStatus = (stock) => {
  const value = Number(stock);
  if (value === 0) return "out";
  if (value <= LOW_STOCK_THRESHOLD) return "low";
  return "in";
};

export const getInventory = async (req, res) => {
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

    const sortKey = typeof req.query.sort === "string" && SORTS[req.query.sort]
      ? req.query.sort
      : "name_asc";

    const filters = buildInventoryFilters(req);
    if (filters.error) {
      return res.status(400).json({ success: false, message: filters.error });
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${filters.whereSql}`,
      filters.params
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.stock, p.price, p.old_price, p.gender, p.created_at, p.updated_at,
              c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
              (SELECT image FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id LIMIT 1) AS image
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${filters.whereSql}
       ORDER BY ${SORTS[sortKey]}
       LIMIT ? OFFSET ?`,
      [...filters.params, limit, offset]
    );

    const [[summary]] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock,
         COALESCE(SUM(CASE WHEN stock BETWEEN 1 AND ? THEN 1 ELSE 0 END), 0) AS low_stock,
         COALESCE(SUM(CASE WHEN stock > ? THEN 1 ELSE 0 END), 0) AS in_stock,
         COUNT(DISTINCT p.category_id) AS categories
       FROM products p
       ${filters.summaryWhereSql}`,
      [...filters.summaryParams, LOW_STOCK_THRESHOLD, LOW_STOCK_THRESHOLD]
    );

    return res.json({
      success: true,
      message: "Inventory retrieved successfully",
      data: rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        slug: row.slug,
        image: row.image || null,
        stock: Number(row.stock),
        price: Number(row.price),
        old_price: row.old_price === null || row.old_price === undefined ? null : Number(row.old_price),
        gender: row.gender,
        stock_status: stockStatus(row.stock),
        category: row.category_id
          ? { id: Number(row.category_id), name: row.category_name, slug: row.category_slug }
          : null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      summary: {
        total: Number(summary.total || 0),
        in_stock: Number(summary.in_stock || 0),
        low_stock: Number(summary.low_stock || 0),
        out_of_stock: Number(summary.out_of_stock || 0),
        categories: Number(summary.categories || 0),
      },
      pagination: { page: currentPage, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve inventory" });
  }
};