import mysql from "mysql2/promise";

const sslCaRaw = (process.env.DB_SSL_CA || "").trim();
const sslCa = sslCaRaw
  ? sslCaRaw.includes("-----BEGIN CERTIFICATE-----")
    ? sslCaRaw
    : Buffer.from(sslCaRaw, "base64").toString("utf8")
  : null;

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "winterstore",
  ssl: sslCa ? { ca: sslCa } : {},
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 60000,
};

export const pool = mysql.createPool(config);

export const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT 1 AS ok");
    conn.release();
    console.log(`[db] MySQL connected: ${config.host}:${config.port}/${config.database} (SELECT 1 -> ${rows[0].ok})${sslCa ? " ssl=CA-verified" : ""}`);
  } catch (err) {
    console.error(`[db] MySQL connection failed: ${err.message}`);
    console.error(`[db] Target: ${config.host}:${config.port} user=${config.user} database=${config.database} ssl=${sslCa ? "CA-verified" : "default"}`);
    console.error("[db] Make sure MySQL is running and the database exists.");
    console.error('[db] Create the database in phpMyAdmin with: CREATE DATABASE winterstore;');
  }
};