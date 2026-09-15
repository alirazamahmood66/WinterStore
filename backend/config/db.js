import mysql from "mysql2/promise";

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "winterstore",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const pool = mysql.createPool(config);

export const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query("SELECT 1 AS ok");
    conn.release();
    console.log(`[db] MySQL connected: ${config.host}:${config.port}/${config.database} (SELECT 1 -> ${rows[0].ok})`);
  } catch (err) {
    console.error(`[db] MySQL connection failed: ${err.message}`);
    console.error(`[db] Target: ${config.host}:${config.port} user=${config.user} database=${config.database}`);
    console.error("[db] Make sure MySQL is running and the database exists.");
    console.error('[db] Create the database in phpMyAdmin with: CREATE DATABASE winterstore;');
  }
};