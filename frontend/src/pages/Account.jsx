import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getAuth, setAuth, clearAuth } from "../utils/auth";

const readJSON = (key, fallback) => {
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    return raw == null ? fallback : raw;
  } catch {
    return fallback;
  }
};

const getUser = () => {
  const auth = getAuth();
  return auth && auth.token ? auth.user : null;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s()-]{10,15}$/;

const statusClass = (status) => `ac-badge ac-badge-${(status || "pending").toLowerCase()}`;

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

const rs = (n) => `Rs. ${Number(n).toLocaleString()}`;

const statusLabel = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";

function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(() =>
    Object.keys(readJSON("wishlist", {})).length
  );
  const [cartCount, setCartCount] = useState(() =>
    readJSON("cart", []).reduce((sum, item) => sum + (item.quantity || 1), 0)
  );

  const [view, setView] = useState("overview");
  const [profile, setProfile] = useState(() => getUser());
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [editErrors, setEditErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const loadOrders = useCallback(async () => {
    if (!getAuth()?.token) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }
    setOrdersLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    const refresh = () => {
      setUser(getUser());
      setProfile(getUser());
      setWishlistCount(Object.keys(readJSON("wishlist", {})).length);
      setCartCount(readJSON("cart", []).reduce((sum, item) => sum + (item.quantity || 1), 0));
      loadOrders();
    };
    refresh();
    window.addEventListener("auth-updated", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("cart-updated", () => {
      setCartCount(readJSON("cart", []).reduce((sum, item) => sum + (item.quantity || 1), 0));
    });
    return () => {
      window.removeEventListener("auth-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [loadOrders]);

  const handleLogout = async () => {
    try {
      if (getAuth()?.token) {
        await api.post("/auth/logout");
      }
    } catch {
      // ignore logout API errors
    }
    clearAuth();
    navigate("/login");
  };

  if (!user) {
    return (
      <main>
        <section className="ac-hero">
          <div className="container">
            <nav className="ac-breadcrumb" aria-label="breadcrumb">
              <Link to="/">Home</Link>
              <i className="bi bi-chevron-right"></i>
              <span>My Account</span>
            </nav>
            <h1>My Account</h1>
            <p>Manage your profile, orders and shopping preferences.</p>
          </div>
        </section>

        <section className="ac-main">
          <div className="container">
            <div className="ac-auth-card">
              <div className="ac-auth-icon">
                <i className="bi bi-person-lock"></i>
              </div>
              <h2>Welcome to WinterStore</h2>
              <p>Please log in to access your account.</p>
              <div className="ac-auth-buttons">
                <Link to="/login" className="btn btn-dark btn-lg px-5">
                  Login
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link to="/register" className="btn btn-outline-dark btn-lg px-5">
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const fullName = (profile && profile.name) || user.name || "";
  const email = (profile && profile.email) || user.email || "";
  const phone = (profile && profile.phone) || "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  const openEdit = () => {
    setEditForm({ name: fullName, email, phone });
    setEditErrors({});
    setSaved(false);
    setProfileError("");
    setEditing(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const next = {};
    if (!editForm.name.trim()) {
      next.name = "Please enter your full name.";
    }
    if (!editForm.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!emailRegex.test(editForm.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (editForm.phone.trim() && !phoneRegex.test(editForm.phone.trim())) {
      next.phone = "Please enter a valid phone number.";
    }
    setEditErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingProfile(true);
    setProfileError("");
    try {
      const res = await api.put("/auth/me", {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      });
      const current = getAuth();
      setAuth({ token: current?.token, user: res.data.user });
      setProfile(res.data.user);
      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setProfileError(
        err?.response?.data?.message || "We couldn't save your profile. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const navItem = (key, icon, label, active) => {
    if (key === "orders") {
      return (
        <Link to="/orders" className="ac-nav-item" key="orders">
          <i className={`bi ${icon}`}></i>
          <span>{label}</span>
        </Link>
      );
    }
    if (key === "wishlist") {
      return (
        <Link to="/wishlist" className="ac-nav-item" key="wishlist">
          <i className={`bi ${icon}`}></i>
          <span>{label}</span>
        </Link>
      );
    }
    if (key === "cart") {
      return (
        <Link to="/cart" className="ac-nav-item" key="cart">
          <i className={`bi ${icon}`}></i>
          <span>{label}</span>
        </Link>
      );
    }
    if (key === "feedback") {
      return (
        <Link to="/feedback" className="ac-nav-item" key="feedback">
          <i className={`bi ${icon}`}></i>
          <span>{label}</span>
        </Link>
      );
    }
    return (
      <button
        type="button"
        className={`ac-nav-item ${active ? "active" : ""}`}
        onClick={() => setView(key)}
        key={key}
      >
        <i className={`bi ${icon}`}></i>
        <span>{label}</span>
      </button>
    );
  };

  const orderItemsCount = (order) =>
    order.item_count != null
      ? order.item_count
      : (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <main>
      <section className="ac-hero">
        <div className="container">
          <nav className="ac-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>My Account</span>
          </nav>
          <h1>My Account</h1>
          <p>Manage your profile, orders and shopping preferences.</p>
        </div>
      </section>

      <section className="ac-main">
        <div className="container">
          <div className="row g-4 g-lg-5">

            <aside className="col-md-4 col-lg-3">
              <div className="ac-sidebar">
                <div className="ac-user">
                  {initials ? (
                    <div className="ac-avatar">{initials}</div>
                  ) : (
                    <div className="ac-avatar">
                      <i className="bi bi-person"></i>
                    </div>
                  )}
                  <div className="ac-user-meta">
                    <strong>{fullName || "WinterStore Member"}</strong>
                    <span>{email || "—"}</span>
                  </div>
                </div>

                <nav className="ac-nav">
                  {navItem("overview", "bi-grid", "Overview", view === "overview")}
                  {navItem("orders", "bi-box-seam", "My Orders")}
                  {navItem("wishlist", "bi-heart", "Wishlist")}
                  {navItem("cart", "bi-bag", "Cart")}
                  {navItem("profile", "bi-person", "Profile Settings", view === "profile")}
                  {navItem("feedback", "bi-chat-heart", "Give Feedback")}
                  <button
                    type="button"
                    className="ac-nav-item ac-nav-logout"
                    data-bs-toggle="modal"
                    data-bs-target="#accountLogoutModal"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </button>
                </nav>
              </div>
            </aside>

            <div className="col-md-8 col-lg-9">

              {view === "overview" && (
                <>
                  <div className="ac-card ac-welcome">
                    <div className="ac-welcome-head">
                      <div>
                        <h2>Welcome Back!</h2>
                        <p>
                          Here's what's happening with your WinterStore account.
                        </p>
                      </div>
                      <i className="bi bi-snow"></i>
                    </div>
                  </div>

                  <div className="row g-3 g-lg-4 mb-4">
                    <div className="col-md-4">
                      <div className="ac-stat">
                        <div className="ac-stat-icon ac-stat-orders">
                          <i className="bi bi-box-seam"></i>
                        </div>
                        <strong>{orders.length}</strong>
                        <span>Orders</span>
                        <Link to="/orders" className="ac-stat-link">
                          View Orders
                          <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="ac-stat">
                        <div className="ac-stat-icon ac-stat-wishlist">
                          <i className="bi bi-heart"></i>
                        </div>
                        <strong>{wishlistCount}</strong>
                        <span>Wishlist</span>
                        <Link to="/wishlist" className="ac-stat-link">
                          View Wishlist
                          <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="ac-stat">
                        <div className="ac-stat-icon ac-stat-cart">
                          <i className="bi bi-bag"></i>
                        </div>
                        <strong>{cartCount}</strong>
                        <span>Cart Items</span>
                        <Link to="/cart" className="ac-stat-link">
                          View Cart
                          <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="ac-card">
                    <div className="ac-card-head">
                      <div className="ac-card-icon">
                        <i className="bi bi-clock-history"></i>
                      </div>
                      <div>
                        <h2>Recent Orders</h2>
                        <p>Your latest orders at a glance.</p>
                      </div>
                    </div>

                    {ordersLoading ? (
                      <div className="ac-empty-orders">
                        <div className="spinner-border text-dark" role="status"></div>
                        <h3>Loading orders...</h3>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="ac-empty-orders">
                        <i className="bi bi-inbox"></i>
                        <h3>No orders yet</h3>
                        <p>
                          When you place an order, it will show up here.
                        </p>
                        <Link to="/shop" className="btn btn-dark px-4">
                          Start Shopping
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="ac-orders">
                          {orders.slice(0, 3).map((order) => (
                            <Link
                              to={`/orders/${order.id}`}
                              className="ac-order"
                              key={order.id}
                            >
                              <div className="ac-order-main">
                                <strong>#{order.order_number || order.id}</strong>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                              <div className="ac-order-side">
                                <span>
                                  {orderItemsCount(order)}
                                  {orderItemsCount(order) === 1 ? " item" : " items"}
                                </span>
                                <strong className="ac-order-total">
                                  {rs(order.total)}
                                </strong>
                                <span className={statusClass(order.status)}>
                                  {statusLabel(order.status)}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="ac-card-foot">
                          <Link to="/orders" className="ac-text-link">
                            View All Orders
                            <i className="bi bi-arrow-right"></i>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="ac-card">
                    <div className="ac-card-head">
                      <div className="ac-card-icon">
                        <i className="bi bi-person-gear"></i>
                      </div>
                      <div>
                        <h2>Profile Information</h2>
                        <p>Your WinterStore account details.</p>
                      </div>
                    </div>

                    {editing ? (
                      <form className="ac-edit-form" onSubmit={saveProfile} noValidate>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="co-label" htmlFor="ac-name">
                              Full Name <span>*</span>
                            </label>
                            <input
                              id="ac-name"
                              type="text"
                              className={`co-input ${editErrors.name ? "invalid" : ""}`}
                              value={editForm.name}
                              onChange={(e) => {
                                setEditForm((prev) => ({ ...prev, name: e.target.value }));
                                setEditErrors((prev) =>
                                  prev.name ? { ...prev, name: undefined } : prev
                                );
                              }}
                            />
                            {editErrors.name && (
                              <p className="co-error">{editErrors.name}</p>
                            )}
                          </div>
                          <div className="col-md-6">
                            <label className="co-label" htmlFor="ac-email">
                              Email <span>*</span>
                            </label>
                            <input
                              id="ac-email"
                              type="email"
                              className={`co-input ${editErrors.email ? "invalid" : ""}`}
                              value={editForm.email}
                              onChange={(e) => {
                                setEditForm((prev) => ({ ...prev, email: e.target.value }));
                                setEditErrors((prev) =>
                                  prev.email ? { ...prev, email: undefined } : prev
                                );
                              }}
                            />
                            {editErrors.email && (
                              <p className="co-error">{editErrors.email}</p>
                            )}
                          </div>
                          <div className="col-md-6">
                            <label className="co-label" htmlFor="ac-phone">
                              Phone Number
                            </label>
                            <input
                              id="ac-phone"
                              type="tel"
                              className={`co-input ${editErrors.phone ? "invalid" : ""}`}
                              value={editForm.phone}
                              onChange={(e) => {
                                setEditForm((prev) => ({ ...prev, phone: e.target.value }));
                                setEditErrors((prev) =>
                                  prev.phone ? { ...prev, phone: undefined } : prev
                                );
                              }}
                            />
                            {editErrors.phone && (
                              <p className="co-error">{editErrors.phone}</p>
                            )}
                          </div>
                          {profileError && (
                            <div className="col-12">
                              <p className="co-error">
                                <i className="bi bi-exclamation-circle-fill me-1"></i>
                                {profileError}
                              </p>
                            </div>
                          )}
                          <div className="col-12 mt-3">
                            <button type="submit" className="btn btn-dark px-4" disabled={savingProfile}>
                              {savingProfile ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  Save Changes
                                  <i className="bi bi-check-lg ms-2"></i>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary ms-2"
                              onClick={() => setEditing(false)}
                              disabled={savingProfile}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="ac-profile">
                          <div className="ac-profile-row">
                            <span>Full Name</span>
                            <strong>{fullName || "Not provided"}</strong>
                          </div>
                          <div className="ac-profile-row">
                            <span>Email</span>
                            <strong>{email || "Not provided"}</strong>
                          </div>
                          <div className="ac-profile-row">
                            <span>Phone Number</span>
                            <strong className={phone ? "" : "ac-muted"}>
                              {phone || "Not provided"}
                            </strong>
                          </div>
                        </div>
                        {saved && (
                          <p className="ac-saved-note">
                            <i className="bi bi-check-circle-fill"></i>
                            Profile updated successfully.
                          </p>
                        )}
                        <div className="ac-card-foot">
                          <button
                            type="button"
                            className="ac-text-link"
                            onClick={openEdit}
                          >
                            <i className="bi bi-pencil"></i>
                            Edit Profile
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="ac-card">
                    <div className="ac-card-head">
                      <div className="ac-card-icon">
                        <i className="bi bi-lightning"></i>
                      </div>
                      <div>
                        <h2>Quick Access</h2>
                        <p>Jump straight to your favorite places.</p>
                      </div>
                    </div>

                    <div className="ac-quick">
                      <Link to="/orders" className="ac-quick-item">
                        <i className="bi bi-box-seam"></i>
                        <span>My Orders</span>
                      </Link>
                      <Link to="/wishlist" className="ac-quick-item">
                        <i className="bi bi-heart"></i>
                        <span>Wishlist</span>
                      </Link>
                      <Link to="/cart" className="ac-quick-item">
                        <i className="bi bi-bag"></i>
                        <span>Shopping Cart</span>
                      </Link>
                      <Link to="/shop" className="ac-quick-item">
                        <i className="bi bi-compass"></i>
                        <span>Continue Shopping</span>
                      </Link>
                      <Link to="/feedback" className="ac-quick-item">
                        <i className="bi bi-chat-heart"></i>
                        <span>Give Feedback</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {view === "profile" && (
                <div className="ac-card">
                  <div className="ac-card-head">
                    <div className="ac-card-icon">
                      <i className="bi bi-person-gear"></i>
                    </div>
                    <div>
                      <h2>Profile Settings</h2>
                      <p>Update your WinterStore profile details.</p>
                    </div>
                  </div>

                  {editing ? (
                    <form className="ac-edit-form" onSubmit={saveProfile} noValidate>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="co-label" htmlFor="ac-name">
                            Full Name <span>*</span>
                          </label>
                          <input
                            id="ac-name"
                            type="text"
                            className={`co-input ${editErrors.name ? "invalid" : ""}`}
                            value={editForm.name}
                            onChange={(e) => {
                              setEditForm((prev) => ({ ...prev, name: e.target.value }));
                              setEditErrors((prev) =>
                                prev.name ? { ...prev, name: undefined } : prev
                              );
                            }}
                          />
                          {editErrors.name && (
                            <p className="co-error">{editErrors.name}</p>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label className="co-label" htmlFor="ac-email">
                            Email <span>*</span>
                          </label>
                          <input
                            id="ac-email"
                            type="email"
                            className={`co-input ${editErrors.email ? "invalid" : ""}`}
                            value={editForm.email}
                            onChange={(e) => {
                              setEditForm((prev) => ({ ...prev, email: e.target.value }));
                              setEditErrors((prev) =>
                                prev.email ? { ...prev, email: undefined } : prev
                              );
                            }}
                          />
                          {editErrors.email && (
                            <p className="co-error">{editErrors.email}</p>
                          )}
                        </div>
                        <div className="col-md-6">
                          <label className="co-label" htmlFor="ac-phone">
                            Phone Number
                          </label>
                          <input
                            id="ac-phone"
                            type="tel"
                            className={`co-input ${editErrors.phone ? "invalid" : ""}`}
                            value={editForm.phone}
                            onChange={(e) => {
                              setEditForm((prev) => ({ ...prev, phone: e.target.value }));
                              setEditErrors((prev) =>
                                prev.phone ? { ...prev, phone: undefined } : prev
                              );
                            }}
                          />
                          {editErrors.phone && (
                            <p className="co-error">{editErrors.phone}</p>
                          )}
                        </div>
                        {profileError && (
                          <div className="col-12">
                            <p className="co-error">
                              <i className="bi bi-exclamation-circle-fill me-1"></i>
                              {profileError}
                            </p>
                          </div>
                        )}
                        <div className="col-12 mt-3">
                          <button type="submit" className="btn btn-dark px-4" disabled={savingProfile}>
                            {savingProfile ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                Save Changes
                                <i className="bi bi-check-lg ms-2"></i>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary ms-2"
                            onClick={() => setEditing(false)}
                            disabled={savingProfile}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="ac-profile">
                        <div className="ac-profile-row">
                          <span>Full Name</span>
                          <strong>{fullName || "Not provided"}</strong>
                        </div>
                        <div className="ac-profile-row">
                          <span>Email</span>
                          <strong>{email || "Not provided"}</strong>
                        </div>
                        <div className="ac-profile-row">
                          <span>Phone Number</span>
                          <strong className={phone ? "" : "ac-muted"}>
                            {phone || "Not provided"}
                          </strong>
                        </div>
                      </div>
                      {saved && (
                        <p className="ac-saved-note">
                          <i className="bi bi-check-circle-fill"></i>
                          Profile updated successfully.
                        </p>
                      )}
                      <div className="ac-card-foot">
                        <button
                          type="button"
                          className="ac-text-link"
                          onClick={openEdit}
                        >
                          <i className="bi bi-pencil"></i>
                          Edit Profile
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      <div
        className="modal fade"
        id="accountLogoutModal"
        tabIndex="-1"
        aria-hidden="true"
        aria-labelledby="accountLogoutModalLabel"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content ac-mod-content">
            <div className="modal-header border-0 pb-0">
              <h5 className="ac-mod-title" id="accountLogoutModalLabel">
                <i className="bi bi-box-arrow-right"></i>
                Logout
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body pt-2">
              <p>Are you sure you want to log out of WinterStore?</p>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Account;