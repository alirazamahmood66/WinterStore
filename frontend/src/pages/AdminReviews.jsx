import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminModal from "../components/admin/AdminModal";

const PAGE_LIMIT = 10;

const REVIEW_STATUSES = [
  { status: "pending", label: "Pending", pill: "pill-amber" },
  { status: "approved", label: "Approved", pill: "pill-green" },
  { status: "rejected", label: "Rejected", pill: "pill-red" },
];

const reviewPill = (s) =>
  ({ pending: "pill-amber", approved: "pill-green", rejected: "pill-red" }[s] || "pill-slate");

const getErrorMessage = (err, fallback) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string" && msg) return msg;
  const errs = err?.response?.data?.errors;
  if (Array.isArray(errs) && errs.length) return errs.join(". ");
  return fallback;
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

const Stars = ({ rating }) => (
  <span className="admin-stars" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <i
        key={n}
        className={`bi ${n <= rating ? "bi-star-fill" : "bi-star"} ${n <= rating ? "on" : ""}`}
      ></i>
    ))}
  </span>
);

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
      id="adminReviewsNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminReviewsNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminReviewsNavLabel">
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

function AdminReviews() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [tab, setTab] = useState("reviews");

  const [reviews, setReviews] = useState([]);
  const [reviewCounts, setReviewCounts] = useState(null);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [feedback, setFeedback] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [feedbackTotal, setFeedbackTotal] = useState(0);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(1);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [feedbackSearchDraft, setFeedbackSearchDraft] = useState("");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("");
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackRefresh, setFeedbackRefresh] = useState(0);

  const [detail, setDetail] = useState(null);

  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);

  const notify = (type, text) => {
    setAlert({ type, text });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), 4000);
  };

  const filtersActive = Boolean(search.trim() || status || rating);

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
    const t = setTimeout(() => {
      setFeedbackSearch(feedbackSearchDraft.trim());
      setFeedbackPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [feedbackSearchDraft]);

  useEffect(() => {
    if (!admin || tab !== "reviews") return;
    let cancelled = false;
    const loadReviews = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (rating) params.set("rating", rating);
        const res = await api.get(`/admin/reviews?${params.toString()}`);
        if (cancelled) return;
        setReviews(res.data.data || []);
        setReviewCounts(res.data.counts || null);
        setReviewTotal(Number(res.data?.pagination?.total) || 0);
        setReviewTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load reviews."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [admin, tab, page, search, status, rating, refresh]);

  useEffect(() => {
    if (!admin || tab !== "feedback") return;
    let cancelled = false;
    const loadFeedback = async () => {
      setFeedbackLoading(true);
      setFeedbackError("");
      try {
        const params = new URLSearchParams({ page: String(feedbackPage), limit: String(PAGE_LIMIT) });
        if (feedbackSearch) params.set("search", feedbackSearch);
        if (feedbackRating) params.set("rating", feedbackRating);
        const res = await api.get(`/admin/feedback?${params.toString()}`);
        if (cancelled) return;
        setFeedback(res.data.data || []);
        setFeedbackSummary(res.data.summary || null);
        setFeedbackTotal(Number(res.data?.pagination?.total) || 0);
        setFeedbackTotalPages(Number(res.data?.pagination?.totalPages) || 1);
      } catch (err) {
        if (cancelled) return;
        setFeedbackError(getErrorMessage(err, "Failed to load feedback."));
      } finally {
        if (!cancelled) setFeedbackLoading(false);
      }
    };
    loadFeedback();
    return () => {
      cancelled = true;
    };
  }, [admin, tab, feedbackPage, feedbackSearch, feedbackRating, feedbackRefresh]);

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

  const openStatusModal = (review) => {
    setStatusTarget(review);
    setNewStatus(review.status);
    setStatusError("");
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusTarget || savingStatus) return;
    setStatusError("");

    if (!REVIEW_STATUSES.some((s) => s.status === newStatus)) {
      setStatusError("Please select a valid review status.");
      return;
    }
    if (newStatus === statusTarget.status) {
      setStatusError("Review is already set to this status.");
      return;
    }

    setSavingStatus(true);
    try {
      await api.patch(`/admin/reviews/${statusTarget.id}/status`, { status: newStatus });
      notify("success", `Review #${statusTarget.id} marked as ${newStatus}.`);
      setStatusTarget(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setStatusError(getErrorMessage(err, "Failed to update review status."));
    } finally {
      setSavingStatus(false);
    }
  };

  const quickStatus = async (review, statusTo) => {
    if (review.status === statusTo) return;
    try {
      await api.patch(`/admin/reviews/${review.id}/status`, { status: statusTo });
      notify("success", `Review #${review.id} marked as ${statusTo}.`);
      setRefresh((r) => r + 1);
    } catch (err) {
      notify("danger", getErrorMessage(err, "Failed to update review status."));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === "review") {
        await api.delete(`/admin/reviews/${deleteTarget.id}`);
        notify("success", "Review deleted successfully.");
      } else {
        await api.delete(`/admin/feedback/${deleteTarget.id}`);
        notify("success", "Feedback entry deleted successfully.");
      }
      setDeleteTarget(null);
      if (deleteTarget.kind === "review") {
        setRefresh((r) => r + 1);
      } else {
        setFeedbackRefresh((r) => r + 1);
      }
    } catch (err) {
      setDeleteTarget(null);
      notify("danger", getErrorMessage(err, "Failed to delete entry."));
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchDraft("");
    setSearch("");
    setStatus("");
    setRating("");
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
                  <h1>Reviews & Feedback</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="rev-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="rev-email"
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
                      <label className="form-label" htmlFor="rev-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="rev-password"
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
            active="reviews"
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
            active="reviews"
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
                <h1>Reviews & Feedback</h1>
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
                <h2 className="admin-dash-section-title mb-0">Customer Engagement</h2>
                <p className="admin-dash-subtitle mb-0">
                  Moderate product reviews and respond to visitor feedback.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline-dark btn-sm"
                onClick={() => (tab === "reviews" ? setRefresh((r) => r + 1) : setFeedbackRefresh((r) => r + 1))}
                disabled={loading || feedbackLoading}
              >
                <i className="bi bi-arrow-clockwise"></i>
                <span className="ms-1">Refresh</span>
              </button>
            </div>

            <ul className="nav nav-tabs admin-engage-tabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link ${tab === "reviews" ? "active" : ""}`}
                  role="tab"
                  onClick={() => setTab("reviews")}
                >
                  <i className="bi bi-chat-square-text me-1"></i>
                  Reviews
                  {reviewCounts && reviewCounts.pending > 0 && (
                    <span className="badge bg-danger ms-1">{reviewCounts.pending}</span>
                  )}
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link ${tab === "feedback" ? "active" : ""}`}
                  role="tab"
                  onClick={() => setTab("feedback")}
                >
                  <i className="bi bi-megaphone me-1"></i>
                  Feedback
                </button>
              </li>
            </ul>

            <div className="admin-tab-pane">
              {tab === "reviews" ? (
                <>
                  <div className="card admin-dash-card shadow-sm mb-4">
                    <div className="admin-dash-card-head">
                      <h3>
                        <i className="bi bi-speedometer2 me-2"></i>
                        Review Summary
                      </h3>
                      <span className="admin-dash-more muted">{reviewTotal} total</span>
                    </div>
                    <div className="admin-dash-card-body">
                      <div className="admin-status-grid admin-status-grid-4">
                        <div className="admin-status-chip">
                          <span className="dot dot-total"></span>
                          <span className="lbl">All</span>
                          <span className="n">{reviewCounts?.all ?? "—"}</span>
                        </div>
                        <div className="admin-status-chip">
                          <span className="dot dot-pending"></span>
                          <span className="lbl">Pending</span>
                          <span className="n">{reviewCounts?.pending ?? "—"}</span>
                        </div>
                        <div className="admin-status-chip">
                          <span className="dot dot-approved"></span>
                          <span className="lbl">Approved</span>
                          <span className="n">{reviewCounts?.approved ?? "—"}</span>
                        </div>
                        <div className="admin-status-chip">
                          <span className="dot dot-rejected"></span>
                          <span className="lbl">Rejected</span>
                          <span className="n">{reviewCounts?.rejected ?? "—"}</span>
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
                            placeholder="Search product, customer name or email..."
                            aria-label="Search reviews"
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
                            {REVIEW_STATUSES.map((s) => (
                              <option key={s.status} value={s.status}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            className="form-select"
                            aria-label="Filter by rating"
                            value={rating}
                            onChange={(e) => {
                              setRating(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
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
                        <i className="bi bi-chat-square-text me-2"></i>
                        Product Reviews
                      </h3>
                      <span className="badge admin-badge">{reviewTotal} total{filtersActive ? " (filtered)" : ""}</span>
                    </div>
                    <div className="admin-dash-card-body p-0">
                      {loading ? (
                        <div className="admin-empty">
                          <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                          <p>Loading reviews...</p>
                        </div>
                      ) : loadError ? (
                        <div className="admin-empty">
                          <i className="bi bi-wifi-off admin-empty-icon"></i>
                          <h3>Could not load reviews</h3>
                          <p>{loadError}</p>
                          <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Retry
                          </button>
                        </div>
                      ) : reviews.length === 0 && filtersActive ? (
                        <div className="admin-empty">
                          <i className="bi bi-search admin-empty-icon"></i>
                          <h3>No reviews match your filters</h3>
                          <p>Try a different search term or filter.</p>
                          <button type="button" className="btn btn-outline-dark" onClick={clearFilters}>
                            <i className="bi bi-x-lg me-2"></i>
                            Clear filters
                          </button>
                        </div>
                      ) : reviews.length === 0 ? (
                        <div className="admin-empty">
                          <i className="bi bi-chat-square-text admin-empty-icon"></i>
                          <h3>No reviews yet</h3>
                          <p>Customer reviews will appear here for moderation.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle admin-table mb-0">
                            <thead>
                              <tr>
                                <th scope="col">Product</th>
                                <th scope="col">Customer</th>
                                <th scope="col">Rating</th>
                                <th scope="col">Comment</th>
                                <th scope="col">Date</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reviews.map((review) => (
                                <tr key={review.id}>
                                  <td>
                                    <div className="admin-prod-name">
                                      {review.product.image ? (
                                        <img src={review.product.image} alt="" className="admin-prod-thumb" />
                                      ) : (
                                        <span className="admin-prod-thumb-fallback">
                                          <i className="bi bi-box"></i>
                                        </span>
                                      )}
                                      <div className="admin-prod-title">
                                        <strong>{review.product.name}</strong>
                                        <div className="text-muted small">#{review.id}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <strong className="d-block">{review.user.name}</strong>
                                    <span className="text-muted small d-none d-md-inline">{review.user.email}</span>
                                  </td>
                                  <td>
                                    <Stars rating={review.rating} />
                                  </td>
                                  <td>
                                    <span className="admin-comment-clip" title={review.comment}>
                                      {review.comment}
                                    </span>
                                  </td>
                                  <td className="admin-date">{formatDateTime(review.created_at)}</td>
                                  <td>
                                    <span className={`admin-pill ${reviewPill(review.status)}`}>
                                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="text-end text-nowrap">
                                    {review.status !== "approved" && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success me-2"
                                        onClick={() => quickStatus(review, "approved")}
                                        title="Approve review"
                                      >
                                        <i className="bi bi-check-lg"></i>
                                      </button>
                                    )}
                                    {review.status !== "rejected" && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-warning me-2"
                                        onClick={() => quickStatus(review, "rejected")}
                                        title="Reject review"
                                      >
                                        <i className="bi bi-x-lg"></i>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-dark me-2"
                                      onClick={() => openStatusModal(review)}
                                      title="Change status"
                                    >
                                      <i className="bi bi-arrow-repeat"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => setDeleteTarget({ kind: "review", id: review.id, label: `review #${review.id} by ${review.user.name}` })}
                                      title="Delete review"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {!loading && !loadError && reviews.length > 0 && (
                      <div className="admin-pagination">
                        <span className="admin-pagination-info">
                          Page {page} of {reviewTotalPages} · {reviewTotal} review{reviewTotal === 1 ? "" : "s"}
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
                            disabled={page >= reviewTotalPages}
                            onClick={() => setPage((p) => p + 1)}
                          >
                            Next
                            <i className="bi bi-chevron-right ms-1"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="card admin-dash-card shadow-sm mb-4">
                    <div className="admin-dash-card-head">
                      <h3>
                        <i className="bi bi-speedometer2 me-2"></i>
                        Feedback Summary
                      </h3>
                      <span className="admin-dash-more muted">{feedbackTotal} total</span>
                    </div>
                    <div className="admin-dash-card-body">
                      <div className="admin-feedback-summary">
                        <div className="admin-feedback-avg">
                          <span className="admin-feedback-score">{feedbackSummary?.average ?? "—"}</span>
                          <Stars rating={Math.round(feedbackSummary?.average ?? 0)} />
                          <span className="admin-feedback-avg-lbl">average rating</span>
                        </div>
                        <div className="admin-feedback-bars">
                          {["5", "4", "3", "2", "1"].map((n) => {
                            const all = feedbackSummary?.all ?? 0;
                            const count = feedbackSummary?.distribution?.[n] ?? 0;
                            const pct = all > 0 ? Math.round((count / all) * 100) : 0;
                            return (
                              <div className="admin-feedback-bar" key={n}>
                                <span className="admin-feedback-bar-lbl">{n} <i className="bi bi-star-fill"></i></span>
                                <div className="admin-bar-track">
                                  <div className="admin-bar-fill" style={{ width: `${pct}%` }}></div>
                                </div>
                                <span className="admin-feedback-bar-n">{count}</span>
                              </div>
                            );
                          })}
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
                            placeholder="Search name, email or message..."
                            aria-label="Search feedback"
                            value={feedbackSearchDraft}
                            onChange={(e) => setFeedbackSearchDraft(e.target.value)}
                          />
                        </div>
                        <div>
                          <select
                            className="form-select"
                            aria-label="Filter feedback by rating"
                            value={feedbackRating}
                            onChange={(e) => {
                              setFeedbackRating(e.target.value);
                              setFeedbackPage(1);
                            }}
                          >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                          </select>
                        </div>
                      </div>
                      {Boolean(feedbackSearch.trim() || feedbackRating) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary admin-filter-clear"
                          onClick={() => {
                            setFeedbackSearchDraft("");
                            setFeedbackSearch("");
                            setFeedbackRating("");
                            setFeedbackPage(1);
                          }}
                        >
                          <i className="bi bi-x-lg me-1"></i>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="card admin-dash-card shadow-sm">
                    <div className="admin-dash-card-head">
                      <h3>
                        <i className="bi bi-megaphone me-2"></i>
                        Visitor Feedback
                      </h3>
                      <span className="badge admin-badge">{feedbackTotal} total</span>
                    </div>
                    <div className="admin-dash-card-body p-0">
                      {feedbackLoading ? (
                        <div className="admin-empty">
                          <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                          <p>Loading feedback...</p>
                        </div>
                      ) : feedbackError ? (
                        <div className="admin-empty">
                          <i className="bi bi-wifi-off admin-empty-icon"></i>
                          <h3>Could not load feedback</h3>
                          <p>{feedbackError}</p>
                          <button type="button" className="btn btn-outline-dark" onClick={() => setFeedbackRefresh((r) => r + 1)}>
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Retry
                          </button>
                        </div>
                      ) : feedback.length === 0 ? (
                        <div className="admin-empty">
                          <i className="bi bi-megaphone admin-empty-icon"></i>
                          <h3>No feedback yet</h3>
                          <p>Visitor feedback messages will appear here.</p>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle admin-table mb-0">
                            <thead>
                              <tr>
                                <th scope="col">Submitter</th>
                                <th scope="col">Rating</th>
                                <th scope="col">Message</th>
                                <th scope="col">Date</th>
                                <th scope="col" className="text-end">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {feedback.map((item) => (
                                <tr key={item.id}>
                                  <td>
                                    <strong className="d-block">{item.name}</strong>
                                    <span className="text-muted small d-none d-md-inline">{item.email}</span>
                                    {item.account_name && (
                                      <div className="text-muted small text-capitalize">
                                        <i className="bi bi-person-check me-1"></i>
                                        {item.account_name}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    <Stars rating={item.rating} />
                                  </td>
                                  <td>
                                    <span className="admin-comment-clip" title={item.message}>
                                      {item.message}
                                    </span>
                                  </td>
                                  <td className="admin-date">{formatDateTime(item.created_at)}</td>
                                  <td className="text-end text-nowrap">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-dark me-2"
                                      onClick={() => setDetail(item)}
                                      aria-label={`View feedback from ${item.name}`}
                                    >
                                      <i className="bi bi-eye"></i>
                                      <span className="d-none d-sm-inline ms-1">View</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => setDeleteTarget({ kind: "feedback", id: item.id, label: `feedback #${item.id} from ${item.name}` })}
                                      aria-label={`Delete feedback from ${item.name}`}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    {!feedbackLoading && !feedbackError && feedback.length > 0 && (
                      <div className="admin-pagination">
                        <span className="admin-pagination-info">
                          Page {feedbackPage} of {feedbackTotalPages} · {feedbackTotal} feedback{feedbackTotal === 1 ? "" : " entries"}
                        </span>
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            disabled={feedbackPage <= 1}
                            onClick={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                          >
                            <i className="bi bi-chevron-left me-1"></i>
                            Prev
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            disabled={feedbackPage >= feedbackTotalPages}
                            onClick={() => setFeedbackPage((p) => p + 1)}
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
      </div>

      <AdminModal
        modalId="reviewStatusModal"
        show={Boolean(statusTarget)}
        title="Change Review Status"
        icon="bi-arrow-repeat"
        onClose={() => setStatusTarget(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setStatusTarget(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" form="reviewStatusForm" disabled={savingStatus}>
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
          <form id="reviewStatusForm" onSubmit={handleStatusUpdate} noValidate>
            {statusError && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <div>{statusError}</div>
              </div>
            )}

            <p className="mb-3">
              Update the moderation status for <strong>review #{statusTarget.id}</strong>.
            </p>

            <div className="mb-3">
              <span className="form-label d-block">Current status</span>
              <span className={`admin-pill ${reviewPill(statusTarget.status)}`}>
                {statusTarget.status.charAt(0).toUpperCase() + statusTarget.status.slice(1)}
              </span>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="rev-status-select">New status</label>
              <select
                id="rev-status-select"
                className="form-select"
                value={newStatus}
                onChange={(e) => {
                  setNewStatus(e.target.value);
                  if (statusError) setStatusError("");
                }}
              >
                {REVIEW_STATUSES.map((s) => (
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
        modalId="feedbackDetailModal"
        show={Boolean(detail)}
        title={detail ? `Feedback from ${detail.name}` : "Feedback"}
        icon="bi-megaphone"
        onClose={() => setDetail(null)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDetail(null)}>
              Close
            </button>
            {detail && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setDeleteTarget({ kind: "feedback", id: detail.id, label: `feedback #${detail.id} from ${detail.name}` });
                  setDetail(null);
                }}
              >
                <i className="bi bi-trash me-2"></i>
                Delete
              </button>
            )}
          </>
        }
      >
        {!detail ? null : (
          <>
            <dl className="admin-detail-dl">
              <div className="admin-detail-row">
                <dt>Name</dt>
                <dd>{detail.name}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Email</dt>
                <dd>{detail.email}</dd>
              </div>
              <div className="admin-detail-row">
                <dt>Rating</dt>
                <dd><Stars rating={detail.rating} /></dd>
              </div>
              {detail.account_name && (
                <div className="admin-detail-row">
                  <dt>Linked account</dt>
                  <dd>{detail.account_name}</dd>
                </div>
              )}
              <div className="admin-detail-row">
                <dt>Submitted</dt>
                <dd>{formatDateTime(detail.created_at)}</dd>
              </div>
            </dl>
            <div className="admin-feedback-message">
              <span className="admin-feedback-message-label">
                <i className="bi bi-chat-quote me-1"></i>
                Message
              </span>
              <p className="mb-0">{detail.message}</p>
            </div>
          </>
        )}
      </AdminModal>

      <AdminModal
        modalId="deleteConfirmModal"
        show={Boolean(deleteTarget)}
        title="Confirm Delete"
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
                  Delete
                  <i className="bi bi-trash ms-2"></i>
                </>
              )}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <p>
            Are you sure you want to delete <strong>{deleteTarget.label}</strong>?
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

export default AdminReviews;