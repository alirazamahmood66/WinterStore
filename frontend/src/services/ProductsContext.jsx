import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react";
import api from "./api";

const ProductsContext = createContext(null);

const parseJsonList = (value) => {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((v) => typeof v === "string");
      }
    } catch {
      // not JSON
    }
  }
  return [];
};

const genderLabel = (gender) => {
  const value = String(gender || "").toLowerCase();
  if (value === "men") return "Men";
  if (value === "women") return "Women";
  if (value === "kids") return "Kids";
  return "Unisex";
};

export const toCatalogProduct = (p) => {
  const price = Number(p.price);
  const oldPrice = p.old_price != null && p.old_price > 0 ? Number(p.old_price) : null;
  const images = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : [];

  return {
    id: Number(p.id),
    name: p.name,
    category: p.category?.name || "",
    categoryId: p.category?.id || null,
    gender: genderLabel(p.gender),
    price,
    oldPrice,
    image: images[0] || null,
    images,
    alt: p.alt || p.name,
    badge: p.badge || "",
    rating: p.rating != null ? Number(p.rating) : 0,
    reviews: p.reviews != null ? Number(p.reviews) : 0,
    sizes: parseJsonList(p.sizes),
    colors: parseJsonList(p.colors),
    description: p.description || "",
    stock: Number(p.stock) || 0,
    isNew: !!p.is_new,
    isSale: !!p.is_sale,
    isFeatured: !!p.is_featured,
  };
};

function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 3;

    const load = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const res = await api.get("/products", { params: { page: 1, limit: 100 } });
        if (cancelled) return;
        const mapped = (res.data.data || []).map(toCatalogProduct).sort((a, b) => a.id - b.id);
        setProducts(mapped);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(load, Math.min(1000 * attempts, 3000));
        } else {
          setError(err);
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const patchProduct = useCallback((id, patch) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const value = useMemo(
    () => ({ products, loading, error, patchProduct }),
    [products, loading, error, patchProduct]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return ctx;
};

export { ProductsProvider, useProducts };