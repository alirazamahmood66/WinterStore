export const isValidId = (value) => {
  if (value === undefined || value === null || value === "") return false;
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
};

export const slugify = (text) => {
  const slug = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
  return slug || "item";
};

export const toBoolean = (value, fallback = 0) => {
  if (value === undefined || value === null) return fallback;
  if (value === true || value === 1 || value === "1" || value === "true") return 1;
  if (value === false || value === 0 || value === "0" || value === "false") return 0;
  return fallback;
};

export const isPlainString = (value) => typeof value === "string" && value.trim().length > 0;