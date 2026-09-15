import mysql from "mysql2/promise";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

const pool = await mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "winterstore",
});

const LOW_STOCK_THRESHOLD = 5;
const target = {
  60: 0, // Out of stock
  1: 5,
  5: 4,
  9: 4,
  12: 3,
  16: 2,
  20: 5,
  26: 3,
  28: 2,
  34: 4,
  35: 3,
  43: 5,
  45: 2,
  54: 3,
  57: 4,
  65: 5,
  66: 2,
  69: 4,
  70: 3,
};

for (const [id, stock] of Object.entries(target)) {
  await pool.query("UPDATE products SET stock = ? WHERE id = ?", [stock, Number(id)]);
}

const [rows] = await pool.query("SELECT id, name, stock FROM products ORDER BY id");
const buckets = { ok: 0, low: 0, out: 0 };
for (const r of rows) {
  if (r.stock === 0) buckets.out += 1;
  else if (r.stock <= LOW_STOCK_THRESHOLD) buckets.low += 1;
  else buckets.ok += 1;
}

console.log(`total products: ${rows.length}`);
console.log(`In stock (>${LOW_STOCK_THRESHOLD}): ${buckets.ok}`);
console.log(`Low stock (1-${LOW_STOCK_THRESHOLD}): ${buckets.low}`);
console.log(`Out of stock (0): ${buckets.out}`);
console.log("Changed products:");
for (const r of rows) {
  if (target[r.id] !== undefined) console.log(`  id ${r.id} "${r.name}" -> stock ${r.stock}`);
}

await pool.end();