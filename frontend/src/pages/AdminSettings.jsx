import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as bootstrap from "bootstrap";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminSidebar from "../components/admin/AdminSidebar";

const EMPTY_STORE = {
  store_name: "",
  store_tagline: "",
  store_email: "",
  store_phone: "",
  store_address: "",
  currency: "",
};

const getErrorMessage = (err, fallback) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string" && msg) return msg;
  const errs = err?.response?.data?.errors;
  if (Array.isArray(errs) && errs.length) return errs.join(". ");
  return fallback;
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
      id="adminSettingsNav"
      ref={ref}
      tabIndex="-1"
      aria-labelledby="adminSettingsNavLabel"
    >
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title" id="adminSettingsNavLabel">
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

function AdminSettings() {
  const navigate = useNavigate();
  const location = useLocation();

  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [storeForm, setStoreForm] = useState(EMPTY_STORE);
  const [storeErrors, setStoreErrors] = useState({});
  const [savingStore, setSavingStore] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);

  const notify = (type, text) => {
    setAlert({ type, text });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), 4000);
  };

  const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

  const validateStore = (form) => {
    const errors = {};
    if (form.store_name && form.store_name.length > 100) errors.store_name = "Must be 100 characters or fewer.";
    if (form.store_tagline && form.store_tagline.length > 255) errors.store_tagline = "Must be 255 characters or fewer.";
    if (form.store_email && !EMAIL_REGEX.test(form.store_email.trim())) errors.store_email = "Enter a valid email address.";
    if (form.store_email && form.store_email.length > 190) errors.store_email = "Must be 190 characters or fewer.";
    if (form.store_phone && form.store_phone.length > 30) errors.store_phone = "Must be 30 characters or fewer.";
    if (form.store_address && form.store_address.length > 500) errors.store_address = "Must be 500 characters or fewer.";
    if (form.currency && form.currency.length > 10) errors.currency = "Must be 10 characters or fewer.";
    return errors;
  };

  const validateProfile = (form) => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required.";
    else if (form.name.length > 100) errors.name = "Must be 100 characters or fewer.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email.trim())) errors.email = "Enter a valid email address.";
    else if (form.email.length > 190) errors.email = "Must be 190 characters or fewer.";
    return errors;
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const loadSettings = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await api.get("/admin/settings");
        if (cancelled) return;
        const data = res.data?.data || {};
        const store = { ...EMPTY_STORE, ...(data.store || {}) };
        setSettings({ store, profile: data.profile || { name: "", email: "" } });
        setStoreForm(store);
        setProfileForm({
          name: data.profile?.name || "",
          email: data.profile?.email || "",
        });
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "Failed to load settings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSettings();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, refresh]);

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

  const handleStoreField = (field) => (e) => {
    setStoreForm((prev) => ({ ...prev, [field]: e.target.value }));
    setStoreErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetStore = () => {
    if (settings) setStoreForm({ ...settings.store });
    setStoreErrors({});
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (savingStore) return;

    const errors = validateStore(storeForm);
    if (Object.values(errors).some(Boolean)) {
      setStoreErrors(errors);
      return;
    }

    setSavingStore(true);
    try {
      const payload = {};
      for (const key of Object.keys(EMPTY_STORE)) {
        payload[key] = (storeForm[key] || "").trim();
      }
      const res = await api.put("/admin/settings", { store: payload });
      const data = res.data?.data;
      const nextStore = { ...EMPTY_STORE, ...(data?.store || {}) };
      setSettings((prev) => ({ store: nextStore, profile: prev?.profile || { name: "", email: "" } }));
      setStoreForm(nextStore);
      notify("success", "Store settings saved successfully.");
    } catch (err) {
      notify("danger", getErrorMessage(err, "Failed to save store settings."));
    } finally {
      setSavingStore(false);
    }
  };

  const handleProfileField = (field) => (e) => {
    setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));
    setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const resetProfile = () => {
    if (settings) setProfileForm({ name: settings.profile?.name || "", email: settings.profile?.email || "" });
    setProfileErrors({});
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (savingProfile) return;

    const errors = validateProfile(profileForm);
    if (Object.values(errors).some(Boolean)) {
      setProfileErrors(errors);
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.put("/admin/settings/profile", {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      const profile = res.data?.data?.profile;
      if (profile) {
        setSettings((prev) => ({
          store: prev?.store || EMPTY_STORE,
          profile,
        }));
        setProfileForm({ name: profile.name, email: profile.email });
        if (auth && auth.token) {
          const updated = { token: auth.token, user: { ...auth.user, name: profile.name, email: profile.email } };
          setAuth(updated);
          setAuthState(updated);
        }
        notify("success", "Profile updated successfully.");
      }
    } catch (err) {
      notify("danger", getErrorMessage(err, "Failed to update profile."));
    } finally {
      setSavingProfile(false);
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
                  <h1>Settings</h1>
                  <p>Sign in with an administrator account to continue.</p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3 text-start">
                      <label className="form-label" htmlFor="set-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="set-email"
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
                      <label className="form-label" htmlFor="set-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="set-password"
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
                    admin settings area is restricted to admin users.
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

  const storeField = (field) => {
    const labelMap = {
      store_name: "Store Name",
      store_tagline: "Store Description",
      store_email: "Store Email",
      store_phone: "Store Phone",
      store_address: "Store Address",
      currency: "Currency",
    };
    const placeholders = {
      store_name: "e.g. WinterStore",
      store_tagline: "e.g. Premium winter clothing",
      store_email: "e.g. hello@winterstore.com",
      store_phone: "e.g. +00 000 0000000",
      store_address: "e.g. Street, City, Country",
      currency: "e.g. Rs.",
    };
    return { label: labelMap[field], placeholder: placeholders[field] };
  };

  return (
    <main>
      <div className="admin-dash">
        <aside className="admin-dash-side d-none d-xl-flex">
          <AdminSidebar
            active="settings"
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
            active="settings"
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
                <h1>Settings</h1>
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
                <h2 className="admin-dash-section-title mb-0">Settings</h2>
                <p className="admin-dash-subtitle mb-0">
                  Manage your WinterStore store configuration and preferences.
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

            {loading ? (
              <div className="card admin-dash-card shadow-sm">
                <div className="admin-empty">
                  <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                  <p>Loading settings...</p>
                </div>
              </div>
            ) : loadError ? (
              <div className="card admin-dash-card shadow-sm">
                <div className="admin-empty">
                  <i className="bi bi-wifi-off admin-empty-icon"></i>
                  <h3>Could not load settings</h3>
                  <p>{loadError}</p>
                  <button type="button" className="btn btn-outline-dark" onClick={() => setRefresh((r) => r + 1)}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="card admin-dash-card shadow-sm mb-4">
                  <div className="admin-dash-card-head">
                    <h3>
                      <i className="bi bi-shop me-2"></i>
                      Store Information
                    </h3>
                    <span className="admin-dash-more muted">Store-wide configuration</span>
                  </div>
                  <div className="admin-dash-card-body">
                    <form onSubmit={handleSaveStore} noValidate>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="set-store-name">
                            {storeField("store_name").label}
                          </label>
                          <input
                            id="set-store-name"
                            type="text"
                            className="form-control"
                            placeholder={storeField("store_name").placeholder}
                            value={storeForm.store_name}
                            onChange={handleStoreField("store_name")}
                          />
                          {storeErrors.store_name && <div className="form-text text-danger">{storeErrors.store_name}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="set-currency">
                            {storeField("currency").label}
                          </label>
                          <input
                            id="set-currency"
                            type="text"
                            className="form-control"
                            placeholder={storeField("currency").placeholder}
                            value={storeForm.currency}
                            onChange={handleStoreField("currency")}
                          />
                          {storeErrors.currency && <div className="form-text text-danger">{storeErrors.currency}</div>}
                        </div>
                        <div className="col-12">
                          <label className="form-label" htmlFor="set-store-tagline">
                            {storeField("store_tagline").label}
                          </label>
                          <input
                            id="set-store-tagline"
                            type="text"
                            className="form-control"
                            placeholder={storeField("store_tagline").placeholder}
                            value={storeForm.store_tagline}
                            onChange={handleStoreField("store_tagline")}
                          />
                          {storeErrors.store_tagline && <div className="form-text text-danger">{storeErrors.store_tagline}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="set-store-email">
                            {storeField("store_email").label}
                          </label>
                          <input
                            id="set-store-email"
                            type="email"
                            className="form-control"
                            placeholder={storeField("store_email").placeholder}
                            value={storeForm.store_email}
                            onChange={handleStoreField("store_email")}
                          />
                          {storeErrors.store_email && <div className="form-text text-danger">{storeErrors.store_email}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="set-store-phone">
                            {storeField("store_phone").label}
                          </label>
                          <input
                            id="set-store-phone"
                            type="tel"
                            className="form-control"
                            placeholder={storeField("store_phone").placeholder}
                            value={storeForm.store_phone}
                            onChange={handleStoreField("store_phone")}
                          />
                          {storeErrors.store_phone && <div className="form-text text-danger">{storeErrors.store_phone}</div>}
                        </div>
                        <div className="col-12">
                          <label className="form-label" htmlFor="set-store-address">
                            {storeField("store_address").label}
                          </label>
                          <textarea
                            id="set-store-address"
                            className="form-control"
                            rows="2"
                            placeholder={storeField("store_address").placeholder}
                            value={storeForm.store_address}
                            onChange={handleStoreField("store_address")}
                          ></textarea>
                          {storeErrors.store_address && <div className="form-text text-danger">{storeErrors.store_address}</div>}
                        </div>
                      </div>
                      <div className="admin-settings-actions">
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetStore}>
                          <i className="bi bi-arrow-counterclockwise me-1"></i>
                          Reset
                        </button>
                        <button type="submit" className="btn btn-dark btn-sm" disabled={savingStore}>
                          {savingStore ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              Save Changes
                              <i className="bi bi-check-lg ms-2"></i>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="card admin-dash-card shadow-sm">
                  <div className="admin-dash-card-head">
                    <h3>
                      <i className="bi bi-person-circle me-2"></i>
                      Admin Profile
                    </h3>
                    <span className="admin-dash-more muted">Account details</span>
                  </div>
                  <div className="admin-dash-card-body">
                    <form onSubmit={handleSaveProfile} noValidate>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="set-profile-name">
                            Full Name
                          </label>
                          <input
                            id="set-profile-name"
                            type="text"
                            className="form-control"
                            placeholder="e.g. WinterStore Admin"
                            value={profileForm.name}
                            onChange={handleProfileField("name")}
                          />
                          {profileErrors.name && <div className="form-text text-danger">{profileErrors.name}</div>}
                        </div>
                        <div className="col-md-6">
                          <label className="form-label" htmlFor="set-profile-email">
                            Email
                          </label>
                          <input
                            id="set-profile-email"
                            type="email"
                            className="form-control"
                            placeholder="e.g. admin@winterstore.com"
                            value={profileForm.email}
                            onChange={handleProfileField("email")}
                          />
                          {profileErrors.email && <div className="form-text text-danger">{profileErrors.email}</div>}
                        </div>
                      </div>
                      <p className="admin-settings-note mt-3 mb-3">
                        <i className="bi bi-shield-lock me-1"></i>
                        Your password is managed by the existing login system and is never shown or stored in these settings. Only administrators can edit this profile.
                      </p>
                      <div className="admin-settings-actions">
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetProfile}>
                          <i className="bi bi-arrow-counterclockwise me-1"></i>
                          Reset
                        </button>
                        <button type="submit" className="btn btn-dark btn-sm" disabled={savingProfile}>
                          {savingProfile ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              Save Changes
                              <i className="bi bi-check-lg ms-2"></i>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminSettings;