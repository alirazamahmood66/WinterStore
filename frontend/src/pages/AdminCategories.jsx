import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import { getAuth, isAdmin, setAuth, clearAuth } from "../utils/auth";
import AdminModal from "../components/admin/AdminModal";

const emptyForm = { name: "", slug: "", description: "", image: "" };

const getErrorMessage = (err, fallback) => {
  const msg = err?.response?.data?.message;
  if (typeof msg === "string" && msg) return msg;
  const errs = err?.response?.data?.errors;
  if (Array.isArray(errs) && errs.length) return errs.join(". ");
  return fallback;
};

function AdminCategories() {
  const [auth, setAuthState] = useState(getAuth);
  const [admin, setAdmin] = useState(isAdmin);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [alert, setAlert] = useState(null);
  const alertTimer = useRef(null);

  const notify = (type, text) => {
    setAlert({ type, text });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => setAlert(null), 4000);
  };

  const loadCategories = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/categories");
      setCategories(res.data.data || []);
    } catch (err) {
      setLoadError(getErrorMessage(err, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) loadCategories();
    return () => {
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

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
        notify("danger", "This account does not have admin access.");
      } else {
        notify("success", `Signed in as admin (${user.name}).`);
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
    setAuthState(null);
    setAdmin(false);
    setCategories([]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      image: cat.image || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image: form.image.trim() || null,
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
        notify("success", `Category "${payload.name}" updated successfully.`);
      } else {
        await api.post("/categories", payload);
        notify("success", `Category "${payload.name}" created successfully.`);
      }
      setShowForm(false);
      await loadCategories();
    } catch (err) {
      setFormError(getErrorMessage(err, editing ? "Failed to update category." : "Failed to create category."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      notify("success", `Category "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setDeleteTarget(null);
      notify("danger", getErrorMessage(err, "Failed to delete category."));
    } finally {
      setDeleting(false);
    }
  };

  const fieldChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    if (formError) setFormError("");
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
                  <h1>Admin Access</h1>
                  <p>
                    Sign in with an administrator account to manage WinterStore categories.
                  </p>

                  {loginError && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div>{loginError}</div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} noValidate>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="admin-email">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                        <input
                          id="admin-email"
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
                    <div className="mb-3">
                      <label className="form-label" htmlFor="admin-password">Password</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-lock"></i></span>
                        <input
                          id="admin-password"
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
                    <button
                      type="submit"
                      className="btn btn-dark w-100 admin-login-btn"
                      disabled={loggingIn}
                    >
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
                    Your account does not have administrator privileges. Categories can only
                    be managed by admin users.
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

  return (
    <main>
      <section className="admin-hero">
        <div className="container">
          <nav className="admin-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Admin</span>
            <i className="bi bi-chevron-right"></i>
            <span>Categories</span>
          </nav>
          <div className="admin-hero-head">
            <div>
              <h1>Category Management</h1>
              <p>Add, edit and remove product categories for WinterStore.</p>
            </div>
            <button type="button" className="btn btn-dark px-4" onClick={openCreate}>
              <i className="bi bi-plus-lg me-2"></i>
              Add Category
            </button>
          </div>
        </div>
      </section>

      <section className="admin-main">
        <div className="container">
          {alert && (
            <div className={`alert alert-${alert.type} admin-alert d-flex align-items-center`} role="alert">
              <i className={`bi ${alert.type === "success" ? "bi-check-circle" : "bi-exclamation-triangle"} me-2`}></i>
              <div>{alert.text}</div>
              <button type="button" className="btn-close ms-auto" onClick={() => setAlert(null)} aria-label="Close"></button>
            </div>
          )}

          <div className="card admin-card shadow-sm mb-4">
            <div className="card-header bg-transparent admin-card-head">
              <h2 className="mb-0">
                <i className="bi bi-collection me-2"></i>
                All Categories
              </h2>
              <span className="badge admin-badge">{categories.length} total</span>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="admin-empty">
                  <span className="spinner-border admin-spinner" role="status" aria-hidden="true"></span>
                  <p>Loading categories...</p>
                </div>
              ) : loadError ? (
                <div className="admin-empty">
                  <i className="bi bi-wifi-off admin-empty-icon"></i>
                  <h3>Could not load categories</h3>
                  <p>{loadError}</p>
                  <button type="button" className="btn btn-outline-dark" onClick={loadCategories}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Retry
                  </button>
                </div>
              ) : categories.length === 0 ? (
                <div className="admin-empty">
                  <i className="bi bi-inbox admin-empty-icon"></i>
                  <h3>No categories yet</h3>
                  <p>Add your first category to get started.</p>
                  <button type="button" className="btn btn-dark" onClick={openCreate}>
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Category
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle admin-table mb-0">
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Slug</th>
                        <th scope="col">Description</th>
                        <th scope="col" className="text-center">Products</th>
                        <th scope="col" className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={cat.id}>
                          <td>
                            <div className="admin-cat-name">
                              {cat.image ? (
                                <img src={cat.image} alt="" className="admin-cat-thumb" />
                              ) : (
                                <span className="admin-cat-thumb admin-cat-thumb-fallback">
                                  <i className="bi bi-tag"></i>
                                </span>
                              )}
                              <Link
                                to={`/admin/products?category_id=${cat.id}`}
                                className="admin-cat-link"
                                title={`View products in ${cat.name}`}
                              >
                                <strong>{cat.name}</strong>
                                <i className="bi bi-arrow-right admin-cat-link-icon"></i>
                              </Link>
                            </div>
                          </td>
                          <td>
                            <code className="admin-code">/{cat.slug}</code>
                          </td>
                          <td className="admin-desc">{cat.description || <span className="text-muted">—</span>}</td>
                          <td className="text-center">
                            <Link
                              to={`/admin/products?category_id=${cat.id}`}
                              className={`badge text-decoration-none ${Number(cat.product_count) > 0 ? "widget-badge" : "widget-badge-muted"}`}
                              title={`View ${cat.product_count} ${Number(cat.product_count) === 1 ? "product" : "products"} in ${cat.name}`}
                            >
                              {Number(cat.product_count)}
                            </Link>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dark me-2"
                              onClick={() => openEdit(cat)}
                              aria-label={`Edit ${cat.name}`}
                            >
                              <i className="bi bi-pencil"></i>
                              <span className="d-none d-sm-inline ms-1">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setDeleteTarget(cat)}
                              aria-label={`Delete ${cat.name}`}
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
          </div>
        </div>
      </section>

      <AdminModal
        modalId="categoryFormModal"
        show={showForm}
        title={editing ? "Edit Category" : "Add Category"}
        onClose={() => setShowForm(false)}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" form="categoryForm" disabled={saving}>
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
                      Add Category
                      <i className="bi bi-plus-lg ms-2"></i>
                    </>
                  )}
                </>
              )}
            </button>
          </>
        }
      >
        <form id="categoryForm" onSubmit={handleFormSubmit} noValidate>
          {formError && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <div>{formError}</div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label" htmlFor="cat-name">
              Category Name <span className="text-danger">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              className="form-control"
              placeholder="e.g. Winter Jackets"
              value={form.name}
              onChange={fieldChange("name")}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="cat-slug">
              Slug
            </label>
            <input
              id="cat-slug"
              type="text"
              className="form-control"
              placeholder="auto-generated from name (optional)"
              value={form.slug}
              onChange={fieldChange("slug")}
            />
            <div className="form-text">Leave empty to auto-generate a unique slug.</div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="cat-desc">
              Description
            </label>
            <textarea
              id="cat-desc"
              className="form-control"
              rows="3"
              placeholder="Short description of this category"
              value={form.description}
              onChange={fieldChange("description")}
            ></textarea>
          </div>

          <div className="mb-1">
            <label className="form-label" htmlFor="cat-image">
              Image URL
            </label>
            <input
              id="cat-image"
              type="url"
              className="form-control"
              placeholder="https://example.com/category.jpg (optional)"
              value={form.image}
              onChange={fieldChange("image")}
            />
          </div>
        </form>
      </AdminModal>

      <AdminModal
        modalId="categoryDeleteModal"
        show={Boolean(deleteTarget)}
        title="Delete Category"
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
                  Delete Category
                  <i className="bi bi-trash ms-2"></i>
                </>
              )}
            </button>
          </>
        }
      >
        {deleteTarget && (
          <p>
            Are you sure you want to delete{" "}
            <strong>"{deleteTarget.name}"</strong>?
            {Number(deleteTarget.product_count) > 0 && (
              <span className="d-block mt-2 text-danger">
                <i className="bi bi-exclamation-triangle me-1"></i>
                This category still contains {deleteTarget.product_count}{" "}
                {Number(deleteTarget.product_count) === 1 ? "product" : "products"} and cannot be
                deleted until they are moved or removed.
              </span>
            )}
          </p>
        )}
      </AdminModal>
    </main>
  );
}

export default AdminCategories;