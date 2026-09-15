import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { isValidId } from "../utils/helpers.js";

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_COMMENT_LENGTH = 2000;

const resolveOptionalUser = async (req) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query("SELECT id, name FROM users WHERE id = ?", [
      decoded.id,
    ]);
    return rows.length ? rows[0] : null;
  } catch {
    return null;
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid product id is required" });
    }

    const [summaryRows] = await pool.query(
      `SELECT COUNT(*) AS count, COALESCE(ROUND(AVG(rating), 1), 0) AS average
       FROM reviews
       WHERE product_id = ? AND status = 'approved'`,
      [id]
    );

    const [reviewRows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.status = 'approved'
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 100`,
      [id]
    );

    const reviews = reviewRows.map((row) => ({
      id: Number(row.id),
      rating: Number(row.rating),
      comment: row.comment,
      userName: row.user_name,
      createdAt: row.created_at,
    }));

    let myReview = null;
    const user = await resolveOptionalUser(req);
    if (user) {
      const [mine] = await pool.query(
        `SELECT id, rating, comment, status, created_at
         FROM reviews
         WHERE user_id = ? AND product_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [user.id, id]
      );
      if (mine.length) {
        myReview = {
          id: Number(mine[0].id),
          rating: Number(mine[0].rating),
          comment: mine[0].comment,
          status: mine[0].status,
          createdAt: mine[0].created_at,
        };
      }
    }

    return res.json({
      success: true,
      message: "Reviews retrieved successfully",
      data: {
        average: Number(summaryRows[0]?.average || 0),
        count: Number(summaryRows[0]?.count || 0),
        reviews,
        myReview,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to retrieve reviews" });
  }
};

export const createReview = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const productId = Number(req.body?.product_id);
    const rating = Number(req.body?.rating);
    const comment =
      typeof req.body?.comment === "string" ? req.body.comment.trim() : "";

    if (!isValidId(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "A valid product id is required" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }
    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "Please write a short review" });
    }
    if (comment.length > MAX_COMMENT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Review must be at most ${MAX_COMMENT_LENGTH} characters`,
      });
    }

    const [products] = await pool.query(
      "SELECT id FROM products WHERE id = ?",
      [productId]
    );
    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const [dupes] = await pool.query(
      "SELECT id FROM reviews WHERE user_id = ? AND product_id = ?",
      [req.user.id, productId]
    );
    if (dupes.length) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO reviews (user_id, product_id, rating, comment, status)
       VALUES (?, ?, ?, ?, 'approved')`,
      [req.user.id, productId, rating, comment]
    );

    await connection.execute(
      `UPDATE products
       SET rating = (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews WHERE product_id = ? AND status = 'approved'),
           reviews = (SELECT COUNT(*) FROM reviews WHERE product_id = ? AND status = 'approved')
       WHERE id = ?`,
      [productId, productId, productId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Thank you for your review!",
      data: {
        id: Number(result.insertId),
        product_id: productId,
        rating,
        comment,
        status: "approved",
      },
    });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({
      success: false,
      message:
        "We couldn't submit your review right now. Please try again later.",
    });
  } finally {
    connection.release();
  }
};