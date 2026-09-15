import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ratingLabels = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const feedbackPerks = [
  {
    icon: "bi-stars",
    title: "Help Us Improve",
    description: "Your honest feedback helps us refine our products and services.",
  },
  {
    icon: "bi-chat-heart",
    title: "Sharing What Works",
    description: "Tell us what you love so we can do more of it.",
  },
  {
    icon: "bi-shield-check",
    title: "Better Experience",
    description: "We read every submission and use it to make WinterStore better.",
  },
];

const emptyForm = {
  name: "",
  email: "",
  rating: 0,
  message: "",
};

const readUser = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("winterstore_user"));
    return raw && raw.loggedIn ? raw : null;
  } catch {
    return null;
  }
};

function Feedback() {
  const loggedInUser = readUser();

  const [form, setForm] = useState({
    ...emptyForm,
    name: loggedInUser?.name || "",
    email: loggedInUser?.email || "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
    if (submitted) setSubmitted(false);
    if (submitError) setSubmitError("");
  };

  const handleRating = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
    setErrors((prev) => {
      if (prev.rating) {
        const next = { ...prev };
        delete next.rating;
        return next;
      }
      return prev;
    });
    if (submitted) setSubmitted(false);
    if (submitError) setSubmitError("");
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your full name.";
    if (!form.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!emailRegex.test(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.rating || form.rating < 1 || form.rating > 5) {
      next.rating = "Please select a rating.";
    }
    if (!form.message.trim()) next.message = "Please write your feedback.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitted(false);
    setSubmitError("");

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const response = await api.post("/feedback", {
        name: form.name.trim(),
        email: form.email.trim(),
        rating: Number(form.rating),
        message: form.message.trim(),
      });
      if (response.data && response.data.success) {
        setForm({ ...emptyForm, name: loggedInUser?.name || "", email: loggedInUser?.email || "" });
        setSubmitted(true);
      } else {
        setSubmitError("We couldn't submit your feedback right now. Please try again.");
      }
    } catch (err) {
      const message = err?.response?.data?.message;
      if (
        message &&
        (message.includes("required") ||
          message.includes("valid email") ||
          message.includes("Rating"))
      ) {
        setSubmitError(message);
      } else {
        setSubmitError("We couldn't submit your feedback right now. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>

      <section className="feedback-hero">
        <div className="container">
          <nav className="feedback-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Feedback</span>
          </nav>
          <span className="feedback-hero-badge">
            <i className="bi bi-chat-square-heart"></i>
            We'd Love To Hear From You
          </span>
          <h1>Share Your Feedback</h1>
          <p>
            Your feedback helps us improve WinterStore and provide you with a
            better shopping experience.
          </p>
        </div>
      </section>

      <section className="feedback-main">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="section-heading text-center mb-5">
                <span>FEEDBACK</span>
                <h2>Tell Us What You Think</h2>
                <p>
                  Rate your experience and share how we can make WinterStore
                  better for you.
                </p>
              </div>

              <div className="feedback-form-card">
                <div className="feedback-form-title text-center">
                  <span>YOUR OPINION MATTERS</span>
                  <h3>Leave Your Feedback</h3>
                </div>

                {submitted && (
                  <div className="feedback-success" role="status">
                    <i className="bi bi-check-circle-fill"></i>
                    Thank you for your feedback! We appreciate you taking the
                    time to share your experience.
                  </div>
                )}

                {submitError && (
                  <div className="feedback-error" role="alert">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {submitError}
                  </div>
                )}

                <form className="feedback-form" onSubmit={handleSubmit} noValidate>
                  <div className="row g-3 g-lg-4">
                    <div className="col-md-6">
                      <label className="feedback-form-label" htmlFor="feedback-name">
                        Full Name <span>*</span>
                      </label>
                      <input
                        id="feedback-name"
                        type="text"
                        className={`feedback-form-input ${errors.name ? "invalid" : ""}`}
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        autoComplete="name"
                        required
                      />
                      {errors.name && (
                        <p className="feedback-field-error">{errors.name}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="feedback-form-label" htmlFor="feedback-email">
                        Email Address <span>*</span>
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        className={`feedback-form-input ${errors.email ? "invalid" : ""}`}
                        placeholder="Enter your email address"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        autoComplete="email"
                        required
                      />
                      {errors.email && (
                        <p className="feedback-field-error">{errors.email}</p>
                      )}
                    </div>

                    <div className="col-12">
                      <span className="feedback-form-label d-block">
                        Your Rating <span>*</span>
                      </span>
                      <div
                        className="feedback-rating"
                        role="radiogroup"
                        aria-label="Choose a rating"
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={form.rating === value}
                            aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                            className={`feedback-star-btn ${
                              form.rating >= value ? "filled" : ""
                            }`}
                            onClick={() => handleRating(value)}
                          >
                            <i
                              className={`bi ${
                                form.rating >= value ? "bi-star-fill" : "bi-star"
                              }`}
                            ></i>
                          </button>
                        ))}
                        <span className="feedback-rating-label">
                          {form.rating
                            ? `${form.rating} / 5 — ${ratingLabels[form.rating]}`
                            : "Select a star rating"}
                        </span>
                      </div>
                      {errors.rating && (
                        <p className="feedback-field-error">{errors.rating}</p>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="feedback-form-label" htmlFor="feedback-message">
                        Feedback <span>*</span>
                      </label>
                      <textarea
                        id="feedback-message"
                        className={`feedback-form-textarea ${errors.message ? "invalid" : ""}`}
                        placeholder="Tell us about your experience..."
                        value={form.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        required
                      ></textarea>
                      {errors.message && (
                        <p className="feedback-field-error">{errors.message}</p>
                      )}
                    </div>

                    <div className="col-12 pt-2">
                      <button
                        type="submit"
                        className="feedback-submit"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              aria-hidden="true"
                            ></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Feedback
                            <i className="bi bi-send"></i>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feedback-support">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WHY YOUR FEEDBACK MATTERS</span>
            <h2>Every Voice Counts</h2>
            <p>Here's what we do with the feedback you share with us.</p>
          </div>

          <div className="row g-4">
            {feedbackPerks.map((item, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-box">
            <h2>Haven't Shopped With Us Yet?</h2>
            <p>
              Explore our winter collections and experience WinterStore
              yourself.
            </p>
            <Link to="/shop" className="btn btn-light btn-lg px-5">
              Shop Now
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

export default Feedback;