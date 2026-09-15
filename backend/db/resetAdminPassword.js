import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

try {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await pool.execute(
    "UPDATE users SET password = ?, role = 'admin' WHERE email = ?",
    [hashedPassword, email]
  );

  console.log(`[reset:admin] Updated rows: ${result.affectedRows}`);
  console.log(`[reset:admin] Admin password reset for: ${email}`);
} catch (err) {
  console.error("[reset:admin] Failed:", err.message);
} finally {
  await pool.end();
}