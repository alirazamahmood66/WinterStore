import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";

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

const orderPill = (s) =>
  ({
    pending: "pill-amber",
    processing: "pill-blue",
    shipped: "pill-violet",
    delivered: "pill-green",
    cancelled: "pill-red",
  }[s] || "pill-slate");

const paymentPill = (s) =>
  ({
    paid: "pill-green",
    pending: "pill-amber",
    failed: "pill-red",
    refunded: "pill-slate",
  }[s] || "pill-slate");

const humanize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

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
      id="adminMobileNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminMobileNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminMobileNavLabel">
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

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [categories, setCategories] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!admin) return;
    const loadDashboard = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [catRes, prodRes, statsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products?page=1&limit=5"),
          api.get("/admin/stats"),
        ]);
        setCategories(catRes.data.data || []);
        setProductCount(Number(prodRes.data?.pagination?.total) || 0);
        setLatestProducts(prodRes.data.data || []);
        setStats(statsRes.data.data || null);
      } catch (err) {
        setLoadError(getErrorMessage(err, "Failed to load dashboard data."));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [admin, refresh]);

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
                  <h1>Admin Dashboard</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="dash-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="dash-email"
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
                      <label className="form-label" htmlFor="dash-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="dash-password"
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
                    admin dashboard is restricted to admin users.
                  </p>
                  <button className="btn btn-outline-danger w-100" onClick={() => { clearAuth(); navigate("/login"); }}>
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

  const statCard = (icon, iconClass, value, label, note) => (
    <div className="col-sm-6 col-xl-3">
      <div className="admin-stat">
        <div className={`admin-stat-icon ${iconClass}`}>
          <i className={`bi ${icon}`}></i>
        </div>
        <div className="admin-stat-body">
          <strong>{value}</strong>
          <span>{label}</span>
          {note && <small className="admin-stat-note">{note}</small>}
        </div>
      </div>
    </div>
  );

  return (
    <main>
      <div className="admin-dash">
        <aside className="admin-dash-side d-none d-xl-flex">
          <AdminSidebar
            active="dashboard"
            onComingSoon={showComingSoon}
            onLogout={handleLogout}
          />
        </aside>

        <div className="admin-dash-body">
          <MobileSidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            active="dashboard"
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
                <h1>Dashboard</h1>
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

            {loadError && (
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <i className="bi bi-wifi-off me-2"></i>
                <div>Could not load all dashboard data: {loadError}</div>
              </div>
            )}

            <div className="admin-dash-section-row">
              <h2 className="admin-dash-section-title mb-0">Overview</h2>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => setRefresh((r) => r + 1)}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise"></i>
                <span className="ms-1">Refresh</span>
              </button>
            </div>

            <div className="row g-3 g-lg-4">
              {statCard("bi-box-seam", "admin-stat-violet", loading ? "..." : productCount, "Total Products")}
              {statCard("bi-bag", "admin-stat-emerald", loading ? "..." : (stats?.counts?.orders ?? "—"), "Total Orders")}
              {statCard("bi-people", "admin-stat-amber", loading ? "..." : (stats?.counts?.customers ?? "—"), "Total Customers")}
              {statCard("bi-cash-coin", "admin-stat-blue", loading ? "..." : rupees(stats?.counts?.revenue ?? 0), "Total Revenue", `This month: ${rupees(stats?.revenuePeriods?.month ?? 0)}`)}
            </div>

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-speedometer2 me-2"></i>
                  Order Status
                </h3>
                <span className="admin-dash-more muted">{stats?.counts?.orders ?? 0} total orders</span>
              </div>
              <div className="admin-dash-card-body">
                {loading ? (
                  <div className="admin-empty py-4">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                  </div>
                ) : (
                  <>
                    <div className="admin-status-grid">
                      {(stats?.orderStatus || []).map((os) => (
                        <div className="admin-status-chip" key={os.status}>
                          <span className={`dot dot-${os.status}`}></span>
                          <span className="lbl">{os.label}</span>
                          <span className="n">{os.count}</span>
                        </div>
                      ))}
                    </div>
                    {(stats?.counts?.orders ?? 0) === 0 && (
                      <p className="admin-hint mt-3 mb-0">
                        <i className="bi bi-info-circle me-1"></i>
                        No orders placed yet — these counts will update as customers place orders.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-bag-check me-2"></i>
                  Recent Orders
                </h3>
                <Link to="/admin/orders" className="admin-dash-more">
                  All Orders <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              <div className="admin-dash-card-body p-0">
                {loading ? (
                  <div className="admin-empty">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                    <p>Loading orders...</p>
                  </div>
                ) : (stats?.recentOrders?.length || 0) === 0 ? (
                  <div className="admin-empty">
                    <i className="bi bi-inbox admin-empty-icon"></i>
                    <h3>No orders yet</h3>
                    <p>Orders placed by customers will appear here.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle admin-table mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Order</th>
                          <th scope="col">Customer</th>
                          <th scope="col">Date</th>
                          <th scope="col">Total</th>
                          <th scope="col">Payment</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <strong className="d-block">{order.order_number}</strong>
                              <span className="text-muted small">#{order.id}</span>
                            </td>
                            <td>{order.customer}</td>
                            <td className="admin-date">{formatDate(order.created_at)}</td>
                            <td className="admin-price">{rupees(order.total)}</td>
                            <td>
                              <span className={`admin-pill ${paymentPill(order.payment_status)}`}>
                                {humanize(order.payment_status)}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-pill ${orderPill(order.status)}`}>
                                {humanize(order.status)}
                              </span>
                            </td>
                            <td className="text-end">
                              <Link to="/admin/orders" className="btn btn-sm btn-outline-dark">
                                <i className="bi bi-eye"></i>
                                <span className="d-none d-sm-inline ms-1">View</span>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="row g-4 admin-dash-grid">
              <div className="col-lg-6">
                <div className="card admin-dash-card shadow-sm h-100">
                  <div className="admin-dash-card-head">
                    <h3>
                      <i className="bi bi-collection me-2"></i>
                      Recent Categories
                      <span className="badge admin-badge ms-2">{categories.length}</span>
                    </h3>
                    <Link to="/admin/categories" className="admin-dash-more">
                      Manage <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                  <div className="admin-dash-card-body">
                    {loading ? (
                      <div className="admin-empty py-4">
                        <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                      </div>
                    ) : categories.length === 0 ? (
                      <div className="admin-empty py-4">
                        <i className="bi bi-inbox admin-empty-icon"></i>
                        <p className="mb-0">No categories yet.</p>
                        <Link to="/admin/categories" className="btn btn-sm btn-dark mt-2">
                          Add Category
                        </Link>
                      </div>
                    ) : (
                      <ul className="list-unstyled admin-dash-list mb-0">
                        {categories.slice(0, 5).map((cat) => (
                          <li key={cat.id} className="admin-dash-list-item">
                            <span className="admin-dash-item-ico">
                              <i className="bi bi-tag"></i>
                            </span>
                            <div className="admin-dash-item-main">
                              <strong>{cat.name}</strong>
                              <span>/ {cat.slug}</span>
                            </div>
                            <span className={`badge ${Number(cat.product_count) > 0 ? "widget-badge" : "widget-badge-muted"}`}>
                              {Number(cat.product_count)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card admin-dash-card shadow-sm h-100">
                  <div className="admin-dash-card-head">
                    <h3>
                      <i className="bi bi-box-seam me-2"></i>
                      Latest Products
                    </h3>
                    <span className="admin-dash-more muted">
                      {productCount} total
                    </span>
                  </div>
                  <div className="admin-dash-card-body">
                    {loading ? (
                      <div className="admin-empty py-4">
                        <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                      </div>
                    ) : latestProducts.length === 0 ? (
                      <div className="admin-empty py-4">
                        <i className="bi bi-box admin-empty-icon"></i>
                        <p className="mb-0">No products yet.</p>
                      </div>
                    ) : (
                      <ul className="list-unstyled admin-dash-list mb-0">
                        {latestProducts.map((p) => (
                          <li key={p.id} className="admin-dash-list-item">
                            {p.image ? (
                              <img src={p.image} alt="" className="admin-dash-item-img" />
                            ) : (
                              <span className="admin-dash-item-ico">
                                <i className="bi bi-box"></i>
                              </span>
                            )}
                            <div className="admin-dash-item-main">
                              <strong>{p.name}</strong>
                              <span>
                                {p.category ? p.category.name : "Uncategorized"} · {p.gender}
                              </span>
                            </div>
                            <div className="admin-dash-item-side">
                              <strong className="admin-dash-item-price">{rupees(p.price)}</strong>
                              <span className={`admin-pill ${Number(p.stock) > 0 ? "pill-green" : "pill-red"}`}>
                                {Number(p.stock) > 0 ? `${p.stock} in stock` : "Out of stock"}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card admin-dash-card shadow-sm mt-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-exclamation-diamond me-2"></i>
                  Low Stock
                </h3>
                <span className="admin-dash-more muted">Stock at or below 5</span>
              </div>
              <div className="admin-dash-card-body">
                {loading ? (
                  <div className="admin-empty py-4">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                  </div>
                ) : productCount === 0 ? (
                  <div className="admin-empty py-4">
                    <i className="bi bi-box admin-empty-icon"></i>
                    <p className="mb-0">No products yet.</p>
                  </div>
                ) : (stats?.lowStock?.length || 0) === 0 ? (
                  <div className="admin-empty py-4">
                    <i className="bi bi-check-circle admin-empty-icon"></i>
                    <p className="mb-0">All products are well stocked.</p>
                  </div>
                ) : (
                  <ul className="list-unstyled admin-dash-list low-stock-grid mb-0">
                    {stats.lowStock.map((p) => (
                      <li key={p.id} className="admin-dash-list-item">
                        {p.image ? (
                          <img src={p.image} alt="" className="admin-dash-item-img" />
                        ) : (
                          <span className="admin-dash-item-ico">
                            <i className="bi bi-box"></i>
                          </span>
                        )}
                        <div className="admin-dash-item-main">
                          <strong>{p.name}</strong>
                          <span>{p.category ? p.category.name : "Uncategorized"}</span>
                        </div>
                        <div className="admin-dash-item-side">
                          <strong className="admin-dash-item-price">{rupees(p.price)}</strong>
                          <span className={`admin-pill ${Number(p.stock) === 0 ? "pill-red" : "pill-amber"}`}>
                            {Number(p.stock) === 0 ? "Out of stock" : `${p.stock} left`}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="card admin-dash-card shadow-sm mt-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-activity me-2"></i>
                  Recent Activity
                </h3>
              </div>
              <div className="admin-dash-card-body">
                <ul className="list-unstyled admin-timeline mb-0">
                  <li>
                    <i className="bi bi-dot admin-timeline-dot"></i>
                    <div>
                      <strong>{categories.length || 0} categories</strong> available in the store catalog.
                    </div>
                  </li>
                  <li>
                    <i className="bi bi-dot admin-timeline-dot"></i>
                    <div>
                      <strong>{productCount || 0} products</strong> currently listed with{" "}
                      <strong>{rupees(stats?.counts?.revenue ?? 0)}</strong> total revenue from non-cancelled orders.
                    </div>
                  </li>
                  <li>
                    <i className="bi bi-dot admin-timeline-dot"></i>
                    <div>
                      <strong>{stats?.counts?.orders ?? 0} orders</strong> from{" "}
                      <strong>{stats?.counts?.customers ?? 0} customers</strong>.
                    </div>
                  </li>
                  <li>
                    <i className="bi bi-dot admin-timeline-dot"></i>
                    <div>
                      Dashboard last refreshed: {new Date().toLocaleString()}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;