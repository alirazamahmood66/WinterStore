import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminModal from "../components/admin/AdminModal";

const PAGE_LIMIT = 10;

const ORDER_STATUSES = [
  { status: "pending", label: "Pending" },
  { status: "processing", label: "Processing" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
  { status: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUSES = [
  { status: "pending", label: "Pending" },
  { status: "paid", label: "Paid" },
  { status: "failed", label: "Failed" },
  { status: "refunded", label: "Refunded" },
];

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

const parseShippingAddress = (raw) => {
  if (!raw) return null;
  if (raw && typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
};

const safeText = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return "—";
  return String(value);
};

const resolveDetailCustomer = (detail) => {
  const addr = parseShippingAddress(detail.shipping_address);
  const snapshot =
    addr && (addr.fullName || addr.email || addr.phone) ? addr : null;
  const acct =
    detail.customer && typeof detail.customer === "object" ? detail.customer : {};
  return {
    name: snapshot?.fullName || acct.name || null,
    email: snapshot?.email || acct.email || null,
    phone: snapshot?.phone || acct.phone || null,
  };
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
      id="adminOrdersNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminOrdersNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminOrdersNavLabel">
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

function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusError, setStatusError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const [paymentTarget, setPaymentTarget] = useState(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);

  const notify = (type, text) => {
    setAlert({ type, text });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), 4000);
  };

  const filtersActive = Boolean(search.trim() || status || paymentStatus);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!admin) return;
    const loadStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data?.data || null);
      } catch {
        setStats(null);
      }
    };
    loadStats();
  }, [admin, refresh]);

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
    const loadOrders = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (paymentStatus) params.set("payment_status", paymentStatus);
        const res = await api.get(`/admin/orders?${params.toString()}`);
        if (cancelled) return;
        setOrders(res.data.data || []);
        setTotal(Number(res.data?.pagination?.total) || 0);
        setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load orders."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadOrders();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, page, search, status, paymentStatus, refresh]);

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

  const openDetails = (order) => {
    setDetail(order);
    setDetailLoading(true);
    api
      .get(`/admin/orders/${order.id}`)
      .then((res) => setDetail(res.data.data))
      .catch(() => {
        // keep showing the cached row data if the detail call fails
      })
      .finally(() => setDetailLoading(false));
  };

  const openStatusModal = (order) => {
    setStatusTarget(order);
    setNewStatus(order.status);
    setStatusError("");
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusTarget || savingStatus) return;
    setStatusError("");

    if (!ORDER_STATUSES.some((s) => s.status === newStatus)) {
      setStatusError("Please select a valid order status.");
      return;
    }
    if (newStatus === statusTarget.status) {
      setStatusError("Order is already set to this status.");
      return;
    }

    setSavingStatus(true);
    try {
      const res = await api.patch(`/admin/orders/${statusTarget.id}/status`, { status: newStatus });
      notify("success", `Order ${statusTarget.order_number} marked as ${newStatus}.`);
      const updated = res.data?.data;
      if (detail && detail.id === statusTarget.id && updated) {
        setDetail(updated);
      }
      setStatusTarget(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setStatusError(getErrorMessage(err, "Failed to update order status."));
    } finally {
      setSavingStatus(false);
    }
  };

  const openPaymentModal = (order) => {
    setPaymentTarget(order);
    setNewPaymentStatus(order.payment_status || "pending");
    setPaymentError("");
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    if (!paymentTarget || savingPayment) return;
    setPaymentError("");

    if (!PAYMENT_STATUSES.some((s) => s.status === newPaymentStatus)) {
      setPaymentError("Please select a valid payment status.");
      return;
    }
    if (newPaymentStatus === paymentTarget.payment_status) {
      setPaymentError("Payment is already set to this status.");
      return;
    }

    setSavingPayment(true);
    try {
      const res = await api.patch(`/admin/orders/${paymentTarget.id}/payment-status`, { payment_status: newPaymentStatus });
      notify("success", `Payment for ${paymentTarget.order_number} marked as ${newPaymentStatus}.`);
      const updated = res.data?.data;
      if (detail && detail.id === paymentTarget.id && updated) {
        setDetail(updated);
      }
      setPaymentTarget(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setPaymentError(getErrorMessage(err, "Failed to update payment status."));
    } finally {
      setSavingPayment(false);
    }
  };

  const clearFilters = () => {
    setSearchDraft("");
    setSearch("");
    setStatus("");
    setPaymentStatus("");
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
                  <h1>Orders</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="ord-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="ord-email"
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
                      <label className="form-label" htmlFor="ord-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="ord-password"
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
                    admin orders area is restricted to admin users.
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
            active="orders"
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
            active="orders"
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
                <h1>Orders</h1>
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

            <div className="admin-dash-section-row">
              <div>
                <h2 className="admin-dash-section-title mb-0">Order Management</h2>
                <p className="admin-dash-subtitle mb-0">
                  Review customer orders, manage fulfilment and update order statuses.
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

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-speedometer2 me-2"></i>
                  Order Summary
                </h3>
                <span className="admin-dash-more muted">{stats?.counts?.orders ?? 0} total orders</span>
              </div>
              <div className="admin-dash-card-body">
                <div className="admin-status-grid">
                  <div className="admin-status-chip">
                    <span className="dot dot-total"></span>
                    <span className="lbl">Total</span>
                    <span className="n">{stats?.counts?.orders ?? "—"}</span>
                  </div>
                  {(stats?.orderStatus || []).map((os) => (
                    <div className="admin-status-chip" key={os.status}>
                      <span className={`dot dot-${os.status}`}></span>
                      <span className="lbl">{os.label}</span>
                      <span className="n">{os.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-funnel me-2"></i>
                  Filters & Search
                </h3>
              </div>
              <div className="admin-dash-card-body">
                <div className="admin-filters admin-orders-filters">
                  <div className="has-search">
                    <i className="bi bi-search"></i>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by order number, customer name or email..."
                      aria-label="Search orders"
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                    />
                  </div>
                  <div>
                    <select
                      className="form-select"
                      aria-label="Filter by order status"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All Statuses</option>
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.status} value={s.status}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      className="form-select"
                      aria-label="Filter by payment status"
                      value={paymentStatus}
                      onChange={(e) => {
                        setPaymentStatus(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All Payments</option>
                      {PAYMENT_STATUSES.map((s) => (
                        <option key={s.status} value={s.status}>
                          {s.label}
                        </option>
                      ))}
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
                  <i className="bi bi-bag me-2"></i>
                  All Orders
                </h3>
                <span className="badge admin-badge">{total} total{filtersActive ? " (filtered)" : ""}</span>
              </div>
              <div className="admin-dash-card-body p-0">
                {loading ? (
                  <div className="admin-empty">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                    <p>Loading orders...</p>
                  </div>
                ) : loadError ? (
                  <div className="admin-empty">
                    <i className="bi bi-wifi-off admin-empty-icon"></i>
                    <h3>Could not load orders</h3>
                    <p>{loadError}</p>
                    <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Retry
                    </button>
                  </div>
                ) : orders.length === 0 && filtersActive ? (
                  <div className="admin-empty">
                    <i className="bi bi-search admin-empty-icon"></i>
                    <h3>No orders match your filters</h3>
                    <p>Try a different search term or filter.</p>
                    <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                      <i className="bi bi-x-lg me-2"></i>
                      Clear filters
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="admin-empty">
                    <i className="bi bi-inbox admin-empty-icon"></i>
                    <h3>No orders yet</h3>
                    <p>Orders will appear here when customers place orders.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle admin-table mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Order</th>
                          <th scope="col">Customer</th>
                          <th scope="col">Date</th>
                          <th scope="col">Items</th>
                          <th scope="col">Total</th>
                          <th scope="col">Payment</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <strong>{order.order_number}</strong>
                              <div className="text-muted small">#{order.id}</div>
                            </td>
                            <td>
                              {order.customer ? (
                                <>
                                  <strong className="d-block">{order.customer.name}</strong>
                                  <span className="text-muted small d-none d-md-inline">{order.customer.email}</span>
                                </>
                              ) : (
                                <span className="text-muted">Guest</span>
                              )}
                            </td>
                            <td className="admin-date">{formatDate(order.created_at)}</td>
                            <td>
                              <span className="badge admin-badge">{order.item_count} item{order.item_count === 1 ? "" : "s"}</span>
                            </td>
                            <td>
                              <span className="admin-price">{rupees(order.total)}</span>
                            </td>
                            <td>
                              <span className={`admin-pill ${paymentPill(order.payment_status)}`}>
                                {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : "—"}
                              </span>
                              <div className="text-muted small text-capitalize">
                                {order.payment_method === "cod" ? "Cash on Delivery" : "Online"}
                              </div>
                            </td>
                            <td>
                              <span className={`admin-pill ${orderPill(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="text-end text-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => openDetails(order)}
                                aria-label={`View order ${order.order_number}`}
                              >
                                <i className="bi bi-eye"></i>
                                <span className="d-none d-sm-inline ms-1">View</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => openStatusModal(order)}
                                aria-label={`Update status of ${order.order_number}`}
                              >
                                <i className="bi bi-arrow-repeat"></i>
                                <span className="d-none d-sm-inline ms-1">Status</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => openPaymentModal(order)}
                                aria-label={`Update payment status of ${order.order_number}`}
                              >
                                <i className="bi bi-credit-card"></i>
                                <span className="d-none d-sm-inline ms-1">Payment</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {!loading && !loadError && orders.length > 0 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Page {page} of {totalPages} · {total} order{total === 1 ? "" : "s"}
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
        modalId="orderDetailModal"
        show={Boolean(detail)}
        title={detail ? `Order ${detail.order_number}` : "Order Details"}
        icon="bi-bag"
        size="lg"
        onClose={() => setDetail(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDetail(null)}>
              Close
            </button>
            {detail && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => openPaymentModal(detail)}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Update Payment
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => openStatusModal(detail)}
                >
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Update Status
                </button>
              </>
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

            <h6 className="admin-orders-subhead">
              <i className="bi bi-receipt me-2"></i>
              Order Information
            </h6>
            <dl className="admin-detail-dl">
              <div className="admin-detail-row">
                <dt>Order ID</dt>
                <dd>#{detail.id} · <code className="admin-code">{detail.order_number}</code></dd>
              </div>
              <div className="admin-detail-row">
                <dt>Date</dt>
                <dd>{formatDateTime(detail.created_at)}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Order Status</dt>
                <dd>
                  <span className={`admin-pill ${orderPill(detail.status)}`}>
                    {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                  </span>
                </dd>
              </div>
              <div className="admin-detail-row">
                <dt>Payment Status</dt>
                <dd>
                  <span className={`admin-pill ${paymentPill(detail.payment_status)}`}>
                    {detail.payment_status ? detail.payment_status.charAt(0).toUpperCase() + detail.payment_status.slice(1) : "—"}
                  </span>
                </dd>
              </div>
              {detail.payment_method && (
                <div className="admin-detail-row">
                  <dt>Payment Method</dt>
                  <dd className="text-capitalize">{detail.payment_method}</dd>
                </div>
              )}
            </dl>

            <h6 className="admin-orders-subhead">
              <i className="bi bi-person me-2"></i>
              Customer Information
            </h6>
            {(() => {
              const cust = resolveDetailCustomer(detail);
              if (!(cust.name || cust.email || cust.phone)) {
                const addrNote = detail.shipping_address
                  ? "shipping details below"
                  : "no shipping address recorded";
                return (
                  <p className="text-muted small">
                    Guest order — no linked customer account ({addrNote}).
                  </p>
                );
              }
              return (
                <dl className="admin-detail-dl">
                  <div className="admin-detail-row">
                    <dt>Name</dt>
                    <dd>{cust.name || "—"}</dd>
                  </div>
                  <div className="admin-detail-row">
                    <dt>Email</dt>
                    <dd>{cust.email || "—"}</dd>
                  </div>
                  <div className="admin-detail-row">
                    <dt>Phone</dt>
                    <dd>{cust.phone || "—"}</dd>
                  </div>
                </dl>
              );
            })()}
            {(() => {
              const addr = parseShippingAddress(detail.shipping_address);
              if (!addr) return null;
              const fields = [
                { label: "Address", value: addr.address },
                { label: "City", value: addr.city },
                { label: "State", value: addr.state },
                { label: "Postal Code", value: addr.postalCode },
                { label: "Country", value: addr.country },
              ];
              return (
                <>
                  <h6 className="admin-orders-subhead">
                    <i className="bi bi-geo-alt me-2"></i>
                    Shipping Address
                  </h6>
                  <dl className="admin-detail-dl mb-0">
                    {fields.map((field) => (
                      <div className="admin-detail-row" key={field.label}>
                        <dt>{field.label}</dt>
                        <dd>{safeText(field.value)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              );
            })()}

            <h6 className="admin-orders-subhead">
              <i className="bi bi-box-seam me-2"></i>
              Order Items
            </h6>
            {detail.items && detail.items.length > 0 ? (
              <div className="table-responsive">
                <table className="table align-middle admin-table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Product</th>
                      <th scope="col">Qty</th>
                      <th scope="col" className="text-end">Unit Price</th>
                      <th scope="col" className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="admin-prod-name">
                            {item.image ? (
                              <img src={item.image} alt="" className="admin-prod-thumb" />
                            ) : (
                              <span className="admin-prod-thumb-fallback">
                                <i className="bi bi-box"></i>
                              </span>
                            )}
                            <div className="admin-prod-title">
                              <strong>{item.name}</strong>
                              <div className="text-muted small">#{item.product_id || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td>{item.quantity}</td>
                        <td className="text-end">{rupees(item.price)}</td>
                        <td className="text-end admin-price">{rupees(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted small mb-0">No items recorded for this order.</p>
            )}

            <h6 className="admin-orders-subhead">
              <i className="bi bi-calculator me-2"></i>
              Totals
            </h6>
            <dl className="admin-detail-dl mb-0">
              <div className="admin-detail-row">
                <dt>Subtotal</dt>
                <dd>{rupees(detail.subtotal)}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Shipping</dt>
                <dd>{rupees(detail.shipping_fee || 0)}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Discount</dt>
                <dd>{rupees(detail.discount || 0)}</dd>
              </div>
              <div className="admin-detail-row admin-detail-row-total">
                <dt>Grand Total</dt>
                <dd>
                  <span className="admin-price fw-bold">{rupees(detail.total)}</span>
                </dd>
              </div>
            </dl>
          </>
        )}
      </AdminModal>

      <AdminModal
        modalId="orderStatusModal"
        show={Boolean(statusTarget)}
        title="Update Order Status"
        icon="bi-arrow-repeat"
        onClose={() => setStatusTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setStatusTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" form="orderStatusForm" disabled={savingStatus}>
              {savingStatus ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Updating...
                </>
              ) : (
                <>
                  Update Status
                  <i className="bi bi-check-lg ms-2"></i>
                </>
              )}
            </button>
          </>
        }
      >
        {statusTarget && (
          <form id="orderStatusForm" onSubmit={handleStatusUpdate} noValidate>
            {statusError && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <div>{statusError}</div>
              </div>
            )}

            <p className="mb-3">
              Update the status for order <strong>{statusTarget.order_number}</strong>.
            </p>

            <div className="mb-3">
              <span className="form-label d-block">Current status</span>
              <span className={`admin-pill ${orderPill(statusTarget.status)}`}>
                {statusTarget.status.charAt(0).toUpperCase() + statusTarget.status.slice(1)}
              </span>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="ord-status-select">New status</label>
              <select
                id="ord-status-select"
                className="form-select"
                value={newStatus}
                onChange={(e) => {
                  setNewStatus(e.target.value);
                  if (statusError) setStatusError("");
                }}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        )}
      </AdminModal>

      <AdminModal
        modalId="orderPaymentModal"
        show={Boolean(paymentTarget)}
        title="Update Payment Status"
        icon="bi-credit-card"
        onClose={() => setPaymentTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setPaymentTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" form="orderPaymentForm" disabled={savingPayment}>
              {savingPayment ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Updating...
                </>
              ) : (
                <>
                  Update Payment Status
                  <i className="bi bi-check-lg ms-2"></i>
                </>
              )}
            </button>
          </>
        }
      >
        {paymentTarget && (
          <form id="orderPaymentForm" onSubmit={handlePaymentUpdate} noValidate>
            {paymentError && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <div>{paymentError}</div>
              </div>
            )}

            <p className="mb-3">
              Update the payment status for order <strong>{paymentTarget.order_number}</strong>.
            </p>

            <div className="mb-3">
              <span className="form-label d-block">Current payment status</span>
              <span className={`admin-pill ${paymentPill(paymentTarget.payment_status)}`}>
                {paymentTarget.payment_status
                  ? paymentTarget.payment_status.charAt(0).toUpperCase() + paymentTarget.payment_status.slice(1)
                  : "—"}
              </span>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="ord-pay-status-select">New payment status</label>
              <select
                id="ord-pay-status-select"
                className="form-select"
                value={newPaymentStatus}
                onChange={(e) => {
                  setNewPaymentStatus(e.target.value);
                  if (paymentError) setPaymentError("");
                }}
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        )}
      </AdminModal>
    </main>
  );
}

export default AdminOrders;