import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";

const REPORT_LIMIT = 10;

const PERIOD_PRESETS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
  { days: 365, label: "1Y" },
];

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const statusPill = (s) =>
  ({ pending: "pill-amber", processing: "pill-blue", shipped: "pill-violet", delivered: "pill-green", cancelled: "pill-red" }[s] || "pill-slate");

const genderLabel = (g) => {
  const map = { men: "Men", women: "Women", kids: "Kids", unisex: "Unisex" };
  return map[g] || g || "Unknown";
};

const getErrorMessage = (err, fallback) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string" && msg) return msg;
  const errs = err?.response?.data?.errors;
  if (Array.isArray(errs) && errs.length) return errs.join(". ");
  return fallback;
};

const toLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (d, days) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

const formatDay = (iso) => {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
};

const formatDateTime = (iso) => {
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

const formatMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const initialsFrom = (name) =>
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
      id="adminReportsNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminReportsNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminReportsNavLabel">
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

function AdminReports() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // draft filters (what the user sees in the filter bar)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // applied filters (what drives the queries)
  const [applied, setApplied] = useState({ dateFrom: "", dateTo: "", status: "", category_id: "" });

  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [tablePage, setTablePage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

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
        // categories load failure should not block the reports page
      }
    };
    loadCategories();
  }, [admin]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const loadReports = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({ page: String(tablePage), limit: String(REPORT_LIMIT) });
        if (applied.dateFrom) params.set("dateFrom", applied.dateFrom);
        if (applied.dateTo) params.set("dateTo", applied.dateTo);
        if (applied.status) params.set("status", applied.status);
        if (applied.category_id) params.set("category_id", String(applied.category_id));
        const res = await api.get(`/admin/reports?${params.toString()}`);
        if (cancelled) return;
        setData(res.data.data || null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load reports."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadReports();
    return () => {
      cancelled = true;
    };
  }, [admin, applied, tablePage, refresh]);

  const applyFilters = (overrides = {}) => {
    const next = {
      dateFrom: overrides.dateFrom !== undefined ? overrides.dateFrom : dateFrom,
      dateTo: overrides.dateTo !== undefined ? overrides.dateTo : dateTo,
      status: overrides.status !== undefined ? overrides.status : statusFilter,
      category_id: overrides.category_id !== undefined ? overrides.category_id : categoryId,
    };
    if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
      setFilterError("The start date cannot be after the end date.");
      return;
    }
    setFilterError("");
    setApplied(next);
    setTablePage(1);
  };

  const applyPreset = (days) => {
    if (!days) {
      setDateFrom("");
      setDateTo("");
      applyFilters({ dateFrom: "", dateTo: "" });
      return;
    }
    const today = new Date();
    const from = addDays(today, -(days - 1));
    const f = toLocalDate(from);
    const t = toLocalDate(today);
    setDateFrom(f);
    setDateTo(t);
    setFilterError("");
    setApplied((prev) => ({ ...prev, dateFrom: f, dateTo: t }));
    setTablePage(1);
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setStatusFilter("");
    setCategoryId("");
    setFilterError("");
    setApplied({ dateFrom: "", dateTo: "", status: "", category_id: "" });
    setTablePage(1);
  };

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

  const doExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (applied.dateFrom) params.set("dateFrom", applied.dateFrom);
      if (applied.dateTo) params.set("dateTo", applied.dateTo);
      if (applied.status) params.set("status", applied.status);
      if (applied.category_id) params.set("category_id", String(applied.category_id));
      const res = await api.get(`/admin/reports/export?${params.toString()}`, { responseType: "blob" });
      const fileName = (res.headers?.["content-disposition"] || "").match(/filename="?([^"]+)"?/i)?.[1] || "winterstore_report.csv";
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setNotice({
        type: "danger",
        text: getErrorMessage(err, "Export failed. Please try again."),
      });
    } finally {
      setExporting(false);
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
                  <h1>Reports & Analytics</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="rep-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="rep-email"
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
                      <label className="form-label" htmlFor="rep-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="rep-password"
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

  const summary = data?.summary ?? null;

  const pctChange =
    summary && Number(summary.prev_revenue) > 0
      ? ((Number(summary.revenue) - Number(summary.prev_revenue)) / Number(summary.prev_revenue)) * 100
      : null;

  const maxRevenue = data?.revenueByDay?.length
    ? Math.max(...data.revenueByDay.map((d) => Number(d.revenue) || 0), 1)
    : 1;
  const maxOrders = data?.ordersByDay?.length
    ? Math.max(...data.ordersByDay.map((d) => Number(d.orders) || 0), 1)
    : 1;

  const maxTopRevenue = data?.topProducts?.length
    ? Math.max(...data.topProducts.map((p) => Number(p.revenue) || 0), 1)
    : 1;
  const maxCatRevenue = data?.topCategories?.length
    ? Math.max(...data.topCategories.map((c) => Number(c.revenue) || 0), 1)
    : 1;
  const maxCustomerSpent = data?.topCustomers?.length
    ? Math.max(...data.topCustomers.map((c) => Number(c.spent) || 0), 1)
    : 1;

  const tablePagination = data?.reportPagination || { page: 1, limit: REPORT_LIMIT, total: 0, totalPages: 1 };
  const noDataForRange = data && data.reportTable.length === 0;

  const rangeLabel = (() => {
    if (data?.filters?.dateFrom || data?.filters?.dateTo) {
      return `${formatDay(data.filters.dateFrom)} – ${formatDay(data.filters.dateTo)}`;
    }
    return "All time";
  })();

  return (
    <main>
      <div className="admin-dash">
        <aside className="admin-dash-side d-none d-xl-flex">
          <AdminSidebar
            active="reports"
            onComingSoon={showComingSoon}
            onLogout={handleLogout}
          />
        </aside>

        <div className="admin-dash-body">
          <MobileSidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            active="reports"
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
                <h1>Reports & Analytics</h1>
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
                <i className={`bi ${notice.type === "danger" ? "bi-exclamation-triangle" : "bi-info-circle"} me-2`}></i>
                <div>{notice.text}</div>
                <button type="button" className="btn-close ms-auto" onClick={() => setNotice(null)} aria-label="Close"></button>
              </div>
            )}

            <div className="admin-products-toolbar admin-reports-toolbar">
              <div>
                <h2>Reports & Analytics</h2>
                <p>Sales, orders, customer and product performance insights for WinterStore.</p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={() => setRefresh((r) => r + 1)}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={doExport}
                  disabled={exporting || loading}
                >
                  {exporting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-filetype-csv me-2"></i>
                      Export CSV
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-sliders me-2"></i>
                  Report Filters
                </h3>
                <span className="admin-dash-more muted">{rangeLabel}</span>
              </div>
              <div className="admin-dash-card-body">
                <div className="admin-rep-quick">
                  <span className="admin-rep-quick-label">Quick range:</span>
                  {PERIOD_PRESETS.map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      className={`btn btn-sm ${applied.dateFrom === toLocalDate(addDays(new Date(), -(p.days - 1))) && applied.dateTo === toLocalDate(new Date()) ? "btn-dark" : "btn-outline-dark"}`}
                      onClick={() => applyPreset(p.days)}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => applyPreset(null)}
                  >
                    All Time
                  </button>
                </div>

                {filterError && (
                  <div className="alert alert-danger d-flex align-items-center mt-3 mb-0" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <div>{filterError}</div>
                  </div>
                )}

                <div className="admin-report-filters mt-3">
                  <div>
                    <label className="form-label" htmlFor="rep-from">Date From</label>
                    <input
                      id="rep-from"
                      type="date"
                      className="form-control"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="rep-to">Date To</label>
                    <input
                      id="rep-to"
                      type="date"
                      className="form-control"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="rep-status">Order Status</label>
                    <select
                      id="rep-status"
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {ORDER_STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="rep-category">Category</label>
                    <select
                      id="rep-category"
                      className="form-select"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-report-filter-actions">
                    <button type="button" className="btn btn-dark px-4" onClick={() => applyFilters()}>
                      <i className="bi bi-funnel me-2"></i>
                      Apply Filters
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={resetFilters}>
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="admin-empty">
                <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                <p>Crunching the numbers...</p>
              </div>
            ) : loadError ? (
              <div className="admin-empty">
                <i className="bi bi-wifi-off admin-empty-icon"></i>
                <h3>Could not load reports</h3>
                <p>{loadError}</p>
                <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Retry
                </button>
              </div>
            ) : !data ? (
              <div className="admin-empty">
                <i className="bi bi-graph-up admin-empty-icon"></i>
                <h3>No report data</h3>
                <p>No sales data is available for the selected filters.</p>
              </div>
            ) : (
              <>
                <div className="admin-stat-grid admin-dash-grid">
                  <div className="admin-stat admin-stat-blue">
                    <div className="admin-stat-icon"><i className="bi bi-currency-rupee"></i></div>
                    <div className="admin-stat-body">
                      <span>Total Revenue</span>
                      <strong>{formatMoney(summary.revenue)}</strong>
                      {pctChange !== null ? (
                        <div className={`admin-stat-note ${pctChange >= 0 ? "up" : "down"}`}>
                          {pctChange >= 0 ? (
                            <i className="bi bi-arrow-up-right me-1"></i>
                          ) : (
                            <i className="bi bi-arrow-down-right me-1"></i>
                          )}
                          {Math.abs(pctChange).toFixed(1)}% vs previous period
                        </div>
                      ) : (
                        <div className="admin-stat-note">excl. cancelled</div>
                      )}
                    </div>
                  </div>
                  <div className="admin-stat admin-stat-violet">
                    <div className="admin-stat-icon"><i className="bi bi-bag"></i></div>
                    <div className="admin-stat-body">
                      <span>Total Orders</span>
                      <strong>{summary.orders}</strong>
                      <div className="admin-stat-note">
                        {summary.cancelled_orders} cancelled · {summary.completed_orders} delivered
                      </div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat-emerald">
                    <div className="admin-stat-icon"><i className="bi bi-box-seam"></i></div>
                    <div className="admin-stat-body">
                      <span>Products Sold</span>
                      <strong>{summary.items_sold}</strong>
                      <div className="admin-stat-note">units in {rangeLabel}</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat-amber">
                    <div className="admin-stat-icon"><i className="bi bi-receipt"></i></div>
                    <div className="admin-stat-body">
                      <span>Avg. Order Value</span>
                      <strong>{formatMoney(summary.avg_order_value)}</strong>
                      <div className="admin-stat-note">revenue ÷ orders</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat-blue">
                    <div className="admin-stat-icon"><i className="bi bi-check-circle"></i></div>
                    <div className="admin-stat-body">
                      <span>Completed Orders</span>
                      <strong>{summary.completed_orders}</strong>
                      <div className="admin-stat-note">delivered</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat-amber">
                    <div className="admin-stat-icon"><i className="bi bi-hourglass-split"></i></div>
                    <div className="admin-stat-body">
                      <span>Pending Orders</span>
                      <strong>{summary.pending_orders}</strong>
                      <div className="admin-stat-note">pending + processing</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat-red">
                    <div className="admin-stat-icon"><i className="bi bi-x-circle"></i></div>
                    <div className="admin-stat-body">
                      <span>Cancelled Orders</span>
                      <strong>{summary.cancelled_orders}</strong>
                      <div className="admin-stat-note">excluded from revenue</div>
                    </div>
                  </div>
                  <div className="admin-stat admin-stat-violet">
                    <div className="admin-stat-icon"><i className="bi bi-person-plus"></i></div>
                    <div className="admin-stat-body">
                      <span>New Customers</span>
                      <strong>{summary.new_customers}</strong>
                      <div className="admin-stat-note">
                        {summary.total_customers} total · {summary.customers_with_orders} with orders
                      </div>
                    </div>
                  </div>
                </div>

                {noDataForRange && (
                  <div className="admin-empty admin-empty-inline mb-4">
                    <i className="bi bi-inbox admin-empty-icon"></i>
                    <h3>No orders found for these filters</h3>
                    <p>Try widening the date range or clearing the status / category filters.</p>
                    <button type="button" className="btn btn-outline-dark" onClick={resetFilters}>
                      <i className="bi bi-arrow-counterclockwise me-2"></i>
                      Reset Filters
                    </button>
                  </div>
                )}

                <div className="row g-4 mb-4">
                  <div className="col-lg-6">
                    <div className="card admin-dash-card h-100 shadow-sm">
                      <div className="admin-dash-card-head">
                        <h3>
                          <i className="bi bi-bar-chart me-2"></i>
                          Revenue Over Time
                        </h3>
                        <span className="admin-dash-more muted">{data.revenueByDay.length} days</span>
                      </div>
                      <div className="admin-dash-card-body">
                        {data.revenueByDay.length > 0 ? (
                          <div className="admin-chart-bars">
                            <div className="admin-chart-bars-track">
                              {data.revenueByDay.map((d, i) => {
                                const h = Math.max(4, Math.round((Number(d.revenue) / maxRevenue) * 100));
                                return (
                                  <div className="admin-chart-bar" key={i}>
                                    <div
                                      className="admin-chart-bar-fill"
                                      style={{ height: `${h}%` }}
                                      title={`${formatMoney(d.revenue)} · ${d.orders} order${d.orders === 1 ? "" : "s"}`}
                                    ></div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="admin-chart-bar-labels">
                              {data.revenueByDay.length <= 40
                                ? data.revenueByDay.map((d, i) => (
                                    <span key={i}>{i % Math.max(1, Math.ceil(data.revenueByDay.length / 10)) === 0 ? formatDay(d.day) : ""}</span>
                                  ))
                                : null}
                            </div>
                          </div>
                        ) : (
                          <div className="admin-mini-empty">
                            <i className="bi bi-bar-chart"></i>
                            <p>No revenue data for this range.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="card admin-dash-card h-100 shadow-sm">
                      <div className="admin-dash-card-head">
                        <h3>
                          <i className="bi bi-bag-check me-2"></i>
                          Order Volume
                        </h3>
                        <span className="admin-dash-more muted">{data.ordersByDay.length} days</span>
                      </div>
                      <div className="admin-dash-card-body">
                        {data.ordersByDay.length > 0 ? (
                          <div className="admin-chart-bars">
                            <div className="admin-chart-bars-track">
                              {data.ordersByDay.map((d, i) => {
                                const h = Math.max(4, Math.round((Number(d.orders) / maxOrders) * 100));
                                return (
                                  <div className="admin-chart-bar" key={i}>
                                    <div
                                      className="admin-chart-bar-fill admin-chart-bar-fill-alt"
                                      style={{ height: `${h}%` }}
                                      title={`${d.orders} order${d.orders === 1 ? "" : "s"} · ${formatMoney(d.revenue)}`}
                                    ></div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="admin-chart-bar-labels">
                              {data.ordersByDay.length <= 40
                                ? data.ordersByDay.map((d, i) => (
                                    <span key={i}>{i % Math.max(1, Math.ceil(data.ordersByDay.length / 10)) === 0 ? formatDay(d.day) : ""}</span>
                                  ))
                                : null}
                            </div>
                          </div>
                        ) : (
                          <div className="admin-mini-empty">
                            <i className="bi bi-bag"></i>
                            <p>No order data for this range.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card admin-dash-card shadow-sm mb-4">
                  <div className="admin-dash-card-head">
                    <h3>
                      <i className="bi bi-grid me-2"></i>
                      Order Status Summary
                    </h3>
                    <span className="admin-dash-more muted">{summary.orders} total orders</span>
                  </div>
                  <div className="admin-dash-card-body p-0">
                    {data.ordersByStatus.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table align-middle admin-table mb-0">
                          <thead>
                            <tr>
                              <th scope="col">Status</th>
                              <th scope="col" className="text-end">Orders</th>
                              <th scope="col">Share</th>
                              <th scope="col" className="text-end">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.ordersByStatus.map((row) => (
                              <tr key={row.status}>
                                <td>
                                  <span className={`admin-pill ${statusPill(row.status)}`}>
                                    {row.label}
                                  </span>
                                </td>
                                <td className="text-end">
                                  <strong>{row.count}</strong>
                                </td>
                                <td style={{ width: "220px" }}>
                                  <div className="admin-bar-track">
                                    <div
                                      className="admin-bar-fill"
                                      style={{ width: `${Math.max(2, row.pct)}%` }}
                                    ></div>
                                  </div>
                                  <span className="small text-muted">{row.pct}%</span>
                                </td>
                                <td className="text-end admin-price">{formatMoney(row.revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted small px-3 py-3 mb-0">No orders in this range.</p>
                    )}
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-lg-7">
                    <div className="card admin-dash-card h-100 shadow-sm">
                      <div className="admin-dash-card-head">
                        <h3>
                          <i className="bi bi-trophy me-2"></i>
                          Top Selling Products
                        </h3>
                        <span className="admin-dash-more muted">by revenue</span>
                      </div>
                      <div className="admin-dash-card-body p-0">
                        {data.topProducts.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-hover align-middle admin-table mb-0">
                              <thead>
                                <tr>
                                  <th scope="col">Product</th>
                                  <th scope="col" className="text-end">Units Sold</th>
                                  <th scope="col" className="text-end">Revenue</th>
                                  <th scope="col">Share</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.topProducts.map((p) => (
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
                                          <span className="text-muted small">{formatMoney(p.price)}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="text-end">{p.qty}</td>
                                    <td className="text-end admin-price">{formatMoney(p.revenue)}</td>
                                    <td style={{ width: "150px" }}>
                                      <div className="admin-bar-track">
                                        <div
                                          className="admin-bar-fill"
                                          style={{ width: `${Math.max(2, Math.round((p.revenue / maxTopRevenue) * 100))}%` }}
                                        ></div>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted small px-3 py-3 mb-0">No product sales in this range.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-5">
                    <div className="card admin-dash-card h-100 shadow-sm mb-4">
                      <div className="admin-dash-card-head">
                        <h3>
                          <i className="bi bi-tags me-2"></i>
                          Category Performance
                        </h3>
                        <span className="admin-dash-more muted">by revenue</span>
                      </div>
                      <div className="admin-dash-card-body p-0">
                        {data.topCategories.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table align-middle admin-table mb-0">
                              <thead>
                                <tr>
                                  <th scope="col">Category</th>
                                  <th scope="col" className="text-end">Orders</th>
                                  <th scope="col" className="text-end">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.topCategories.map((c) => (
                                  <tr key={c.id}>
                                    <td>
                                      <strong>{c.name}</strong>
                                      <div className="admin-bar-track mt-1">
                                        <div
                                          className="admin-bar-fill"
                                          style={{ width: `${Math.max(2, Math.round((c.revenue / maxCatRevenue) * 100))}%` }}
                                        ></div>
                                      </div>
                                    </td>
                                    <td className="text-end">{c.orders}</td>
                                    <td className="text-end admin-price">{formatMoney(c.revenue)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted small px-3 py-3 mb-0">No sales in this range.</p>
                        )}
                      </div>
                    </div>
                    <div className="card admin-dash-card h-100 shadow-sm">
                      <div className="admin-dash-card-head">
                        <h3>
                          <i className="bi bi-person-arms-up me-2"></i>
                          Sales by Target Audience
                        </h3>
                      </div>
                      <div className="admin-dash-card-body p-0">
                        {data.salesByGender.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table align-middle admin-table mb-0">
                              <thead>
                                <tr>
                                  <th scope="col">Audience</th>
                                  <th scope="col" className="text-end">Qty</th>
                                  <th scope="col" className="text-end">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.salesByGender.map((g) => (
                                  <tr key={g.gender}>
                                    <td>
                                      <strong className="text-capitalize">{genderLabel(g.gender)}</strong>
                                    </td>
                                    <td className="text-end">{g.qty}</td>
                                    <td className="text-end admin-price">{formatMoney(g.revenue)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted small px-3 py-3 mb-0">No sales in this range.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-lg-5">
                    <div className="card admin-dash-card h-100 shadow-sm">
                      <div className="admin-dash-card-head">
                        <h3>
                          <i className="bi bi-people me-2"></i>
                          Customer Summary
                        </h3>
                        <span className="admin-dash-more muted">in {rangeLabel}</span>
                      </div>
                      <div className="admin-dash-card-body">
                        <div className="admin-cust-kpis">
                          <div className="admin-cust-kpi">
                            <span className="admin-cust-kpi-icon"><i className="bi bi-people"></i></span>
                            <div>
                              <strong>{summary.total_customers}</strong>
                              <span>Total customers</span>
                            </div>
                          </div>
                          <div className="admin-cust-kpi">
                            <span className="admin-cust-kpi-icon"><i className="bi bi-bag-check"></i></span>
                            <div>
                              <strong>{summary.customers_with_orders}</strong>
                              <span>Customers with orders</span>
                            </div>
                          </div>
                          <div className="admin-cust-kpi">
                            <span className="admin-cust-kpi-icon"><i className="bi bi-person-plus"></i></span>
                            <div>
                              <strong>{summary.new_customers}</strong>
                              <span>New customers</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-7">
                    <div className="card admin-dash-card h-100 shadow-sm">
                      <div className="admin-dash-card-head">
                        <h3>
                          <i className="bi bi-trophy me-2"></i>
                          Top Customers by Spending
                        </h3>
                        <span className="admin-dash-more muted">in {rangeLabel}</span>
                      </div>
                      <div className="admin-dash-card-body p-0">
                        {data.topCustomers.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table align-middle admin-table mb-0">
                              <thead>
                                <tr>
                                  <th scope="col">Customer</th>
                                  <th scope="col" className="text-end">Orders</th>
                                  <th scope="col" className="text-end">Spent</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.topCustomers.map((c) => (
                                  <tr key={c.id}>
                                    <td>
                                      <div className="admin-cust-cell">
                                        <span className="admin-cust-avatar">{initialsFrom(c.name)}</span>
                                        <span className="admin-cust-meta">
                                          <strong>{c.name}</strong>
                                          <em>{c.email}</em>
                                        </span>
                                        <span className="admin-cust-spentbar">
                                          <span>
                                            <span style={{ width: `${Math.max(4, Math.round((c.spent / maxCustomerSpent) * 100))}%` }}></span>
                                          </span>
                                        </span>
                                      </div>
                                    </td>
                                    <td className="text-end">{c.orders}</td>
                                    <td className="text-end admin-price">{formatMoney(c.spent)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-muted small px-3 py-3 mb-0">No customer activity in this range.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card admin-dash-card shadow-sm">
                  <div className="admin-dash-card-head">
                    <h3>
                      <i className="bi bi-table me-2"></i>
                      Orders Report
                    </h3>
                    <span className="admin-dash-more muted">
                      {tablePagination.total} order{tablePagination.total === 1 ? "" : "s"} · {rangeLabel}
                    </span>
                  </div>
                  <div className="admin-dash-card-body p-0">
                    {data.reportTable.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle admin-table mb-0">
                          <thead>
                            <tr>
                              <th scope="col">Order</th>
                              <th scope="col">Customer</th>
                              <th scope="col">Date</th>
                              <th scope="col" className="text-end">Items</th>
                              <th scope="col" className="text-end">Amount</th>
                              <th scope="col">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.reportTable.map((o) => (
                              <tr key={o.id}>
                                <td>
                                  <code className="admin-code">{o.order_number}</code>
                                </td>
                                <td>
                                  {o.customer ? (
                                    <>
                                      <strong className="d-block">{o.customer.name}</strong>
                                      <span className="text-muted small">{o.customer.email}</span>
                                    </>
                                  ) : (
                                    <span className="text-muted">Guest</span>
                                  )}
                                </td>
                                <td className="admin-date">{formatDateTime(o.created_at)}</td>
                                <td className="text-end">{o.items}</td>
                                <td className="text-end admin-price">{formatMoney(o.total)}</td>
                                <td>
                                  <span className={`admin-pill ${statusPill(o.status)}`}>
                                    {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="admin-empty">
                        <i className="bi bi-inbox admin-empty-icon"></i>
                        <h3>No orders match the current filters</h3>
                        <p>Adjust the date range, status or category to see more data.</p>
                      </div>
                    )}
                  </div>
                  {data.reportTable.length > 0 && (
                    <div className="admin-pagination">
                      <span className="admin-pagination-info">
                        Page {tablePagination.page} of {tablePagination.totalPages} · showing {data.reportTable.length} of {tablePagination.total}
                      </span>
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                          disabled={tablePage <= 1}
                          onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                        >
                          <i className="bi bi-chevron-left me-1"></i>
                          Prev
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                          disabled={tablePage >= tablePagination.totalPages}
                          onClick={() => setTablePage((p) => p + 1)}
                        >
                          Next
                          <i className="bi bi-chevron-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminReports;