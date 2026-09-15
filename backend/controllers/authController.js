import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 72;

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const signToken = (id) => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in .env. Set it before using authentication.");
  }
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  role: user.role,
});

export const registerUser = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
      });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'customer', ?)",
      [name, email, hashedPassword, phone || null]
    );

    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role FROM users WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: safeUser(rows[0]),
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (!rows.length) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const token = signToken(user.id);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }
    return res.json({
      success: true,
      message: "Authenticated user",
      user: safeUser(rows[0]),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

export const logoutUser = (req, res) => {
  res.json({
    success: true,
    message: "Logout successful. The JWT is stateless; remove the token from the client.",
  });
};

export const updateMe = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
    const email =
      typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : undefined;
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : undefined;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({ success: false, message: "Name cannot be empty" });
      }
      updates.push("name = ?");
      values.push(name);
    }

    if (email !== undefined) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ success: false, message: "A valid email is required" });
      }
      const [dup] = await pool.query(
        "SELECT id FROM users WHERE email = ? AND id <> ?",
        [email, req.user.id]
      );
      if (dup.length) {
        return res.status(409).json({ success: false, message: "Email is already registered" });
      }
      updates.push("email = ?");
      values.push(email);
    }

    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone || null);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    values.push(req.user.id);
    await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const [rows] = await pool.query(
      "SELECT id, name, email, phone, role FROM users WHERE id = ?",
      [req.user.id]
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser(rows[0]),
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};