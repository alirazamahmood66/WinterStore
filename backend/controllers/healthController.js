import { pool } from "../config/db.js";

export const getHealth = (req, res) => {
  res.json({
    success: true,
    message: "WinterStore API is running",
  });
};

export const getDatabaseHealth = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({
      success: true,
      message: "Database connected successfully",
      database: process.env.DB_NAME || "winterstore",
      check: rows[0].ok,
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "Database connection failed",
      error: err.message,
      hint: "Make sure MySQL is running and the 'winterstore' database exists. Create it with: CREATE DATABASE winterstore;",
    });
  }
};