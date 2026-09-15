import { pool } from "../config/db.js";
import { isValidId, slugify, toBoolean, isPlainString } from "../utils/helpers.js";

const GENDERS = ["men", "women", "kids", "unisex"];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 12;
const LOW_STOCK_THRESHOLD = 5;

const safeProduct = (row, images = []) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  price: Number(row.price),
  old_price: row.old_price === null || row.old_price === undefined ? null : Number(row.old_price),
  stock: Number(row.stock),
  gender: row.gender,
  is_featured: row.is_featured ? true : false,
  is_sale: row.is_sale ? true : false,
  is_new: row.is_new ? true : false,
  badge: row.badge ?? null,
  alt: row.alt ?? null,
  rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
  reviews: row.reviews === null || row.reviews === undefined ? null : Number(row.reviews),
  sizes: parseStringList(row.sizes),
  colors: parseStringList(row.colors),
  category: row.category_id
    ? { id: row.category_id, name: row.category_name, slug: row.category_slug }
    : null,
  images,
  image: images.length ? images[0] : null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const parseImageList = (value) => {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v.length <= 255)
    .slice(0, 20);
};

const parseStringList = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").slice(0, 50);
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((v) => typeof v === "string").slice(0, 50);
      }
    } catch {
      // not JSON — ignore
    }
  }
  return [];
};

const NUMBER_ERRORS = {
  price: "Price must be a number greater than or equal to 0",
  old_price: "Old price must be a number greater than or equal to 0",
  stock: "Stock must be a non-negative integer",
};

const validateProductBody = (body, { partial } = {}) => {
  const errors = [];
  const data = {};

  const require = (field) => !partial || body[field] !== undefined;

  if (require("name")) {
    if (!isPlainString(body.name)) {
      errors.push("Name is required");
    } else if (body.name.trim().length > 150) {
      errors.push("Name must be 150 characters or fewer");
    } else {
      data.name = body.name.trim();
    }
  }

  if (require("category_id")) {
    if (!isValidId(body.category_id)) {
      errors.push("A valid category_id is required");
    } else {
      data.category_id = Number(body.category_id);
    }
  }

  if (require("price")) {
    const price = Number(body.price);
    if (body.price === "" || Number.isNaN(price) || price < 0) {
      errors.push(NUMBER_ERRORS.price);
    } else {
      data.price = price;
    }
  }

  if (body.old_price !== undefined && body.old_price !== null && body.old_price !== "") {
    const old = Number(body.old_price);
    if (Number.isNaN(old) || old < 0) {
      errors.push(NUMBER_ERRORS.old_price);
    } else {
      data.old_price = old;
    }
  } else if (require("old_price")) {
    data.old_price = null;
  }

  if (require("stock")) {
    const stock = Number(body.stock);
    if (body.stock === "" || !Number.isInteger(stock) || stock < 0) {
      errors.push(NUMBER_ERRORS.stock);
    } else {
      data.stock = stock;
    }
  }

  if (body.gender !== undefined && body.gender !== null && body.gender !== "") {
    const gender = String(body.gender).toLowerCase();
    if (!GENDERS.includes(gender)) {
      errors.push(`Gender must be one of: ${GENDERS.join(", ")}`);
    } else {
      data.gender = gender;
    }
  } else if (require("gender")) {
    data.gender = "unisex";
  }

  if (body.slug !== undefined && body.slug !== null && body.slug !== "") {
    const slug = body.slug.trim().toLowerCase();
    if (!slug) {
      errors.push("Slug cannot be empty");
    } else {
      data.slug = slug;
    }
  }

  if (body.description !== undefined && body.description !== null && body.description !== "") {
    data.description = String(body.description).trim();
  }

  if (body.is_featured !== undefined) data.is_featured = toBoolean(body.is_featured);
  if (body.is_sale !== undefined) data.is_sale = toBoolean(body.is_sale);

  if (body.is_new !== undefined) data.is_new = toBoolean(body.is_new);

  if (body.badge !== undefined && body.badge !== null) {
    const badge = String(body.badge).trim();
    if (badge.length > 60) {
      errors.push("Badge must be 60 characters or fewer");
    } else {
      data.badge = badge || null;
    }
  }

  if (body.alt !== undefined && body.alt !== null) {
    const alt = String(body.alt).trim();
    if (alt.length > 255) {
      errors.push("Alt text must be 255 characters or fewer");
    } else {
      data.alt = alt || null;
    }
  }

  if (body.rating !== undefined && body.rating !== null && body.rating !== "") {
    const rating = Number(body.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      errors.push("Rating must be a number between 0 and 5");
    } else {
      data.rating = rating;
    }
  }

  if (body.reviews !== undefined && body.reviews !== null && body.reviews !== "") {
    const reviews = Number(body.reviews);
    if (!Number.isInteger(reviews) || reviews < 0) {
      errors.push("Reviews must be a non-negative integer");
    } else {
      data.reviews = reviews;
    }
  }

  if (body.sizes !== undefined) data.sizes = parseStringList(body.sizes);
  if (body.colors !== undefined) data.colors = parseStringList(body.colors);

  return { errors, data };
};

const ensureCategoryExists = async (categoryId) => {
  const [rows] = await pool.query("SELECT id FROM categories WHERE id = ?", [categoryId]);
  return rows.length > 0;
};

const fetchProductWithImages = async (id) => {
  const [rows] = await pool.query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  return rows[0];
};

const fetchImages = async (productId) => {
  const [rows] = await pool.query(
    "SELECT image FROM product_images WHERE product_id = ? ORDER BY id",
    [productId]
  );
  return rows.map((r) => r.image);
};

export const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;

    if (Number.isNaN(page) || page < 1) {
      return res.status(400).json({ success: false, message: "Page must be a positive integer" });
    }
    if (Number.isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const where = [];
    const params = [];

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const term = `%${search}%`;
      where.push("(p.name LIKE ? OR p.slug LIKE ?)");
      params.push(term, term);
    }

    if (req.query.category_id !== undefined && req.query.category_id !== "") {
      const categoryId = Number(req.query.category_id);
      if (!isValidId(categoryId)) {
        return res
          .status(400)
          .json({ success: false, message: "A valid category_id is required" });
      }
      where.push("p.category_id = ?");
      params.push(categoryId);
    }

    if (req.query.stock !== undefined && req.query.stock !== "") {
      const stockFilter = String(req.query.stock).toLowerCase();
      if (stockFilter === "in") {
        where.push("p.stock > ?");
        params.push(LOW_STOCK_THRESHOLD);
      } else if (stockFilter === "low") {
        where.push("p.stock BETWEEN 1 AND ?");
        params.push(LOW_STOCK_THRESHOLD);
      } else if (stockFilter === "out") {
        where.push("p.stock = ?");
        params.push(0);
      } else {
        return res.status(400).json({
          success: false,
          message: 'stock filter must be one of: in, low, out',
        });
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
      params
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const products = [];
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      const [imageRows] = await pool.query(
        `SELECT product_id, image FROM product_images WHERE product_id IN (?)
         ORDER BY id DESC`,
        [ids]
      );
      const imageMap = {};
      for (const img of imageRows) {
        if (!imageMap[img.product_id]) {
          imageMap[img.product_id] = [{ image: img.image }];
        } else {
          imageMap[img.product_id].push({ image: img.image });
        }
      }
      for (const row of rows) {
        products.push(safeProduct(row, imageMap[row.id]?.map((i) => i.image) || []));
      }
    }

    return res.json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
      pagination: { page: currentPage, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve products" });
  }
};

export const getProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid product id is required" });
    }

    const row = await fetchProductWithImages(id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const images = await fetchImages(id);
    return res.json({
      success: true,
      message: "Product retrieved successfully",
      data: safeProduct(row, images),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve product" });
  }
};

export const createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { errors, data } = validateProductBody(req.body, { partial: false });
    if (errors.length) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    data.slug = data.slug || slugify(data.name);

    const categoryExists = await ensureCategoryExists(data.category_id);
    if (!categoryExists) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category_id", errors: ["Category does not exist"] });
    }

    const images = parseImageList(req.body.images);

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO products
        (name, slug, description, price, old_price, stock, gender, is_featured, is_sale, is_new, badge, alt, rating, reviews, sizes, colors, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.slug,
        data.description ?? null,
        data.price,
        data.old_price ?? null,
        data.stock ?? 0,
        data.gender,
        data.is_featured ?? 0,
        data.is_sale ?? 0,
        data.is_new ?? 0,
        data.badge ?? null,
        data.alt ?? null,
        data.rating ?? null,
        data.reviews ?? null,
        data.sizes && data.sizes.length ? JSON.stringify(data.sizes) : null,
        data.colors && data.colors.length ? JSON.stringify(data.colors) : null,
        data.category_id,
      ]
    );

    const productId = Number(result.insertId);

    if (images.length) {
      await connection.query(
        "INSERT INTO product_images (product_id, image) VALUES ?",
        [images.map((img) => [productId, img])]
      );
    }

    await connection.commit();

    const row = await fetchProductWithImages(productId);
    const imgs = await fetchImages(productId);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: safeProduct(row, imgs),
    });
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "A product with this slug already exists" });
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category_id", errors: ["Category does not exist"] });
    }
    return res.status(500).json({ success: false, message: "Failed to create product" });
  } finally {
    connection.release();
  }
};

export const updateProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid product id is required" });
    }

    const existing = await fetchProductWithImages(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const { errors, data } = validateProductBody(req.body, { partial: true });
    if (errors.length) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    if (data.category_id && !(await ensureCategoryExists(data.category_id))) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category_id", errors: ["Category does not exist"] });
    }

    if (data.slug) {
      const [dups] = await pool.query("SELECT id FROM products WHERE slug = ? AND id <> ?", [data.slug, id]);
      if (dups.length) {
        return res.status(409).json({ success: false, message: "A product with this slug already exists" });
      }
    }

    const updates = [];
    const values = [];
    for (const field of [
      "name",
      "slug",
      "description",
      "price",
      "old_price",
      "stock",
      "gender",
      "is_featured",
      "is_sale",
      "is_new",
      "badge",
      "alt",
      "rating",
      "reviews",
      "sizes",
      "colors",
      "category_id",
    ]) {
      if (data[field] !== undefined) {
        if (field === "sizes" || field === "colors") {
          updates.push(`${field} = ?`);
          values.push(data[field].length ? JSON.stringify(data[field]) : null);
        } else {
          updates.push(`${field} = ?`);
          values.push(data[field]);
        }
      }
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    await connection.beginTransaction();
    values.push(id);
    await connection.execute(
      `UPDATE products SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    const imageList = req.body.images;
    if (imageList !== undefined) {
      const images = parseImageList(imageList);
      await connection.query("DELETE FROM product_images WHERE product_id = ?", [id]);
      if (images.length) {
        await connection.query(
          "INSERT INTO product_images (product_id, image) VALUES ?",
          [images.map((img) => [id, img])]
        );
      }
    }

    await connection.commit();

    const row = await fetchProductWithImages(id);
    const imgs = await fetchImages(id);

    return res.json({
      success: true,
      message: "Product updated successfully",
      data: safeProduct(row, imgs),
    });
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "A product with this slug already exists" });
    }
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category_id", errors: ["Category does not exist"] });
    }
    return res.status(500).json({ success: false, message: "Failed to update product" });
  } finally {
    connection.release();
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid product id is required" });
    }

    const existing = await fetchProductWithImages(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    try {
      await pool.query("DELETE FROM products WHERE id = ?", [id]);
    } catch (err) {
      if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
        return res.status(409).json({
          success: false,
          message: "Product cannot be deleted because it is referenced by other records",
        });
      }
      throw err;
    }

    return res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};