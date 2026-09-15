import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminModal from "../components/admin/AdminModal";

const PAGE_LIMIT = 10;
const GENDERS = ["men", "women", "kids", "unisex"];
const LOW_STOCK_THRESHOLD = 5;

const getErrorMessage = (err, fallback) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string" && msg) return msg;
  const errs = err?.response?.data?.errors;
  if (Array.isArray(errs) && errs.length) return errs.join(". ");
  return fallback;
};

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const rupees = (n) => `Rs. ${Number(n).toLocaleString()}`;

const emptyForm = {
  name: "",
  slug: "",
  category_id: "",
  description: "",
  price: "",
  old_price: "",
  stock: "",
  gender: "unisex",
  is_featured: false,
  is_sale: false,
  images: [""],
};

const StockCell = ({ stock }) => {
  const status = Number(stock);
  const className = status === 0 ? "admin-stock-none" : status <= LOW_STOCK_THRESHOLD ? "admin-stock-low" : "admin-stock-ok";
  const text = status === 0 ? "Out of stock" : status <= LOW_STOCK_THRESHOLD ? `${status} (Low Stock)` : String(status);
  return <span className={className}>{text}</span>;
};

const stockStatus = (stock) => {
  const status = Number(stock);
  if (status === 0) return { label: "Out of Stock", cls: "admin-status-out" };
  if (status <= LOW_STOCK_THRESHOLD) return { label: "Low Stock", cls: "admin-status-low" };
  return { label: "In Stock", cls: "admin-status-in" };
};

function MobileSidebar({ open, onClose, active, onComingSoon, onLogout }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(ref.current);
    if (open) offcanvas.show();
    else offcanvas.hide();
  }, [open]);

  return (
    <div
      className="offcanvas offcanvas-start admin-mobile-canvas"
      id="adminProductsNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminProductsNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminProductsNavLabel">
          WinterStore Admin
        </h5>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
      </div>
      <div className="offcanvas-body p-0">
        <AdminSidebar active={active} onComingSoon={onComingSoon} onLogout={onLogout} />
      </div>
    </div>
  );
}

function AdminProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);

  const notify = (type, text) => {
    setAlert({ type, text });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), 4000);
  };

  const filtersActive = Boolean(search.trim() || categoryId || stockFilter);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!admin) return;
    const loadCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data || []);
      } catch {
        // categories load failure should not block the products page
      }
    };
    loadCategories();
  }, [admin]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const loadProducts = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
        if (search) params.set("search", search);
        if (categoryId) params.set("category_id", String(categoryId));
        if (stockFilter) params.set("stock", stockFilter);
        const res = await api.get(`/products?${params.toString()}`);
        if (cancelled) return;
        setProducts(res.data.data || []);
        setTotal(Number(res.data?.pagination?.total) || 0);
        setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load products."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProducts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, page, search, categoryId, stockFilter, refresh]);

  useEffect(() => {
    const param = searchParams.get("category_id");
    const value = param && param.trim() !== "" ? param.trim() : "";
    if (value !== categoryId) setCategoryId(value);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loggingIn) return;
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    setLoggingIn(true);
    try {
      const res = await api.post("/auth/login", {
        email: loginEmail.trim(),
        password: loginPassword,
      });
      const { token, user } = res.data;
      if (!token) throw new Error("Login response did not include a token");
      setAuth({ token, user });
      setAuthState({ token, user });
      setAdmin(user.role === "admin");
      if (user.role !== "admin") {
        setLoginError("This account does not have admin access.");
      }
    } catch (err) {
      if (err?.response?.status === 401) {
        setLoginError("Invalid email or password.");
      } else {
        setLoginError(getErrorMessage(err, "Login failed. Is the backend running?"));
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const showComingSoon = (moduleName) => {
    setNotice({
      type: "info",
      text: `The ${moduleName} module is not built yet. It will be added in a later step.`,
    });
  };

  const clearFilters = () => {
    setSearchDraft("");
    setSearch("");
    setCategoryId("");
    setStockFilter("");
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete("category_id");
    next.delete("stock");
    setSearchParams(next, { replace: true });
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || "",
      slug: p.slug || "",
      category_id: p.category ? p.category.id : "",
      description: p.description || "",
      price: p.price === null || p.price === undefined ? "" : String(p.price),
      old_price: p.old_price === null || p.old_price === undefined ? "" : String(p.old_price),
      stock: p.stock === null || p.stock === undefined ? "" : String(p.stock),
      gender: p.gender || "unisex",
      is_featured: Boolean(p.is_featured),
      is_sale: Boolean(p.is_sale),
      images: p.images && p.images.length ? [...p.images] : [""],
    });
    setFormError("");
    setShowForm(true);
  };

  const openDetails = (p) => {
    setDetail(p);
    setDetailLoading(true);
    api
      .get(`/products/${p.id}`)
      .then((res) => setDetail(res.data.data))
      .catch(() => {
        // keep showing the cached row data if the detail call fails
      })
      .finally(() => setDetailLoading(false));
  };

  const fieldChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    if (formError) setFormError("");
  };

  const setImageAt = (index, value) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[index] = value;
      return { ...prev, images };
    });
  };

  const addImageRow = () => {
    setForm((prev) => ({ ...prev, images: [...prev.images, ""] }));
  };

  const removeImageRow = (index) => {
    setForm((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      return { ...prev, images: images.length ? images : [""] };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (!form.category_id) {
      setFormError("Please select a category.");
      return;
    }
    const price = Number(form.price);
    if (form.price === "" || Number.isNaN(price) || price < 0) {
      setFormError("Price must be a number greater than or equal to 0.");
      return;
    }
    const stock = Number(form.stock);
    if (form.stock === "" || !Number.isInteger(stock) || stock < 0) {
      setFormError("Stock must be a non-negative whole number.");
      return;
    }
    if (form.old_price !== "" && (Number.isNaN(Number(form.old_price)) || Number(form.old_price) < 0)) {
      setFormError("Old price must be a number greater than or equal to 0.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      category_id: Number(form.category_id),
      price,
      stock,
      gender: form.gender,
      is_featured: form.is_featured ? 1 : 0,
      is_sale: form.is_sale ? 1 : 0,
      description: form.description.trim() || null,
      old_price: form.old_price === "" ? null : Number(form.old_price),
    };
    if (form.slug.trim()) payload.slug = form.slug.trim().toLowerCase();

    const images = form.images.map((img) => img.trim()).filter((img) => img.length > 0);
    if (images.length) payload.images = images;

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        notify("success", `Product "${payload.name}" updated successfully.`);
        setRefresh((r) => r + 1);
      } else {
        await api.post("/products", payload);
        notify("success", `Product "${payload.name}" created successfully.`);
        setPage(1);
        setRefresh((r) => r + 1);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, editing ? "Failed to update product." : "Failed to create product."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/products/${deleteTarget.id}`);
      notify("success", `Product "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefresh((r) => r + 1);
      }
    } catch (err) {
      setDeleteTarget(null);
      notify("danger", getErrorMessage(err, "Failed to delete product."));
    } finally {
      setDeleting(false);
    }
  };

  if (!auth) {
    return (
      <main>
        <section className="admin-gate">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 col-lg-5">
                <div className="admin-login-card">
                  <div className="admin-login-icon">
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  <h1>Admin Products</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="prod-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="prod-email"
                          type="email"
                          className="form-control"
                          placeholder="admin@winterstore.com"
                          value={loginEmail}
                          onChange={(e) => {
                            setLoginEmail(e.target.value);
                            if (loginError) setLoginError("");
                          }}
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="prod-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="prod-password"
                          type="password"
                          className="form-control"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value);
                            if (loginError) setLoginError("");
                          }}
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-dark w-100 admin-login-btn" disabled={loggingIn}>
                      {loggingIn ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing In...
                        </>
                      ) : (
                        <>
                          Sign In
                          <i className="bi bi-box-arrow-in-right ms-2"></i>
                        </>
                      )}
                    </button>
                  </form>

                  <p className="admin-back">
                    <Link to="/">Back to WinterStore</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!admin) {
    return (
      <main>
        <section className="admin-gate">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 col-lg-5">
                <div className="admin-login-card">
                  <div className="admin-login-icon">
                    <i className="bi bi-person-x"></i>
                  </div>
                  <h1>Admin Access Required</h1>
                  <p>
                    Your account does not have administrator privileges. The WinterStore
                    admin products area is restricted to admin users.
                  </p>
                  <button className="btn btn-outline-danger w-100" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Switch Account
                  </button>
                  <p className="admin-back">
                    <Link to="/">Back to WinterStore</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const initials = (auth.user.name || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <main>
      <div className="admin-dash">
        <aside className="admin-dash-side d-none d-xl-flex">
          <AdminSidebar
            active="products"
            onComingSoon={showComingSoon}
            onLogout={handleLogout}
          />
        </aside>

        <div className="admin-dash-body">
          <MobileSidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            active="products"
            onComingSoon={(label) => {
              setMobileOpen(false);
              showComingSoon(label);
            }}
            onLogout={handleLogout}
          />

          <header className="admin-dash-topbar">
            <div className="admin-dash-title">
              <button
                type="button"
                className="btn admin-dash-burger d-xl-none"
                onClick={() => setMobileOpen(true)}
                aria-label="Open admin navigation"
              >
                <i className="bi bi-list"></i>
              </button>
              <div>
                <h1>Products</h1>
                <p>Welcome back, {auth.user.name}.</p>
              </div>
            </div>

            <div className="admin-dash-profile">
              <div className="admin-dash-avatar">{initials}</div>
              <div className="admin-dash-user">
                <strong>{auth.user.name}</strong>
                <span>{auth.user.email}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline-light btn-sm admin-dash-logout"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="d-none d-sm-inline ms-1">Logout</span>
              </button>
            </div>
          </header>

          <div className="admin-dash-content">
            {alert && (
              <div className={`alert alert-${alert.type} admin-alert d-flex align-items-center`} role="alert">
                <i className={`bi ${alert.type === "success" ? "bi-check-circle" : "bi-exclamation-triangle"} me-2`}></i>
                <div>{alert.text}</div>
                <button type="button" className="btn-close ms-auto" onClick={() => setAlert(null)} aria-label="Close"></button>
              </div>
            )}

            {notice && (
              <div className={`alert alert-${notice.type} admin-alert d-flex align-items-center`} role="status">
                <i className="bi bi-info-circle me-2"></i>
                <div>{notice.text}</div>
                <button type="button" className="btn-close ms-auto" onClick={() => setNotice(null)} aria-label="Close"></button>
              </div>
            )}

            <div className="admin-products-toolbar">
              <div>
                <h2>Product Management</h2>
                <p>Add, edit and remove products for WinterStore.</p>
              </div>
              <button type="button" className="btn btn-dark px-4" onClick={openCreate}>
                <i className="bi bi-plus-lg me-2"></i>
                Add Product
              </button>
            </div>

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-funnel me-2"></i>
                  Filters & Search
                </h3>
              </div>
              <div className="admin-dash-card-body">
                <div className="admin-filters">
                  <div className="has-search">
                    <i className="bi bi-search"></i>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by product name..."
                      aria-label="Search products"
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                    />
                  </div>
                  <div>
                    <select
                      className="form-select"
                      aria-label="Filter by category"
                      value={categoryId}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCategoryId(value);
                        setPage(1);
                        const next = new URLSearchParams(searchParams);
                        if (value) next.set("category_id", value);
                        else next.delete("category_id");
                        setSearchParams(next, { replace: true });
                      }}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      className="form-select"
                      aria-label="Filter by stock"
                      value={stockFilter}
                      onChange={(e) => {
                        setStockFilter(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All Stock Levels</option>
                      <option value="in">In Stock</option>
                      <option value="low">Low Stock</option>
                      <option value="out">Out of Stock</option>
                    </select>
                  </div>
                </div>
                {filtersActive && (
                  <button type="button" className="btn btn-sm btn-outline-secondary admin-filter-clear" onClick={clearFilters}>
                    <i className="bi bi-x-lg me-1"></i>
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            <div className="card admin-dash-card shadow-sm">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-box-seam me-2"></i>
                  All Products
                </h3>
                <span className="badge admin-badge">{total} total</span>
              </div>
              <div className="admin-dash-card-body p-0">
                {loading ? (
                  <div className="admin-empty">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                    <p>Loading products...</p>
                  </div>
                ) : loadError ? (
                  <div className="admin-empty">
                    <i className="bi bi-wifi-off admin-empty-icon"></i>
                    <h3>Could not load products</h3>
                    <p>{loadError}</p>
                    <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Retry
                    </button>
                  </div>
                ) : products.length === 0 && filtersActive ? (
                  <div className="admin-empty">
                    <i className="bi bi-search admin-empty-icon"></i>
                    <h3>No products match your filters</h3>
                    <p>Try a different search term or category.</p>
                    <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                      <i className="bi bi-x-lg me-2"></i>
                      Clear filters
                    </button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="admin-empty">
                    <i className="bi bi-box-seam admin-empty-icon"></i>
                    <h3>No products yet</h3>
                    <p>Add your first product to get started.</p>
                    <button type="button" className="btn btn-dark" onClick={openCreate}>
                      <i className="bi bi-plus-lg me-2"></i>
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle admin-table mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Product</th>
                          <th scope="col">Category</th>
                          <th scope="col">Price</th>
                          <th scope="col">Stock</th>
                          <th scope="col">Status</th>
                          <th scope="col">Added</th>
                          <th scope="col" className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <div className="admin-prod-name">
                                {p.image ? (
                                  <img src={p.image} alt="" className="admin-prod-thumb" />
                                ) : (
                                  <span className="admin-prod-thumb-fallback">
                                    <i className="bi bi-box"></i>
                                  </span>
                                )}
                                <div className="admin-prod-title">
                                  <strong>{p.name}</strong>
                                  <div className="admin-prod-tags">
                                    <code className="admin-code">{p.slug}</code>
                                    {p.is_featured && (
                                      <span className="admin-tag admin-tag-featured">
                                        <i className="bi bi-star-fill"></i> Featured
                                      </span>
                                    )}
                                    {p.is_sale && (
                                      <span className="admin-tag admin-tag-sale">
                                        <i className="bi bi-tag-fill"></i> Sale
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {p.category ? (
                                <>
                                  <strong className="d-block">{p.category.name}</strong>
                                  <span className="text-muted small">/ {p.category.slug}</span>
                                </>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td>
                              <span className="admin-price">{rupees(p.price)}</span>
                              {p.old_price !== null && p.old_price !== undefined && (
                                <span className="admin-old-price">
                                  {rupees(p.old_price)}
                                </span>
                              )}
                            </td>
                            <td>
                              <StockCell stock={p.stock} />
                            </td>
                            <td>
                              <span className={`badge ${stockStatus(p.stock).cls}`}>
                                {stockStatus(p.stock).label}
                              </span>
                            </td>
                            <td className="admin-date">{formatDate(p.created_at)}</td>
                            <td className="text-end text-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => openDetails(p)}
                                aria-label={`View ${p.name}`}
                              >
                                <i className="bi bi-eye"></i>
                                <span className="d-none d-sm-inline ms-1">View</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => openEdit(p)}
                                aria-label={`Edit ${p.name}`}
                              >
                                <i className="bi bi-pencil"></i>
                                <span className="d-none d-sm-inline ms-1">Edit</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setDeleteTarget(p)}
                                aria-label={`Delete ${p.name}`}
                              >
                                <i className="bi bi-trash"></i>
                                <span className="d-none d-sm-inline ms-1">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {!loading && !loadError && products.length > 0 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Page {page} of {totalPages} · {total} product{total === 1 ? "" : "s"}
                  </span>
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <i className="bi bi-chevron-left me-1"></i>
                      Prev
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-dark btn-sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <i className="bi bi-chevron-right ms-1"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdminModal
        modalId="productFormModal"
        show={showForm}
        title={editing ? "Edit Product" : "Add Product"}
        icon="bi-box-seam"
        size="lg"
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" form="productForm" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : (
                <>
                  {editing ? (
                    <>
                      Save Changes
                      <i className="bi bi-check-lg ms-2"></i>
                    </>
                  ) : (
                    <>
                      Add Product
                      <i className="bi bi-plus-lg ms-2"></i>
                    </>
                  )}
                </>
              )}
            </button>
          </>
        }
      >
        <form id="productForm" onSubmit={handleFormSubmit} noValidate>
          {formError && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <div>{formError}</div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-8">
              <label className="form-label" htmlFor="prod-name">
                Product Name <span className="text-danger">*</span>
              </label>
              <input
                id="prod-name"
                type="text"
                className="form-control"
                placeholder="e.g. Winter Puffer Jacket"
                value={form.name}
                onChange={fieldChange("name")}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="prod-category">
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="prod-category"
                className="form-select"
                value={form.category_id}
                onChange={fieldChange("category_id")}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="prod-slug">Slug</label>
              <input
                id="prod-slug"
                type="text"
                className="form-control"
                placeholder="auto-generated from name (optional)"
                value={form.slug}
                onChange={fieldChange("slug")}
              />
              <div className="form-text">Leave empty to auto-generate a unique slug.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="prod-gender">Gender</label>
              <select
                id="prod-gender"
                className="form-select"
                value={form.gender}
                onChange={fieldChange("gender")}
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label" htmlFor="prod-price">
                Price (Rs.) <span className="text-danger">*</span>
              </label>
              <input
                id="prod-price"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="0.00"
                value={form.price}
                onChange={fieldChange("price")}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="prod-old-price">Old Price (Rs.)</label>
              <input
                id="prod-old-price"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="optional"
                value={form.old_price}
                onChange={fieldChange("old_price")}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label" htmlFor="prod-stock">
                Stock <span className="text-danger">*</span>
              </label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                step="1"
                className="form-control"
                placeholder="0"
                value={form.stock}
                onChange={fieldChange("stock")}
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="prod-desc">Description</label>
              <textarea
                id="prod-desc"
                className="form-control"
                rows="3"
                placeholder="Short description of this product"
                value={form.description}
                onChange={fieldChange("description")}
              ></textarea>
            </div>

            <div className="col-12">
              <div className="d-flex gap-4">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="prod-featured"
                    checked={form.is_featured}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="prod-featured">
                    Featured
                  </label>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="prod-sale"
                    checked={form.is_sale}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_sale: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="prod-sale">
                    Sale
                  </label>
                </div>
              </div>
            </div>

            <div className="col-12">
              <label className="form-label">Images</label>
              <div className="admin-img-rows">
                {form.images.map((img, i) => (
                  <div className="admin-img-row" key={i}>
                    <input
                      type="url"
                      className="form-control"
                      placeholder={`Image URL ${i + 1} (optional)`}
                      value={img}
                      onChange={(e) => setImageAt(i, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => removeImageRow(i)}
                      disabled={form.images.length === 1}
                      aria-label="Remove image row"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-sm btn-outline-dark mt-2 admin-add-image-btn" onClick={addImageRow}>
                <i className="bi bi-plus-lg me-1"></i>
                Add another image
              </button>
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        modalId="productDetailModal"
        show={Boolean(detail)}
        title={detail ? detail.name : "Product Details"}
        icon="bi-box-seam"
        size="lg"
        onClose={() => setDetail(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDetail(null)}>
              Close
            </button>
            {detail && (
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => {
                  setDetail(null);
                  openEdit(detail);
                }}
              >
                <i className="bi bi-pencil me-2"></i>
                Edit Product
              </button>
            )}
          </>
        }
      >
        {!detail ? null : (
          <>
            {detailLoading && (
              <div className="text-center py-2 mb-2 small text-muted">
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Refreshing from server...
              </div>
            )}

            {detail.images && detail.images.length > 0 && (
              <div className="admin-detail-imgs mb-3">
                {detail.images.map((img, i) => (
                  <img key={i} src={img} alt={`${detail.name} ${i + 1}`} className="admin-detail-img" />
                ))}
              </div>
            )}

            <dl className="mb-0">
              <div className="admin-detail-row">
                <dt>Slug</dt>
                <dd><code className="admin-code">/product/{detail.id} · {detail.slug}</code></dd>
              </div>
              <div className="admin-detail-row">
                <dt>Category</dt>
                <dd>{detail.category ? `${detail.category.name} (${detail.category.slug})` : "—"}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Gender</dt>
                <dd className="text-capitalize">{detail.gender || "—"}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Price</dt>
                <dd>
                  <span className="admin-price">{rupees(detail.price)}</span>
                  {detail.old_price !== null && detail.old_price !== undefined && (
                    <span className="admin-old-price ms-2">{rupees(detail.old_price)}</span>
                  )}
                </dd>
              </div>
              <div className="admin-detail-row">
                <dt>Stock</dt>
                <dd>
                  <StockCell stock={detail.stock} />
                </dd>
              </div>
              <div className="admin-detail-row">
                <dt>Status</dt>
                <dd>
                  <span className={`badge ${stockStatus(detail.stock).cls}`}>
                    {stockStatus(detail.stock).label}
                  </span>
                  {detail.is_featured && (
                    <span className="admin-tag admin-tag-featured ms-1">
                      <i className="bi bi-star-fill"></i> Featured
                    </span>
                  )}
                  {detail.is_sale && (
                    <span className="admin-tag admin-tag-sale ms-1">
                      <i className="bi bi-tag-fill"></i> Sale
                    </span>
                  )}
                </dd>
              </div>
              {detail.description && (
                <div className="admin-detail-row">
                  <dt>Description</dt>
                  <dd>{detail.description}</dd>
                </div>
              )}
              <div className="admin-detail-row">
                <dt>Created</dt>
                <dd>{formatDate(detail.created_at)}</dd>
              </div>
              {detail.updated_at && (
                <div className="admin-detail-row">
                  <dt>Last updated</dt>
                  <dd>{formatDate(detail.updated_at)}</dd>
                </div>
              )}
            </dl>
          </>
        )}
      </AdminModal>

      <AdminModal
        modalId="productDeleteModal"
        show={Boolean(deleteTarget)}
        title="Delete Product"
        icon="bi-trash"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Deleting...
                </>
              ) : (
                <>
                  Delete Product
                  <i className="bi bi-trash ms-2"></i>
                </>
              )}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <p>
            Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
            <span className="d-block mt-2 text-danger">
              <i className="bi bi-exclamation-triangle me-1"></i>
              This action cannot be undone.
            </span>
          </p>
        )}
      </AdminModal>
    </main>
  );
}

export default AdminProducts;