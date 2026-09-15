import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 190;
const MAX_MESSAGE_LENGTH = 5000;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const resolveOptionalUser = async (req) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, name, email FROM users WHERE id = ? AND role = 'customer'",
      [decoded.id]
    );
    return rows.length ? rows[0] : null;
  } catch {
    return null;
  }
};

export const createFeedback = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const rating = Number(req.body.rating);
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    const errors = [];

    if (!name) {
      errors.push("Name is required");
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push(`Name must be at most ${MAX_NAME_LENGTH} characters`);
    }

    if (!email) {
      errors.push("Email is required");
    } else if (email.length > MAX_EMAIL_LENGTH) {
      errors.push("Email must be at most 190 characters");
    } else if (!emailRegex.test(email)) {
      errors.push("Email must be a valid email address");
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push("Rating must be between 1 and 5");
    }

    if (!message) {
      errors.push("Message is required");
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      errors.push(`Message must be at most ${MAX_MESSAGE_LENGTH} characters`);
    }

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const user = await resolveOptionalUser(req);

    const [result] = await pool.execute(
      `INSERT INTO feedback (user_id, name, email, rating, message)
       VALUES (?, ?, ?, ?, ?)`,
      [user ? user.id : null, name, email, rating, message]
    );

    return res.status(201).json({
      success: true,
      message: "Thank you for your feedback!",
      data: { id: Number(result.insertId) },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "We couldn't submit your feedback right now. Please try again.",
    });
  }
};