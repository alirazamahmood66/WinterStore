import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const name = (process.env.ADMIN_NAME || "").trim();
const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";

if (!name || !email || !password) {
  console.error("[seed:admin] Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env (or environment) first.");
  console.error("[seed:admin] Example: ADMIN_NAME=WinterStore Admin ADMIN_EMAIL=admin@winterstore.com ADMIN_PASSWORD=... npm run seed:admin");
  process.exit(1);
}

if (password.length < 6) {
  console.error("[seed:admin] ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

try {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
    [name, email, hashedPassword]
  );
  console.log(`[seed:admin] Admin created (id ${result.insertId}, email ${email}).`);
} catch (err) {
  if (err.code === "ER_DUP_ENTRY") {
    console.error(`[seed:admin] An admin with email "${email}" already exists. No changes made.`);
  } else {
    console.error(`[seed:admin] Failed: ${err.message}`);
  }
  process.exit(1);
} finally {
  await pool.end();
}