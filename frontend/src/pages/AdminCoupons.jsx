import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminModal from "../components/admin/AdminModal";

const PAGE_LIMIT = 10;

const COUPON_STATUSES = [
  { status: "active", label: "Active", pill: "pill-green" },
  { status: "inactive", label: "Inactive", pill: "pill-slate" },
  { status: "expired", label: "Expired", pill: "pill-red" },
];

const couponStatusPill = (s) =>
  ({ active: "pill-green", inactive: "pill-slate", expired: "pill-red" }[s] || "pill-slate");

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

const toDateInput = (value) => {
  if (!value) return "";
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
};

const rupees = (n) => `Rs. ${Number(n).toLocaleString()}`;

const emptyForm = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  minimum_amount: "",
  expiry_date: "",
  usage_limit: "",
  status: "active",
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
      id="adminCouponsNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminCouponsNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminCouponsNavLabel">
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

function AdminCoupons() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [coupons, setCoupons] = useState([]);
  const [counts, setCounts] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);

  const notify = (type, text) => {
    setAlert({ type, text });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), 4000);
  };

  const filtersActive = Boolean(search.trim() || status);

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
    const loadCoupons = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        const res = await api.get(`/admin/coupons?${params.toString()}`);
        if (cancelled) return;
        setCoupons(res.data.data || []);
        setCounts(res.data.counts || null);
        setTotal(Number(res.data?.pagination?.total) || 0);
        setTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load coupons."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCoupons();
    return () => {
      cancelled = true;
    };
  }, [admin, page, search, status, refresh]);

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

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      code: c.code || "",
      discount_type: c.discount_type || "percent",
      discount_value: c.discount_value === null || c.discount_value === undefined ? "" : String(c.discount_value),
      minimum_amount: c.minimum_amount === null || c.minimum_amount === undefined ? "" : String(c.minimum_amount),
      expiry_date: toDateInput(c.expiry_date),
      usage_limit: c.usage_limit === null || c.usage_limit === undefined ? "" : String(c.usage_limit),
      status: c.status || "active",
    });
    setFormError("");
    setShowForm(true);
  };

  const fieldChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    if (formError) setFormError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");

    if (!form.code.trim()) {
      setFormError("Coupon code is required.");
      return;
    }
    if (!["percent", "fixed"].includes(form.discount_type)) {
      setFormError("Please select a valid discount type.");
      return;
    }
    const value = Number(form.discount_value);
    if (form.discount_value === "" || Number.isNaN(value) || value < 0) {
      setFormError("Discount value must be a number greater than or equal to 0.");
      return;
    }
    if (form.discount_type === "percent" && value > 100) {
      setFormError("Percentage discount cannot exceed 100.");
      return;
    }
    if (form.minimum_amount !== "" && (Number.isNaN(Number(form.minimum_amount)) || Number(form.minimum_amount) < 0)) {
      setFormError("Minimum amount must be a number greater than or equal to 0.");
      return;
    }
    if (form.usage_limit !== "" && (!Number.isInteger(Number(form.usage_limit)) || Number(form.usage_limit) < 1)) {
      setFormError("Usage limit must be a positive whole number.");
      return;
    }

    const payload = {
      code: form.code.trim(),
      discount_type: form.discount_type,
      discount_value: value,
      minimum_amount: form.minimum_amount === "" ? 0 : Number(form.minimum_amount),
      status: form.status,
    };
    if (form.expiry_date) payload.expiry_date = toDateInput(form.expiry_date);
    if (form.usage_limit !== "") payload.usage_limit = Number(form.usage_limit);

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/coupons/${editing.id}`, payload);
        notify("success", `Coupon "${payload.code}" updated successfully.`);
        setRefresh((r) => r + 1);
      } else {
        await api.post("/admin/coupons", payload);
        notify("success", `Coupon "${payload.code}" created successfully.`);
        setPage(1);
        setRefresh((r) => r + 1);
      }
      setShowForm(false);
    } catch (err) {
      setFormError(getErrorMessage(err, editing ? "Failed to update coupon." : "Failed to create coupon."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/coupons/${deleteTarget.id}`);
      notify("success", `Coupon "${deleteTarget.code}" deleted successfully.`);
      setDeleteTarget(null);
      if (coupons.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefresh((r) => r + 1);
      }
    } catch (err) {
      setDeleteTarget(null);
      notify("danger", getErrorMessage(err, "Failed to delete coupon."));
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchDraft("");
    setSearch("");
    setStatus("");
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
                  <h1>Coupons</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="coup-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="coup-email"
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
                      <label className="form-label" htmlFor="coup-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="coup-password"
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

  const discountLabel = (c) =>
    c.discount_type === "percent" ? `${Number(c.discount_value)}% off` : rupees(c.discount_value);

  return (
    <main>
      <div className="admin-dash">
        <aside className="admin-dash-side d-none d-xl-flex">
          <AdminSidebar
            active="coupons"
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
            active="coupons"
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
                <h1>Coupons</h1>
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
                <h2>Discount Coupons</h2>
                <p>Create and manage promotional coupon codes.</p>
              </div>
              <button type="button" className="btn btn-dark px-4" onClick={openCreate}>
                <i className="bi bi-plus-lg me-2"></i>
                Add Coupon
              </button>
            </div>

            <div className="card admin-dash-card shadow-sm mb-4">
              <div className="admin-dash-card-head">
                <h3>
                  <i className="bi bi-speedometer2 me-2"></i>
                  Coupon Summary
                </h3>
                <span className="admin-dash-more muted">{total} total</span>
              </div>
              <div className="admin-dash-card-body">
                <div className="admin-status-grid admin-status-grid-4">
                  <div className="admin-status-chip">
                    <span className="dot dot-total"></span>
                    <span className="lbl">All</span>
                    <span className="n">{counts?.all ?? "—"}</span>
                  </div>
                  <div className="admin-status-chip">
                    <span className="dot dot-approved"></span>
                    <span className="lbl">Active</span>
                    <span className="n">{counts?.active ?? "—"}</span>
                  </div>
                  <div className="admin-status-chip">
                    <span className="dot dot-slate"></span>
                    <span className="lbl">Inactive</span>
                    <span className="n">{counts?.inactive ?? "—"}</span>
                  </div>
                  <div className="admin-status-chip">
                    <span className="dot dot-rejected"></span>
                    <span className="lbl">Expired</span>
                    <span className="n">{counts?.expired ?? "—"}</span>
                  </div>
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
                <div className="admin-filters admin-engage-filters">
                  <div className="has-search">
                    <i className="bi bi-search"></i>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search by coupon code..."
                      aria-label="Search coupons"
                      value={searchDraft}
                      onChange={(e) => setSearchDraft(e.target.value)}
                    />
                  </div>
                  <div>
                    <select
                      className="form-select"
                      aria-label="Filter by status"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All Statuses</option>
                      {COUPON_STATUSES.map((s) => (
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
                  <i className="bi bi-ticket-perforated me-2"></i>
                  All Coupons
                </h3>
                <span className="badge admin-badge">{total} total{filtersActive ? " (filtered)" : ""}</span>
              </div>
              <div className="admin-dash-card-body p-0">
                {loading ? (
                  <div className="admin-empty">
                    <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                    <p>Loading coupons...</p>
                  </div>
                ) : loadError ? (
                  <div className="admin-empty">
                    <i className="bi bi-wifi-off admin-empty-icon"></i>
                    <h3>Could not load coupons</h3>
                    <p>{loadError}</p>
                    <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Retry
                    </button>
                  </div>
                ) : coupons.length === 0 && filtersActive ? (
                  <div className="admin-empty">
                    <i className="bi bi-search admin-empty-icon"></i>
                    <h3>No coupons match your filters</h3>
                    <p>Try a different search term or filter.</p>
                    <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                      <i className="bi bi-x-lg me-2"></i>
                      Clear filters
                    </button>
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="admin-empty">
                    <i className="bi bi-ticket-perforated admin-empty-icon"></i>
                    <h3>No coupons yet</h3>
                    <p>Create your first coupon to start offering discounts.</p>
                    <button type="button" className="btn btn-dark" onClick={openCreate}>
                      <i className="bi bi-plus-lg me-2"></i>
                      Add Coupon
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle admin-table mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Code</th>
                          <th scope="col">Discount</th>
                          <th scope="col">Min. Amount</th>
                          <th scope="col">Expiry</th>
                          <th scope="col">Usage Limit</th>
                          <th scope="col">Status</th>
                          <th scope="col" className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coupons.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <code className="admin-coupon-code">{c.code}</code>
                            </td>
                            <td>
                              <span className="admin-price fw-normal">{discountLabel(c)}</span>
                            </td>
                            <td>
                              {Number(c.minimum_amount) > 0 ? (
                                <span className="text-muted">{rupees(c.minimum_amount)}</span>
                              ) : (
                                <span className="text-muted">No minimum</span>
                              )}
                            </td>
                            <td className="admin-date">
                              {c.expiry_date ? formatDate(c.expiry_date) : <span className="text-muted">No expiry</span>}
                            </td>
                            <td>{c.usage_limit === null ? <span className="text-muted">Unlimited</span> : `${c.usage_limit} uses`}</td>
                            <td>
                              <span className={`admin-pill ${couponStatusPill(c.status)}`}>
                                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                              </span>
                            </td>
                            <td className="text-end text-nowrap">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => setDetail(c)}
                                aria-label={`View coupon ${c.code}`}
                              >
                                <i className="bi bi-eye"></i>
                                <span className="d-none d-sm-inline ms-1">View</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => openEdit(c)}
                                aria-label={`Edit coupon ${c.code}`}
                              >
                                <i className="bi bi-pencil"></i>
                                <span className="d-none d-sm-inline ms-1">Edit</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setDeleteTarget(c)}
                                aria-label={`Delete coupon ${c.code}`}
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
              {!loading && !loadError && coupons.length > 0 && (
                <div className="admin-pagination">
                  <span className="admin-pagination-info">
                    Page {page} of {totalPages} · {total} coupon{total === 1 ? "" : "s"}
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
        modalId="couponFormModal"
        show={showForm}
        title={editing ? "Edit Coupon" : "Add Coupon"}
        icon="bi-ticket-perforated"
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" form="couponForm" disabled={saving}>
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
                      Add Coupon
                      <i className="bi bi-plus-lg ms-2"></i>
                    </>
                  )}
                </>
              )}
            </button>
          </>
        }
      >
        <form id="couponForm" onSubmit={handleFormSubmit} noValidate>
          {formError && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <div>{formError}</div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="coupon-code">
                Coupon Code <span className="text-danger">*</span>
              </label>
              <input
                id="coupon-code"
                type="text"
                className="form-control text-uppercase"
                placeholder="e.g. WINTER20"
                value={form.code}
                onChange={fieldChange("code")}
              />
              <div className="form-text">Spaces are replaced with dashes; code is stored in uppercase.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="coupon-status">Status</label>
              <select id="coupon-status" className="form-select" value={form.status} onChange={fieldChange("status")}>
                {COUPON_STATUSES.map((s) => (
                  <option key={s.status} value={s.status}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="coupon-type">Discount Type</label>
              <select id="coupon-type" className="form-select" value={form.discount_type} onChange={fieldChange("discount_type")}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="coupon-value">
                Discount Value <span className="text-danger">*</span>
              </label>
              <input
                id="coupon-value"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder={form.discount_type === "percent" ? "e.g. 20" : "e.g. 500"}
                value={form.discount_value}
                onChange={fieldChange("discount_value")}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="coupon-min">Minimum Order Amount (Rs.)</label>
              <input
                id="coupon-min"
                type="number"
                min="0"
                step="0.01"
                className="form-control"
                placeholder="0 = no minimum"
                value={form.minimum_amount}
                onChange={fieldChange("minimum_amount")}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="coupon-expiry">Expiry Date</label>
              <input
                id="coupon-expiry"
                type="date"
                className="form-control"
                value={form.expiry_date}
                onChange={fieldChange("expiry_date")}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="coupon-limit">Usage Limit</label>
              <input
                id="coupon-limit"
                type="number"
                min="1"
                step="1"
                className="form-control"
                placeholder="Leave empty for unlimited"
                value={form.usage_limit}
                onChange={fieldChange("usage_limit")}
              />
            </div>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        modalId="couponDetailModal"
        show={Boolean(detail)}
        title={detail ? `Coupon ${detail.code}` : "Coupon Details"}
        icon="bi-ticket-perforated"
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
                Edit Coupon
              </button>
            )}
          </>
        }
      >
        {!detail ? null : (
          <dl className="mb-0">
            <div className="admin-detail-row">
              <dt>Code</dt>
              <dd><code className="admin-coupon-code">{detail.code}</code></dd>
            </div>
            <div className="admin-detail-row">
              <dt>Discount</dt>
              <dd>
                <span className="admin-price">{discountLabel(detail)}</span>
              </dd>
            </div>
            <div className="admin-detail-row">
              <dt>Minimum Amount</dt>
              <dd>{Number(detail.minimum_amount) > 0 ? rupees(detail.minimum_amount) : "No minimum"}</dd>
            </div>
            <div className="admin-detail-row">
              <dt>Expiry Date</dt>
              <dd>{detail.expiry_date ? formatDate(detail.expiry_date) : "No expiry"}</dd>
            </div>
            <div className="admin-detail-row">
              <dt>Usage Limit</dt>
              <dd>{detail.usage_limit === null ? "Unlimited" : `${detail.usage_limit} uses`}</dd>
            </div>
            <div className="admin-detail-row">
              <dt>Status</dt>
              <dd>
                <span className={`admin-pill ${couponStatusPill(detail.status)}`}>
                  {detail.status.charAt(0).toUpperCase() + detail.status.slice(1)}
                </span>
              </dd>
            </div>
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
        )}
      </AdminModal>

      <AdminModal
        modalId="couponDeleteModal"
        show={Boolean(deleteTarget)}
        title="Delete Coupon"
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
                  Delete Coupon
                  <i className="bi bi-trash ms-2"></i>
                </>
              )}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <p>
            Are you sure you want to delete coupon <strong>"{deleteTarget.code}"</strong>?
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

export default AdminCoupons;