import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pool } from "../config/db.js";
import { slugify } from "../utils/helpers.js";

const CATALOG_PATH = resolve(process.cwd(), "../frontend/src/data/products.json");

const genderMap = (gender) =>
  String(gender || "").toLowerCase() === "men"
    ? "men"
    : String(gender || "").toLowerCase() === "women"
      ? "women"
      : String(gender || "").toLowerCase() === "kids"
        ? "kids"
        : "unisex";

const toBool = (value) => (value ? 1 : 0);

const CATALOG_COLUMNS = [
  ["is_new", "TINYINT(1) NOT NULL DEFAULT 0"],
  ["badge", "VARCHAR(60) DEFAULT NULL"],
  ["alt", "VARCHAR(255) DEFAULT NULL"],
  ["rating", "DECIMAL(2,1) DEFAULT NULL"],
  ["reviews", "INT UNSIGNED DEFAULT NULL"],
  ["sizes", "JSON DEFAULT NULL"],
  ["colors", "JSON DEFAULT NULL"],
];

async function ensureCatalogColumns(connection) {
  const [columns] = await connection.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'"
  );
  const existing = new Set(columns.map((c) => c.COLUMN_NAME));
  for (const [name, definition] of CATALOG_COLUMNS) {
    if (existing.has(name)) continue;
    await connection.query(`ALTER TABLE products ADD COLUMN ${name} ${definition}`);
    console.log(`  Added column: products.${name}`);
  }
}

async function run() {
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  } catch (err) {
    console.error(`[sync] Could not read catalog at ${CATALOG_PATH}:`, err.message);
    process.exit(1);
  }

  if (!Array.isArray(catalog) || catalog.length === 0) {
    console.error("[sync] Catalog file has no products.");
    process.exit(1);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("== Step 1: Product metadata columns ==");
    await ensureCatalogColumns(connection);

    console.log("== Step 2: Remove test / QA records ==");

    const [orderDel] = await connection.query(
      "DELETE FROM orders WHERE order_number LIKE '%-QA-%' OR order_number LIKE 'WS-QA%'"
    );
    console.log(`  Deleted QA orders: ${orderDel.affectedRows}`);

    const [itemDel] = await connection.query("DELETE FROM order_items");
    console.log(`  Cleared residual order_items: ${itemDel.affectedRows}`);

    const [piDel] = await connection.query("DELETE FROM product_images");
    console.log(`  Cleared product_images: ${piDel.affectedRows}`);

    const [prodDel] = await connection.query("DELETE FROM products");
    console.log(`  Cleared products: ${prodDel.affectedRows}`);

    const [catDel] = await connection.query("DELETE FROM categories");
    console.log(`  Cleared categories: ${catDel.affectedRows}`);

    const [userDel] = await connection.query(
      `DELETE FROM users
       WHERE role = 'customer'
         AND (
           email LIKE '%@test.com'
           OR email LIKE '%@example.com'
           OR name IN ('Test Customer', 'Sneaky Admin', 'Tester')
         )`
    );
    console.log(`  Deleted test customer accounts: ${userDel.affectedRows}`);

    console.log("== Step 3: Insert real categories ==");

    const distinctNames = [...new Set(catalog.map((p) => p.category).filter(Boolean))].sort();
    const categoryIdByName = {};
    for (const name of distinctNames) {
      const [result] = await connection.query(
        "INSERT INTO categories (name, slug, description, image) VALUES (?, ?, NULL, NULL)",
        [name, slugify(name)]
      );
      categoryIdByName[name] = Number(result.insertId);
    }
    console.log(`  Inserted categories: ${distinctNames.length}`);

    console.log("== Step 4: Insert real products ==");

    let inserted = 0;
    for (const p of catalog) {
      const categoryId = categoryIdByName[p.category];
      if (!categoryId) {
        console.warn(`  Skipping product without valid category: ${p.name}`);
        continue;
      }
      await connection.query(
        `INSERT INTO products
          (id, category_id, name, slug, description, price, old_price, stock, gender,
           is_featured, is_sale, is_new, badge, alt, rating, reviews, sizes, colors)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(p.id),
          categoryId,
          p.name,
          slugify(p.name),
          p.description || null,
          p.price,
          p.oldPrice && p.oldPrice > 0 ? p.oldPrice : null,
          Number(p.stock) || 0,
          genderMap(p.gender),
          toBool(p.isFeatured),
          toBool(p.isSale),
          toBool(p.isNew),
          p.badge || null,
          p.alt || p.name,
          p.rating != null ? Number(p.rating) : null,
          p.reviews != null ? Number(p.reviews) : null,
          JSON.stringify(p.sizes || []),
          JSON.stringify(p.colors || []),
        ]
      );
      inserted += 1;
    }
    console.log(`  Inserted products: ${inserted}`);

    console.log("== Step 5: Insert product images ==");

    let images = 0;
    for (const p of catalog) {
      if (!p.image) continue;
      await connection.query(
        "INSERT INTO product_images (product_id, image) VALUES (?, ?)",
        [Number(p.id), p.image]
      );
      images += 1;
    }
    console.log(`  Inserted product_images: ${images}`);

    await connection.commit();

    const [[catCount]] = await connection.query("SELECT COUNT(*) AS n FROM categories");
    const [[prodCount]] = await connection.query("SELECT COUNT(*) AS n FROM products");
    const [[orderCount]] = await connection.query("SELECT COUNT(*) AS n FROM orders");
    const [[userCount]] = await connection.query("SELECT COUNT(*) AS n FROM users");
    const [[imgCount]] = await connection.query("SELECT COUNT(*) AS n FROM product_images");

    console.log("== Summary ==");
    console.log(`  categories: ${catCount.n}`);
    console.log(`  products:   ${prodCount.n}`);
    console.log(`  images:     ${imgCount.n}`);
    console.log(`  orders:     ${orderCount.n}`);
    console.log(`  users:      ${userCount.n}`);
  } catch (err) {
    await connection.rollback();
    console.error("[sync] FAILED:", err.message);
    process.exit(1);
  } finally {
    connection.release();
    await pool.end();
  }
}

run();