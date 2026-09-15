import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { setAuth } from "../utils/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s()-]{10,15}$/;

function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearError = (field) => {
    setErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const next = {};
    if (!firstName.trim()) {
      next.firstName = "Please enter your first name.";
    }
    if (!lastName.trim()) {
      next.lastName = "Please enter your last name.";
    }
    if (!email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!emailRegex.test(email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!phone.trim()) {
      next.phone = "Please enter your phone number.";
    } else if (!phoneRegex.test(phone.trim())) {
      next.phone = "Please enter a valid phone number.";
    }
    if (!password) {
      next.password = "Please enter a password.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (password && confirmPassword !== password) {
      next.confirmPassword = "Passwords do not match.";
    }
    if (!agreeTerms) {
      next.terms = "Please agree to the Terms & Conditions and Privacy Policy.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setFormError("");
    try {
      await api.post("/auth/register", {
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      const loginRes = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });
      setAuth({ token: loginRes.data.token, user: loginRes.data.user });
      navigate("/account", { replace: true });
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          "We couldn't create your account. Please try again."
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

                <h1 className="lg-heading">Create Your Account</h1>
                <p className="lg-sub">
                  Join WinterStore and enjoy a better shopping experience.
                </p>

                <form className="lg-form" onSubmit={handleSubmit} noValidate>

                  <div className="rg-name-row">
                    <div className="lg-field">
                      <label className="lg-label" htmlFor="register-first-name">
                        First Name <span>*</span>
                      </label>
                      <div className="lg-input-wrap">
                        <i className="bi bi-person lg-input-icon"></i>
                        <input
                          id="register-first-name"
                          type="text"
                          name="firstName"
                          autoComplete="given-name"
                          className={`lg-input ${errors.firstName ? "invalid" : ""}`}
                          placeholder="Enter your first name"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            clearError("firstName");
                          }}
                          aria-invalid={errors.firstName ? "true" : "false"}
                          required
                        />
                      </div>
                      {errors.firstName && (
                        <p className="lg-error">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="lg-field">
                      <label className="lg-label" htmlFor="register-last-name">
                        Last Name <span>*</span>
                      </label>
                      <div className="lg-input-wrap">
                        <i className="bi bi-person lg-input-icon"></i>
                        <input
                          id="register-last-name"
                          type="text"
                          name="lastName"
                          autoComplete="family-name"
                          className={`lg-input ${errors.lastName ? "invalid" : ""}`}
                          placeholder="Enter your last name"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            clearError("lastName");
                          }}
                          aria-invalid={errors.lastName ? "true" : "false"}
                          required
                        />
                      </div>
                      {errors.lastName && (
                        <p className="lg-error">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="lg-field">
                    <label className="lg-label" htmlFor="register-email">
                      Email Address <span>*</span>
                    </label>
                    <div className="lg-input-wrap">
                      <i className="bi bi-envelope lg-input-icon"></i>
                      <input
                        id="register-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        className={`lg-input ${errors.email ? "invalid" : ""}`}
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearError("email");
                        }}
                        aria-invalid={errors.email ? "true" : "false"}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="lg-error">{errors.email}</p>
                    )}
                  </div>

                  <div className="lg-field">
                    <label className="lg-label" htmlFor="register-phone">
                      Phone Number <span>*</span>
                    </label>
                    <div className="lg-input-wrap">
                      <i className="bi bi-telephone lg-input-icon"></i>
                      <input
                        id="register-phone"
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        className={`lg-input ${errors.phone ? "invalid" : ""}`}
                        placeholder="+92 3XX XXXXXXX"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          clearError("phone");
                        }}
                        aria-invalid={errors.phone ? "true" : "false"}
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="lg-error">{errors.phone}</p>
                    )}
                  </div>

                  <div className="lg-field">
                    <label className="lg-label" htmlFor="register-password">
                      Password <span>*</span>
                    </label>
                    <div className="lg-input-wrap">
                      <i className="bi bi-lock lg-input-icon"></i>
                      <input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        className={`lg-input lg-input-pass ${errors.password ? "invalid" : ""}`}
                        placeholder="Minimum 8 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearError("password");
                        }}
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

                  <div className="lg-field">
                    <label className="lg-label" htmlFor="register-confirm-password">
                      Confirm Password <span>*</span>
                    </label>
                    <div className="lg-input-wrap">
                      <i className="bi bi-shield-lock lg-input-icon"></i>
                      <input
                        id="register-confirm-password"
                        type={showConfirm ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        className={`lg-input lg-input-pass ${errors.confirmPassword ? "invalid" : ""}`}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          clearError("confirmPassword");
                        }}
                        aria-invalid={errors.confirmPassword ? "true" : "false"}
                        required
                      />
                      <button
                        type="button"
                        className="lg-pass-toggle"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="lg-error">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="lg-field">
                    <div className="form-check lg-check rg-terms">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="register-terms"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          clearError("terms");
                        }}
                      />
                      <label className="form-check-label" htmlFor="register-terms">
                        I agree to the{" "}
                        <Link to="/terms">Terms &amp; Conditions</Link> and{" "}
                        <Link to="/privacy-policy">Privacy Policy</Link>.
                      </label>
                    </div>
                    {errors.terms && (
                      <p className="lg-error">{errors.terms}</p>
                    )}
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                </form>

                <div className="lg-divider">
                  <span>or</span>
                </div>

                <p className="lg-register">
                  Already have an account? <Link to="/login">Login</Link>
                </p>
              </>

          </div>
        </div>
      </section>
    </main>
  );
}

export default Register;