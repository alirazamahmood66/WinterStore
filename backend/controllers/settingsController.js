import { pool } from "../config/db.js";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

const STORE_SETTINGS = {
  store_name: { label: "Store Name", type: "string", min: 0, max: 100 },
  store_tagline: { label: "Store Description", type: "string", min: 0, max: 255 },
  store_email: { label: "Store Email", type: "email", min: 0, max: 190 },
  store_phone: { label: "Store Phone", type: "string", min: 0, max: 30 },
  store_address: { label: "Store Address", type: "string", min: 0, max: 500 },
  currency: { label: "Currency", type: "string", min: 0, max: 10 },
};

const STORE_KEYS = Object.keys(STORE_SETTINGS);

const cleanValue = (value) => (typeof value === "string" ? value.trim() : "");

const validateSetting = (key, value) => {
  const cfg = STORE_SETTINGS[key];
  if (!cfg) return null;
  const v = cleanValue(value);
  if (v.length > cfg.max) {
    return `${cfg.label} must be ${cfg.max} characters or fewer.`;
  }
  if (cfg.type === "email" && v && !EMAIL_REGEX.test(v)) {
    return `A valid email is required for ${cfg.label}.`;
  }
  return null;
};

const fetchStoreSettings = async () => {
  const [rows] = await pool.query(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)",
    [STORE_KEYS]
  );
  const map = {};
  for (const row of rows) map[row.setting_key] = row.setting_value;
  const out = {};
  for (const key of STORE_KEYS) out[key] = typeof map[key] === "string" ? map[key] : "";
  return out;
};

const fetchAdminProfile = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role FROM users WHERE id = ? AND role = 'admin'",
    [id]
  );
  if (!rows.length) return null;
  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    phone: rows[0].phone ?? null,
    role: rows[0].role,
  };
};

export const getSettings = async (req, res) => {
  try {
    const [store, profile] = await Promise.all([
      fetchStoreSettings(),
      fetchAdminProfile(req.user.id),
    ]);

    if (!profile) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    return res.json({
      success: true,
      message: "Settings retrieved successfully",
      data: { store, profile },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve settings" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const bodyStore =
      req.body && typeof req.body === "object" && req.body.store && typeof req.body.store === "object"
        ? req.body.store
        : {};

    const allowed = {};
    for (const key of STORE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(bodyStore, key)) {
        allowed[key] = bodyStore[key];
      }
    }

    const errors = [];
    for (const key of Object.keys(allowed)) {
      const err = validateSetting(key, allowed[key]);
      if (err) errors.push(err);
    }

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    for (const key of Object.keys(allowed)) {
      await pool.execute(
        `INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, cleanValue(allowed[key])]
      );
    }

    const store = await fetchStoreSettings();
    return res.json({
      success: true,
      message: "Store settings saved successfully.",
      data: { store },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to save settings" });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

    const errors = [];
    if (!name) errors.push("Name is required.");
    else if (name.length > 100) errors.push("Name must be 100 characters or fewer.");
    if (!email) errors.push("Email is required.");
    else if (!EMAIL_REGEX.test(email)) errors.push("A valid email is required.");
    else if (email.length > 190) errors.push("Email must be 190 characters or fewer.");

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Please correct the highlighted fields.",
        errors,
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, req.user.id]
    );
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: "That email is already in use by another account.",
      });
    }

    await pool.execute(
      "UPDATE users SET name = ?, email = ? WHERE id = ? AND role = 'admin'",
      [name, email, req.user.id]
    );

    const profile = await fetchAdminProfile(req.user.id);
    if (!profile) {
      return res.status(403).json({ success: false, message: "Admin access only" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: { profile },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "That email is already in use by another account.",
      });
    }
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};