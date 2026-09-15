import { pool } from "../config/db.js";
import { isValidId } from "../utils/helpers.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;

const REVIEW_STATUSES = ["pending", "approved", "rejected"];

const recalcProductRatings = async (connection, productId) => {
  await connection.execute(
    `UPDATE products
     SET rating = (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews WHERE product_id = ? AND status = 'approved'),
         reviews = (SELECT COUNT(*) FROM reviews WHERE product_id = ? AND status = 'approved')
     WHERE id = ?`,
    [productId, productId, productId]
  );
};

export const getReviews = async (req, res) => {
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
      if (!REVIEW_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${REVIEW_STATUSES.join(", ")}`,
        });
      }
      where.push("r.status = ?");
      params.push(status);
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const term = `%${search}%`;
      where.push("(u.name LIKE ? OR u.email LIKE ? OR p.name LIKE ?)");
      params.push(term, term, term);
    }

    if (req.query.rating !== undefined && req.query.rating !== "") {
      const rating = Number(req.query.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "rating filter must be an integer between 1 and 5",
        });
      }
      where.push("r.rating = ?");
      params.push(rating);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       ${whereSql}`,
      params
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.status, r.created_at, r.updated_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email,
              p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
              (SELECT pi.image FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.id LIMIT 1) AS product_image
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       ${whereSql}
       ORDER BY r.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM reviews) AS allCount,
        (SELECT COUNT(*) FROM reviews WHERE status = 'pending') AS pending,
        (SELECT COUNT(*) FROM reviews WHERE status = 'approved') AS approved,
        (SELECT COUNT(*) FROM reviews WHERE status = 'rejected') AS rejected
    `);

    return res.json({
      success: true,
      message: "Reviews retrieved successfully",
      data: rows.map((row) => ({
        id: Number(row.id),
        rating: Number(row.rating),
        comment: row.comment,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user: {
          id: Number(row.user_id),
          name: row.user_name,
          email: row.user_email,
        },
        product: {
          id: Number(row.product_id),
          name: row.product_name,
          slug: row.product_slug,
          image: row.product_image || null,
        },
      })),
      counts: {
        all: Number(counts.allCount || 0),
        pending: Number(counts.pending || 0),
        approved: Number(counts.approved || 0),
        rejected: Number(counts.rejected || 0),
      },
      pagination: { page: currentPage, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve reviews" });
  }
};

export const updateReviewStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid review id is required" });
    }

    const status = typeof req.body?.status === "string" ? req.body.status.trim().toLowerCase() : "";
    if (!REVIEW_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${REVIEW_STATUSES.join(", ")}`,
      });
    }

    const [rows] = await pool.query(
      "SELECT id, product_id, status FROM reviews WHERE id = ?",
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    const review = rows[0];
    if (review.status === status) {
      return res.status(400).json({ success: false, message: `Review is already ${status}` });
    }

    await connection.beginTransaction();
    await connection.execute("UPDATE reviews SET status = ? WHERE id = ?", [status, id]);
    await recalcProductRatings(connection, review.product_id);
    await connection.commit();

    const productId = review.product_id;
    const [latest] = await pool.query(
      "SELECT id, product_id, status FROM reviews WHERE id = ?",
      [id]
    );

    return res.json({
      success: true,
      message: `Review marked as ${status}`,
      data: {
        id: Number(latest[0].id),
        product_id: Number(latest[0].product_id),
        status: latest[0].status,
      },
    });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ success: false, message: "Failed to update review" });
  } finally {
    connection.release();
  }
};

export const deleteReview = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid review id is required" });
    }

    const [rows] = await pool.query(
      "SELECT id, product_id FROM reviews WHERE id = ?",
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    const review = rows[0];

    await connection.beginTransaction();
    await connection.execute("DELETE FROM reviews WHERE id = ?", [id]);
    await recalcProductRatings(connection, review.product_id);
    await connection.commit();

    return res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ success: false, message: "Failed to delete review" });
  } finally {
    connection.release();
  }
};

export const getFeedback = async (req, res) => {
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

    if (req.query.rating !== undefined && req.query.rating !== "") {
      const rating = Number(req.query.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "rating filter must be an integer between 1 and 5",
        });
      }
      where.push("f.rating = ?");
      params.push(rating);
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const term = `%${search}%`;
      where.push("(f.name LIKE ? OR f.email LIKE ? OR f.message LIKE ?)");
      params.push(term, term, term);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM feedback f ${whereSql}`,
      params
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await pool.query(
      `SELECT f.id, f.user_id, f.name, f.email, f.rating, f.message, f.created_at,
              u.name AS account_name
       FROM feedback f
       LEFT JOIN users u ON u.id = f.user_id
       ${whereSql}
       ORDER BY f.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[counts]] = await pool.query(
      `SELECT
        COUNT(*) AS allCount,
        COALESCE(SUM(rating = 5), 0) AS five,
        COALESCE(SUM(rating = 4), 0) AS four,
        COALESCE(SUM(rating = 3), 0) AS three,
        COALESCE(SUM(rating = 2), 0) AS two,
        COALESCE(SUM(rating = 1), 0) AS one,
        COALESCE(ROUND(AVG(rating), 1), 0) AS average
       FROM feedback`
    );

    return res.json({
      success: true,
      message: "Feedback retrieved successfully",
      data: rows.map((row) => ({
        id: Number(row.id),
        user_id: row.user_id === null ? null : Number(row.user_id),
        account_name: row.account_name || null,
        name: row.name,
        email: row.email,
        rating: Number(row.rating),
        message: row.message,
        created_at: row.created_at,
      })),
      summary: {
        all: Number(counts.allCount || 0),
        distribution: {
          "5": Number(counts.five),
          "4": Number(counts.four),
          "3": Number(counts.three),
          "2": Number(counts.two),
          "1": Number(counts.one),
        },
        average: Number(counts.average || 0),
      },
      pagination: { page: currentPage, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve feedback" });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid feedback id is required" });
    }

    const [rows] = await pool.query("SELECT id FROM feedback WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    await pool.execute("DELETE FROM feedback WHERE id = ?", [id]);
    return res.json({ success: true, message: "Feedback deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete feedback" });
  }
};