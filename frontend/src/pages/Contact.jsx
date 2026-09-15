import { useState } from "react";
import { Link } from "react-router-dom";

const contactInfo = [
  {
    icon: "bi-envelope",
    label: "Email",
    value: "support@winterstore.com",
    note: "We reply within 24 hours",
  },
  {
    icon: "bi-telephone",
    label: "Phone",
    value: "+92 300 0000000",
    note: "Mon – Sat, 10:00 AM – 8:00 PM",
  },
  {
    icon: "bi-geo-alt",
    label: "Address",
    value: "Karachi, Pakistan",
    note: "Visit us for in-person help",
  },
  {
    icon: "bi-clock",
    label: "Business Hours",
    value: "Monday – Saturday",
    note: "10:00 AM – 8:00 PM",
  },
];

const supportCards = [
  {
    icon: "bi-headset",
    title: "Customer Support",
    description: "Need help? Our support team is ready to assist.",
  },
  {
    icon: "bi-patch-question",
    title: "Product Questions",
    description: "Need more information about a product? Ask us.",
  },
  {
    icon: "bi-box-seam",
    title: "Order Assistance",
    description: "Questions about your order? We're here to help.",
  },
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function Contact() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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
    if (form.phone.trim() && !/^[0-9+\s()-]+$/.test(form.phone.trim())) {
      next.phone = "Please enter a valid phone number.";
    }
    if (!form.subject.trim()) next.subject = "Please choose a subject.";
    if (!form.message.trim()) next.message = "Please write your message.";
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(false);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitted(true);
    setForm(emptyForm);
  };

  return (
    <main>

      <section className="contact-hero">
        <div className="container">
          <nav className="contact-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Contact</span>
          </nav>
          <span className="contact-hero-badge">
            <i className="bi bi-chat-dots"></i>
            Get In Touch
          </span>
          <h1>We're Here To Help</h1>
          <p>
            Have a question about your order, products, or shopping
            experience? Our team is here to help.
          </p>
        </div>
      </section>

      <section className="contact-main">
        <div className="container">
          <div className="row g-4 g-lg-5">

            <div className="col-lg-5">
              <div className="section-heading">
                <span>CONTACT INFORMATION</span>
                <h2>Let's Talk</h2>
                <p>
                  Whether you have a question about a product, your order, or
                  anything else, we'd love to hear from you.
                </p>
              </div>

              <div className="row g-3">
                {contactInfo.map((item, index) => (
                  <div className="col-md-6 col-lg-12" key={index}>
                    <div className="contact-info-card">
                      <div className="contact-info-icon">
                        <i className={`bi ${item.icon}`}></i>
                      </div>
                      <div>
                        <span className="contact-info-label">{item.label}</span>
                        <p className="contact-info-value">{item.value}</p>
                        {item.note && (
                          <span className="contact-info-note">{item.note}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="contact-form-card">
                <div className="contact-form-title">
                  <span>SEND A MESSAGE</span>
                  <h3>Send Us A Message</h3>
                </div>

                {submitted && (
                  <div className="contact-success">
                    <i className="bi bi-check-circle-fill"></i>
                    Thank you! Your message has been received. We'll get back
                    to you soon.
                  </div>
                )}

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="row g-3 g-lg-4">
                    <div className="col-md-6">
                      <label className="contact-form-label" htmlFor="contact-name">
                        Full Name <span>*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        className={`contact-form-input ${errors.name ? "invalid" : ""}`}
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        required
                      />
                      {errors.name && (
                        <p className="contact-field-error">{errors.name}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="contact-form-label" htmlFor="contact-email">
                        Email Address <span>*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        className={`contact-form-input ${errors.email ? "invalid" : ""}`}
                        placeholder="Enter your email address"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        required
                      />
                      {errors.email && (
                        <p className="contact-field-error">{errors.email}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="contact-form-label" htmlFor="contact-phone">
                        Phone Number
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        className={`contact-form-input ${errors.phone ? "invalid" : ""}`}
                        placeholder="Enter your phone number"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                      {errors.phone && (
                        <p className="contact-field-error">{errors.phone}</p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="contact-form-label" htmlFor="contact-subject">
                        Subject <span>*</span>
                      </label>
                      <input
                        id="contact-subject"
                        type="text"
                        className={`contact-form-input ${errors.subject ? "invalid" : ""}`}
                        placeholder="What is this about?"
                        value={form.subject}
                        onChange={(e) => handleChange("subject", e.target.value)}
                        required
                      />
                      {errors.subject && (
                        <p className="contact-field-error">{errors.subject}</p>
                      )}
                    </div>
                    <div className="col-12">
                      <label className="contact-form-label" htmlFor="contact-message">
                        Message <span>*</span>
                      </label>
                      <textarea
                        id="contact-message"
                        className={`contact-form-textarea ${errors.message ? "invalid" : ""}`}
                        placeholder="Write your message..."
                        value={form.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        required
                      ></textarea>
                      {errors.message && (
                        <p className="contact-field-error">{errors.message}</p>
                      )}
                    </div>
                    <div className="col-12 pt-2">
                      <button type="submit" className="contact-submit">
                        Send Message
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="contact-support">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WE'RE HERE FOR YOU</span>
            <h2>How Can We Help?</h2>
            <p>Three easy ways to get the support you need.</p>
          </div>

          <div className="row g-4">
            {supportCards.map((card, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-faq-cta">
        <div className="container">
          <h2>Looking For Quick Answers?</h2>
          <p>
            Check our frequently asked questions before contacting support.
          </p>
          <Link to="/faq" className="btn btn-dark btn-lg px-5">
            View FAQs
            <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-box">
            <h2>Need Help Choosing Your Style?</h2>
            <p>
              Explore our collections and discover something made for you.
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

export default Contact;