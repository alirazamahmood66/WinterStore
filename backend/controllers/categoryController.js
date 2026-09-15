import { pool } from "../config/db.js";
import {
  isValidId,
  slugify,
  isPlainString,
} from "../utils/helpers.js";

// -----------------------------------------
// Safe category response
// -----------------------------------------
const safeCategory = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  image: row.image,
  product_count: Number(row.product_count || 0),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// -----------------------------------------
// Common category query
// -----------------------------------------
const CATEGORY_QUERY = `
  SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c.image,
    c.created_at,
    c.updated_at,
    COUNT(p.id) AS product_count
  FROM categories c
  LEFT JOIN products p
    ON p.category_id = c.id
`;

// -----------------------------------------
// Fetch categories
// -----------------------------------------
const fetchCategories = async (id) => {
  const values = [];
  let where = "";

  if (id !== undefined) {
    where = "WHERE c.id = ?";
    values.push(id);
  }

  const [rows] = await pool.query(
    `
      ${CATEGORY_QUERY}
      ${where}
      GROUP BY
        c.id,
        c.name,
        c.slug,
        c.description,
        c.image,
        c.created_at,
        c.updated_at
      ORDER BY c.name ASC
    `,
    values
  );

  return rows;
};

// =========================================
// GET ALL CATEGORIES
// =========================================
export const getCategories = async (req, res) => {
  try {
    const rows = await fetchCategories();

    return res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: rows.map(safeCategory),
    });
  } catch (err) {
    console.error("[getCategories ERROR]", err);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
    });
  }
};

// =========================================
// GET SINGLE CATEGORY
// =========================================
export const getCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid category id is required",
      });
    }

    const rows = await fetchCategories(id);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category retrieved successfully",
      data: safeCategory(rows[0]),
    });
  } catch (err) {
    console.error("[getCategory ERROR]", err);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve category",
    });
  }
};

// =========================================
// CREATE CATEGORY
// =========================================
export const createCategory = async (req, res) => {
  try {
    console.log("🔥 CREATE CATEGORY CONTROLLER HIT");
    console.log("🔥 REQUEST BODY:", req.body);
    console.log("🔥 REQUEST BODY TYPE:", typeof req.body);
    console.log("🔥 NAME:", req.body?.name);
    console.log("🔥 NAME TYPE:", typeof req.body?.name);

    const { name, slug, description, image } = req.body;

    // Validate name
    if (!isPlainString(name) || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const cleanName = name.trim();

    if (cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be 100 characters or fewer",
      });
    }

    // Create slug
    let finalSlug;

    if (isPlainString(slug) && slug.trim()) {
      finalSlug = slug.trim().toLowerCase();
    } else {
      finalSlug = slugify(cleanName);
    }

    if (!finalSlug) {
      return res.status(400).json({
        success: false,
        message: "A valid slug could not be generated",
      });
    }

    // Check duplicate slug
    const [duplicateRows] = await pool.query(
      "SELECT id FROM categories WHERE slug = ? LIMIT 1",
      [finalSlug]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
    }

    // Clean optional fields
    const cleanDescription = isPlainString(description)
      ? description.trim()
      : null;

    const cleanImage = isPlainString(image)
      ? image.trim()
      : null;

    // Insert category
    const [result] = await pool.execute(
      `
        INSERT INTO categories
          (name, slug, description, image)
        VALUES
          (?, ?, ?, ?)
      `,
      [
        cleanName,
        finalSlug,
        cleanDescription,
        cleanImage,
      ]
    );

    // Get newly created category
    const rows = await fetchCategories(Number(result.insertId));

    if (!rows.length) {
      return res.status(500).json({
        success: false,
        message: "Category created but could not be retrieved",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: safeCategory(rows[0]),
    });
  } catch (err) {
    console.error("========== CREATE CATEGORY ERROR ==========");
    console.error("code:", err.code);
    console.error("message:", err.message);
    console.error("sqlMessage:", err.sqlMessage);
    console.error("sql:", err.sql);
    console.error("===========================================");

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// =========================================
// UPDATE CATEGORY
// =========================================
export const updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid category id is required",
      });
    }

    const existing = await fetchCategories(id);

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const updates = [];
    const values = [];

    // Name
    if (req.body.name !== undefined) {
      if (!isPlainString(req.body.name) || !req.body.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      const cleanName = req.body.name.trim();

      if (cleanName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must be 100 characters or fewer",
        });
      }

      updates.push("name = ?");
      values.push(cleanName);
    }

    // Slug
    if (req.body.slug !== undefined) {
      if (!isPlainString(req.body.slug) || !req.body.slug.trim()) {
        return res.status(400).json({
          success: false,
          message: "Slug cannot be empty",
        });
      }

      const cleanSlug = req.body.slug.trim().toLowerCase();

      const [duplicateRows] = await pool.query(
        `
          SELECT id
          FROM categories
          WHERE slug = ?
            AND id <> ?
          LIMIT 1
        `,
        [cleanSlug, id]
      );

      if (duplicateRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: "A category with this slug already exists",
        });
      }

      updates.push("slug = ?");
      values.push(cleanSlug);
    }

    // Description
    if (req.body.description !== undefined) {
      updates.push("description = ?");

      values.push(
        isPlainString(req.body.description)
          ? req.body.description.trim()
          : null
      );
    }

    // Image
    if (req.body.image !== undefined) {
      updates.push("image = ?");

      values.push(
        isPlainString(req.body.image)
          ? req.body.image.trim()
          : null
      );
    }

    if (!updates.length) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    values.push(id);

    await pool.execute(
      `
        UPDATE categories
        SET ${updates.join(", ")}
        WHERE id = ?
      `,
      values
    );

    const rows = await fetchCategories(id);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Category not found after update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: safeCategory(rows[0]),
    });
  } catch (err) {
    console.error("[updateCategory ERROR]", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "A category with this slug already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// =========================================
// DELETE CATEGORY
// =========================================
export const deleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid category id is required",
      });
    }

    const existing = await fetchCategories(id);

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    try {
      await pool.query(
        "DELETE FROM categories WHERE id = ?",
        [id]
      );
    } catch (err) {
      if (
        err.code === "ER_ROW_IS_REFERENCED_2" ||
        err.code === "ER_ROW_IS_REFERENCED"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Category cannot be deleted because it still has products",
        });
      }

      throw err;
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    console.error("[deleteCategory ERROR]", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};