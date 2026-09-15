import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminModal from "../components/admin/AdminModal";

const PAGE_LIMIT = 10;

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

const formatDateTime = (iso) => {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const rupees = (n) => `Rs. ${Number(n).toLocaleString()}`;

const initialsOf = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

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
      id="adminCustomersNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminCustomersNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminCustomersNavLabel">
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

function AdminCustomers() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const filtersActive = Boolean(search.trim());

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
    const loadCustomers = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
        if (search) params.set("search", search);
        const res = await api.get(`/admin/customers?${params.toString()}`);
        if (cancelled) return;
        setCustomers(res.data.data || []);
        setSummary(res.data.summary || null);
        setTotal(Number(res.data?.pagination?.total) || 0);
        setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load customers."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCustomers();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, page, search, refresh]);

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

  const openDetails = (customer) => {
    setDetail(customer);
    setDetailLoading(true);
    api
      .get(`/admin/customers/${customer.id}`)
      .then((res) => setDetail(res.data.data))
      .catch(() => {
        // keep showing the cached row data if the detail call fails
      })
      .finally(() => setDetailLoading(false));
  };

  const clearFilters = () => {
    setSearchDraft("");
    setSearch("");
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
                  <h1>Customers</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="cust-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="cust-email"
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
                      <label className="form-label" htmlFor="cust-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="cust-password"
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
                    admin customers area is restricted to admin users.
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
            active="customers"
            onComingSoon={(label) => {
              setNotice({
                type: "info",
                text: `The ${label} module is not built yet. It will be added in a later step.`,
              });
            }}
            onLogout={handleLogout}
          />
        </aside>

        <div className="admin-dash-body">
          <MobileSidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            active="customers"
            onComingSoon={(label) => {
              setMobileOpen(false);
              setNotice({
                type: "info",
                text: `The ${label} module is not built yet. It will be added in a later step.`,
              });
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
                <h1>Customers</h1>
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

            <div className="admin-dash-section-row">
              <div>
                <h2 className="admin-dash-section-title mb-0">Customer Management</h2>
                <p className="admin-dash-subtitle mb-0">
                  Browse registered customers, their orders and spending.
                </p>
              </div>
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

            <div className="row g-3 g-lg-4 mb-4">
              {statCard("bi-people", "admin-stat-amber", loading ? "..." : (summary?.total ?? "—"), "Total Customers")}
              {statCard("bi-bag-check", "admin-stat-emerald", loading ? "..." : (summary?.withOrders ?? "—"), "Customers with Orders")}
              {statCard("bi-person-plus", "admin-stat-blue", loading ? "..." : (summary?.newThisMonth ?? "—"), "New This Month")}
            </div>

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-funnel me-2"></i>
                  Search
                </h3>
              </div>
              <div className="admin-dash-card-body">
                <div className="admin-filters admin-orders-filters">
                  <div className="has-search">
                    <i className="bi bi-search"></i>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by customer name, email or phone..."
                      aria-label="Search customers"
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                    />
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="text-muted small">
                      <i className="bi bi-info-circle me-1"></i>
                      Searching customer accounts only.
                    </span>
                  </div>
                </div>
                {filtersActive && (
                  <button type="button" className="btn btn-sm btn-outline-secondary admin-filter-clear" onClick={clearFilters}>
                    <i className="bi bi-x-lg me-1"></i>
                    Clear search
                  </button>
                )}
              </div>
            </div>

            <div className="card admin-dash-card shadow-sm">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-people me-2"></i>
                  All Customers
                </h3>
                <span className="badge admin-badge">{total} total{filtersActive ? " (filtered)" : ""}</span>
              </div>
              <div className="admin-dash-card-body p-0">
                {loading ? (
                  <div className="admin-empty">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                    <p>Loading customers...</p>
                  </div>
                ) : loadError ? (
                  <div className="admin-empty">
                    <i className="bi bi-wifi-off admin-empty-icon"></i>
                    <h3>Could not load customers</h3>
                    <p>{loadError}</p>
                    <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Retry
                    </button>
                  </div>
                ) : customers.length === 0 && filtersActive ? (
                  <div className="admin-empty">
                    <i className="bi bi-search admin-empty-icon"></i>
                    <h3>No customers match your search</h3>
                    <p>Try a different name, email or phone number.</p>
                    <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                      <i className="bi bi-x-lg me-2"></i>
                      Clear search
                    </button>
                  </div>
                ) : customers.length === 0 ? (
                  <div className="admin-empty">
                    <i className="bi bi-inbox admin-empty-icon"></i>
                    <h3>No customers yet</h3>
                    <p>Customer accounts will appear here when people register.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle admin-table mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Customer</th>
                          <th scope="col">Phone</th>
                          <th scope="col">Registered</th>
                          <th scope="col">Orders</th>
                          <th scope="col">Total Spent</th>
                          <th scope="col" className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>
                              <div className="admin-prod-name">
                                <span className="admin-dash-avatar">{initialsOf(customer.name)}</span>
                                <div className="admin-prod-title">
                                  <strong>{customer.name}</strong>
                                  <span className="text-muted small d-none d-md-inline">{customer.email}</span>
                                </div>
                              </div>
                            </td>
                            <td>{customer.phone || <span className="text-muted">—</span>}</td>
                            <td className="admin-date">{formatDate(customer.created_at)}</td>
                            <td>
                              <span className={`badge ${Number(customer.order_count) > 0 ? "widget-badge" : "widget-badge-muted"}`}>
                                {customer.order_count}
                              </span>
                            </td>
                            <td className="admin-price">{rupees(customer.total_spent)}</td>
                            <td className="text-end text-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => openDetails(customer)}
                                aria-label={`View customer ${customer.name}`}
                              >
                                <i className="bi bi-eye"></i>
                                <span className="d-none d-sm-inline ms-1">View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {!loading && !loadError && customers.length > 0 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Page {page} of {totalPages} · {total} customer{total === 1 ? "" : "s"}
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
        modalId="customerDetailModal"
        show={Boolean(detail)}
        title={detail ? `Customer #${detail.id}` : "Customer Details"}
        icon="bi-person"
        size="lg"
        onClose={() => setDetail(null)}
        footer={
          <button type="button" className="btn btn-outline-secondary" onClick={() => setDetail(null)}>
            Close
          </button>
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

            <div className="d-flex align-items-center gap-3 mb-3">
              <span className="admin-dash-avatar" style={{ width: "52px", height: "52px", fontSize: "1.05rem" }}>
                {initialsOf(detail.name)}
              </span>
              <div className="admin-prod-title">
                <strong style={{ fontSize: "1.05rem" }}>{detail.name}</strong>
                <span className="text-muted small d-block">{detail.email}</span>
              </div>
            </div>

            <h6 className="admin-orders-subhead">
              <i className="bi bi-person-badge me-2"></i>
              Customer Information
            </h6>
            <dl className="admin-detail-dl">
              <div className="admin-detail-row">
                <dt>Customer ID</dt>
                <dd>#{detail.id}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Email</dt>
                <dd>{detail.email}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Phone</dt>
                <dd>{detail.phone || "—"}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Registered</dt>
                <dd>{formatDateTime(detail.created_at)}</dd>
              </div>
            </dl>

            <h6 className="admin-orders-subhead">
              <i className="bi bi-bag-check me-2"></i>
              Order Summary
            </h6>
            <dl className="admin-detail-dl">
              <div className="admin-detail-row">
                <dt>Total Orders</dt>
                <dd>{detail.order_count ?? 0}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Total Spent</dt>
                <dd>
                  <span className="admin-price fw-bold">{rupees(detail.total_spent ?? 0)}</span>
                </dd>
              </div>
            </dl>

            {detail.recent_orders && detail.recent_orders.length > 0 ? (
              <div className="table-responsive">
                <table className="table align-middle admin-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col">Date</th>
                      <th scope="col" className="text-end">Total</th>
                      <th scope="col">Payment</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.recent_orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong className="d-block">{order.order_number}</strong>
                          <span className="text-muted small">#{order.id}</span>
                        </td>
                        <td className="admin-date">{formatDate(order.created_at)}</td>
                        <td className="text-end admin-price">{rupees(order.total)}</td>
                        <td>
                          <span className={`admin-pill ${paymentPill(order.payment_status)}`}>
                            {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : "—"}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-pill ${orderPill(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted small mb-0">
                This customer has not placed any orders yet.
              </p>
            )}

            <h6 className="admin-orders-subhead">
              <i className="bi bi-geo-alt me-2"></i>
              Saved Addresses
            </h6>
            {detail.addresses && detail.addresses.length > 0 ? (
              <div className="row g-3">
                {detail.addresses.map((addr) => (
                  <div className="col-md-6" key={addr.id}>
                    <div className="admin-address-card h-100">
                      <div className="d-flex justify-content-between align-items-start">
                        <strong>{addr.full_name}</strong>
                        <span className="badge admin-badge">#{addr.id}</span>
                      </div>
                      {addr.phone && <span className="text-muted small d-block">{addr.phone}</span>}
                      <p className="mb-0 mt-2 text-muted">
                        {addr.address}
                        <br />
                        {addr.city}
                        {addr.postal_code ? ` — ${addr.postal_code}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small mb-0">This customer has no saved addresses.</p>
            )}
          </>
        )}
      </AdminModal>
    </main>
  );
}

export default AdminCustomers;