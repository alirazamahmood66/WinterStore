import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "schema.sql");

const db = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "winterstore",
};

const connection = await mysql.createConnection({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  multipleStatements: true,
});

try {
  const [exists] = await connection.query("SHOW DATABASES LIKE ?", [db.database]);
  if (!exists.length) {
    console.error(`[db] Database "${db.database}" does not exist.`);
    console.error(`[db] Create it first in phpMyAdmin: CREATE DATABASE ${db.database};`);
    process.exit(1);
  }

  await connection.query(`USE \`${db.database}\``);

  const sql = await readFile(schemaPath, "utf8");
  console.log(`[db] Applying schema to ${db.host}:${db.port}/${db.database} ...`);
  await connection.query(sql);
  console.log("[db] Schema applied (CREATE TABLE IF NOT EXISTS - no duplicates created).");

  const [tables] = await connection.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",
    [db.database]
  );
  console.log(`[db] Tables (${tables.length}): ${tables.map((t) => t.table_name).join(", ")}`);

  const [fkRows] = await connection.query(
    `SELECT table_name, constraint_name, referenced_table_name
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE table_schema = ? AND referenced_table_name IS NOT NULL
     ORDER BY table_name`,
    [db.database]
  );
  console.log(`[db] Foreign keys (${fkRows.length}):`);
  for (const fk of fkRows) {
    console.log(`      - ${fk.table_name}.${fk.constraint_name} -> ${fk.referenced_table_name}`);
  }

  const [idxRows] = await connection.query(
    `SELECT table_name, COUNT(DISTINCT index_name) AS index_count
     FROM information_schema.statistics
     WHERE table_schema = ?
     GROUP BY table_name ORDER BY table_name`,
    [db.database]
  );
  console.log(`[db] Indexes per table:`);
  for (const idx of idxRows) {
    console.log(`      - ${idx.table_name}: ${idx.index_count}`);
  }
} catch (err) {
  console.error(`[db] Migration failed: ${err.message}`);
  process.exit(1);
} finally {
  await connection.end();
}