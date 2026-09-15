import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";

const PAGE_LIMIT = 10;
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

const statusMeta = (status) =>
  ({
    in: { label: "In Stock", cls: "admin-status-in" },
    low: { label: "Low Stock", cls: "admin-status-low" },
    out: { label: "Out of Stock", cls: "admin-status-out" },
  }[status] || { label: status, cls: "admin-status-in" });

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "stock_desc", label: "Stock (High to Low)" },
  { value: "stock_asc", label: "Stock (Low to High)" },
  { value: "category_asc", label: "Category (A–Z)" },
  { value: "updated_desc", label: "Recently Updated" },
];

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
      id="adminInventoryNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminInventoryNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminInventoryNavLabel">
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

function AdminInventory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const filtersActive = Boolean(search.trim() || categoryId || stockStatus);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!admin) return;
    const loadCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data.data || []);
      } catch {
        // categories load failure should not block the inventory page
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
    const loadInventory = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT), sort });
        if (search) params.set("search", search);
        if (categoryId) params.set("category_id", String(categoryId));
        if (stockStatus) params.set("stock_status", stockStatus);
        const res = await api.get(`/admin/inventory?${params.toString()}`);
        if (cancelled) return;
        setRows(res.data.data || []);
        setSummary(res.data.summary || null);
        setTotal(Number(res.data?.pagination?.total) || 0);
        setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load inventory."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadInventory();
    return () => {
      cancelled = true;
    };
  }, [admin, page, search, categoryId, stockStatus, sort, refresh]);

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
    setStockStatus("");
    setPage(1);
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
                  <h1>Admin Inventory</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="inv-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="inv-email"
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
                      <label className="form-label" htmlFor="inv-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="inv-password"
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
                    admin area is restricted to admin users.
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
            active="inventory"
            onComingSoon={showComingSoon}
            onLogout={handleLogout}
          />
        </aside>

        <div className="admin-dash-body">
          <MobileSidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            active="inventory"
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
                <h1>Inventory</h1>
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
            {notice && (
              <div className={`alert alert-${notice.type} admin-alert d-flex align-items-center`} role="status">
                <i className="bi bi-info-circle me-2"></i>
                <div>{notice.text}</div>
                <button type="button" className="btn-close ms-auto" onClick={() => setNotice(null)} aria-label="Close"></button>
              </div>
            )}

            <div className="admin-products-toolbar">
              <div>
                <h2>Inventory Management</h2>
                <p>Monitor stock levels for every WinterStore product.</p>
              </div>
              <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)} disabled={loading}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>

            {summary && (
              <div className="admin-inventory-chips">
                <button
                  type="button"
                  className={`admin-inv-chip ${!stockStatus ? "active" : ""}`}
                  onClick={() => {
                    setStockStatus("");
                    setPage(1);
                  }}
                >
                  <span className="admin-inv-chip-icon admin-inv-chip-total"><i className="bi bi-box-seam"></i></span>
                  <span className="admin-inv-chip-body">
                    <strong>{summary.total}</strong>
                    <span>Total Products</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`admin-inv-chip ${stockStatus === "in" ? "active" : ""}`}
                  onClick={() => {
                    setStockStatus(stockStatus === "in" ? "" : "in");
                    setPage(1);
                  }}
                >
                  <span className="admin-inv-chip-icon admin-inv-chip-in"><i className="bi bi-check-circle"></i></span>
                  <span className="admin-inv-chip-body">
                    <strong>{summary.in_stock}</strong>
                    <span>In Stock</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`admin-inv-chip ${stockStatus === "low" ? "active" : ""}`}
                  onClick={() => {
                    setStockStatus(stockStatus === "low" ? "" : "low");
                    setPage(1);
                  }}
                >
                  <span className="admin-inv-chip-icon admin-inv-chip-low"><i className="bi bi-exclamation-triangle"></i></span>
                  <span className="admin-inv-chip-body">
                    <strong>{summary.low_stock}</strong>
                    <span>Low Stock</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`admin-inv-chip ${stockStatus === "out" ? "active" : ""}`}
                  onClick={() => {
                    setStockStatus(stockStatus === "out" ? "" : "out");
                    setPage(1);
                  }}
                >
                  <span className="admin-inv-chip-icon admin-inv-chip-out"><i className="bi bi-x-octagon"></i></span>
                  <span className="admin-inv-chip-body">
                    <strong>{summary.out_of_stock}</strong>
                    <span>Out of Stock</span>
                  </span>
                </button>
                <Link to="/admin/categories" className="admin-inv-chip admin-inv-chip-static">
            <span className="admin-inv-chip-icon admin-inv-chip-cat">
              <i className="bi bi-tags"></i>
            </span>

          <span className="admin-inv-chip-body">
            <strong>{summary.categories}</strong>
              <span>Categories</span>
            </span>
             </Link>
          </div>
            )}

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-funnel me-2"></i>
                  Filters & Sort
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
                      aria-label="Search inventory"
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
                        setCategoryId(e.target.value);
                        setPage(1);
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
                      aria-label="Sort inventory"
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        setPage(1);
                      }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          Sort: {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-inv-status-btns" role="group" aria-label="Filter by stock status">
                    {[
                      { value: "in", label: "In Stock" },
                      { value: "low", label: "Low Stock" },
                      { value: "out", label: "Out of Stock" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`btn btn-sm ${stockStatus === opt.value ? "btn-dark" : "btn-outline-dark"}`}
                        onClick={() => {
                          setStockStatus(stockStatus === opt.value ? "" : opt.value);
                          setPage(1);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
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
                  <i className="bi bi-clipboard-data me-2"></i>
                  Stock Levels
                </h3>
                <span className="badge admin-badge">{total} total</span>
              </div>
              <div className="admin-dash-card-body p-0">
                {loading ? (
                  <div className="admin-empty">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                    <p>Loading inventory...</p>
                  </div>
                ) : loadError ? (
                  <div className="admin-empty">
                    <i className="bi bi-wifi-off admin-empty-icon"></i>
                    <h3>Could not load inventory</h3>
                    <p>{loadError}</p>
                    <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Retry
                    </button>
                  </div>
                ) : rows.length === 0 && filtersActive ? (
                  <div className="admin-empty">
                    <i className="bi bi-search admin-empty-icon"></i>
                    <h3>No products match your filters</h3>
                    <p>Try a different search term, category or stock level.</p>
                    <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                      <i className="bi bi-x-lg me-2"></i>
                      Clear filters
                    </button>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="admin-empty">
                    <i className="bi bi-box-seam admin-empty-icon"></i>
                    <h3>No inventory records</h3>
                    <p>There are no products in the catalog to track.</p>
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
                          <th scope="col">Last Updated</th>
                          <th scope="col" className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((p) => {
                          const meta = statusMeta(p.stock_status);
                          return (
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
                                      <span className="text-muted small text-capitalize">{p.gender}</span>
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
                              </td>
                              <td>
                                <span
                                  className={
                                    p.stock === 0 ? "admin-stock-none" : p.stock <= LOW_STOCK_THRESHOLD ? "admin-stock-low" : "admin-stock-ok"
                                  }
                                >
                                  {p.stock} units
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${meta.cls}`}>{meta.label}</span>
                              </td>
                              <td className="admin-date">{formatDate(p.updated_at)}</td>
                              <td className="text-end text-nowrap">
                                <Link
                                  to={`/product/${p.id}`}
                                  className="btn btn-sm btn-outline-dark me-2"
                                  aria-label={`View ${p.name} on storefront`}
                                >
                                  <i className="bi bi-eye"></i>
                                  <span className="d-none d-sm-inline ms-1">View</span>
                                </Link>
                                <Link
                                  to="/admin/products"
                                  className="btn btn-sm btn-outline-dark"
                                  aria-label={`Edit ${p.name}`}
                                >
                                  <i className="bi bi-pencil"></i>
                                  <span className="d-none d-sm-inline ms-1">Edit</span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {!loading && !loadError && rows.length > 0 && (
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
    </main>
  );
}

export default AdminInventory;