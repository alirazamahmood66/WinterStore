import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { setAuth } from "../utils/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setErrors((prev) => (prev.email ? { ...prev, email: undefined } : prev));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrors((prev) => (prev.password ? { ...prev, password: undefined } : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const next = {};
    if (!email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!emailRegex.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!password) {
      next.password = "Please enter your password.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setFormError("");
    try {
      const res = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      setAuth({ token: res.data.token, user: res.data.user });
      const from =
        location.state?.from ||
        (res.data.user.role === "admin" ? "/admin" : "/account");
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="lg-section">
        <div className="container">
          <div className="lg-card">

              <>
                <div className="lg-brand">
                  WINTER<span>STORE</span>
                </div>

                <h1 className="lg-heading">Welcome Back</h1>
                <p className="lg-sub">
                  Sign in to continue shopping with WinterStore.
                </p>

                <form className="lg-form" onSubmit={handleSubmit} noValidate>
                  <div className="lg-field">
                    <label className="lg-label" htmlFor="login-email">
                      Email Address <span>*</span>
                    </label>
                    <div className="lg-input-wrap">
                      <i className="bi bi-envelope lg-input-icon"></i>
                      <input
                        id="login-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        className={`lg-input ${errors.email ? "invalid" : ""}`}
                        placeholder="you@example.com"
                        value={email}
                        onChange={handleEmailChange}
                        aria-invalid={errors.email ? "true" : "false"}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="lg-error">{errors.email}</p>
                    )}
                  </div>

                  <div className="lg-field">
                    <label className="lg-label" htmlFor="login-password">
                      Password <span>*</span>
                    </label>
                    <div className="lg-input-wrap">
                      <i className="bi bi-lock lg-input-icon"></i>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        className={`lg-input lg-input-pass ${errors.password ? "invalid" : ""}`}
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                        aria-invalid={errors.password ? "true" : "false"}
                        required
                      />
                      <button
                        type="button"
                        className="lg-pass-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </button>
                    </div>
                    {errors.password && (
                      <p className="lg-error">{errors.password}</p>
                    )}
                  </div>

                  <div className="lg-row">
                    <div className="form-check lg-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="login-remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="login-remember">
                        Remember Me
                      </label>
                    </div>
                    <Link to="/contact" className="lg-forgot">
                      Forgot Password?
                    </Link>
                  </div>

                  {formError && (
                    <div className="lg-error lg-form-error">
                      <i className="bi bi-exclamation-circle-fill me-2"></i>
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="lg-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing In...
                      </>
                    ) : (
                      <>
                        Login
                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                </form>

                <div className="lg-divider">
                  <span>or</span>
                </div>

                <p className="lg-register">
                  Don't have an account?{" "}
                  <Link to="/register">Create Account</Link>
                </p>
              </>

          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;