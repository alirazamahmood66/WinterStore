import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../services/ProductsContext";
import api from "../services/api";
import { getAuth } from "../utils/auth";

const FREE_DELIVERY_THRESHOLD = 5000;
const STANDARD_DELIVERY_FEE = 200;

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Pakistan",
};

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
};

const rs = (n) => `Rs. ${n.toLocaleString()}`;

const trustItems = [
  {
    icon: "bi-shield-lock-check",
    title: "Secure Checkout",
    description:
      "Your personal and payment information is handled with care at every step.",
  },
  {
    icon: "bi-lock-fill",
    title: "Safe Shopping",
    description:
      "A protected checkout experience you can rely on from start to finish.",
  },
  {
    icon: "bi-headset",
    title: "Customer Support",
    description:
      "Our support team is ready to help with any question about your order.",
  },
];

function Checkout() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [cart, setCart] = useState(readCart);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [payment, setPayment] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const savings = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    const oldPrice = product && product.oldPrice > item.price ? product.oldPrice : null;
    return sum + (oldPrice ? (oldPrice - item.price) * item.quantity : 0);
  }, 0);

  const shipping =
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;

  const grandTotal = subtotal + shipping;

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
  const phoneRegex = /^[0-9+\s()-]{7,}$/;
  const postalRegex = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,}$/;

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = "Please enter your first name.";
    if (!form.lastName.trim()) next.lastName = "Please enter your last name.";
    if (!form.email.trim()) {
      next.email = "Please enter your email address.";
    } else if (!emailRegex.test(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.phone.trim()) {
      next.phone = "Please enter your phone number.";
    } else if (!phoneRegex.test(form.phone.trim())) {
      next.phone = "Please enter a valid phone number.";
    }
    if (!form.address.trim()) next.address = "Please enter your delivery address.";
    if (!form.city.trim()) next.city = "Please enter your city.";
    if (!form.postalCode.trim()) {
      next.postalCode = "Please enter your postal code.";
    } else if (!postalRegex.test(form.postalCode.trim())) {
      next.postalCode = "Please enter a valid postal code.";
    }
    if (!form.country.trim()) next.country = "Please select your country.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || placedOrder) return;

    const auth = getAuth();
    if (!auth?.token || !auth?.user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await api.post("/orders", {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
        shipping: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country,
        },
        payment_method: payment,
      });

      const order = res.data.data;

      try {
        localStorage.setItem("cart", JSON.stringify([]));
        window.dispatchEvent(new Event("cart-updated"));
      } catch {
        // localStorage not available
      }

      setPlacedOrder(order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const message = err?.response?.data?.message || "We couldn't place your order. Please try again.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    const orderItems = Array.isArray(placedOrder.items) ? placedOrder.items : [];
    const orderTotal =
      placedOrder.total != null ? Number(placedOrder.total) : grandTotal;
    return (
      <main className="co-main">
        <div className="container">
          <div className="co-success">
            <div className="co-success-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <span className="co-success-tag">ORDER RECEIVED</span>
            <h1>Thank You, {getAuth()?.user?.name?.split(" ")[0] || "Friend"}!</h1>
            <p>
              Your order <strong>#{placedOrder.order_number}</strong> has been
              placed with {orderItems.length}{" "}
              {orderItems.length === 1 ? "item" : "items"}. Our support team
              will contact you to confirm your delivery details.
            </p>

            <div className="co-success-box">
              <div>
                <span>Order Number</span>
                <strong>#{placedOrder.order_number}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>Cash on Delivery</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{rs(orderTotal)}</strong>
              </div>
            </div>

            <div className="co-success-buttons">
              <Link to="/orders" className="btn btn-dark btn-lg px-4">
                View My Orders
              </Link>
              <Link to="/shop" className="btn btn-outline-dark btn-lg px-4">
                Continue Shopping
              </Link>
            </div>
            <p className="co-feedback-note">
              How was your experience?{" "}
              <Link to="/feedback">Share your feedback</Link> — we read every
              submission.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <section className="co-hero">
        <div className="container">
          <nav className="co-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <Link to="/cart">Cart</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Checkout</span>
          </nav>
          <h1>Checkout</h1>
          <p>Complete your order securely.</p>
        </div>
      </section>

      <section className="co-main">
        <div className="container">
          {cart.length === 0 ? (
            <div className="co-empty">
              <div className="co-empty-icon">
                <i className="bi bi-cart-x"></i>
              </div>
              <h1>Your Cart is Empty</h1>
              <p>
                You haven't added any winter favorites yet. Browse the
                collection and come back when you're ready.
              </p>
              <Link to="/shop" className="btn btn-dark btn-lg px-5">
                Return to Shop
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          ) : (
            <>
            {!getAuth()?.token && (
              <div className="co-login-warning">
                <i className="bi bi-info-circle-fill me-2"></i>
                You must{" "}
                <Link to="/login" state={{ from: "/checkout" }}>
                  log in
                </Link>{" "}
                to place an order.
              </div>
            )}
            <form
              id="co-checkout-form"
              className="co-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="row g-4 g-lg-5">

                <div className="col-lg-7">
                  <div className="co-card">
                    <div className="co-card-head">
                      <div className="co-card-icon">
                        <i className="bi bi-person"></i>
                      </div>
                      <div>
                        <h2>Customer Information</h2>
                        <p>Tell us who we're delivering to.</p>
                      </div>
                    </div>

                    <div className="row g-3 g-lg-4">
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-first-name">
                          First Name <span>*</span>
                        </label>
                        <input
                          id="co-first-name"
                          type="text"
                          className={`co-input ${errors.firstName ? "invalid" : ""}`}
                          placeholder="Enter your first name"
                          value={form.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          required
                        />
                        {errors.firstName && (
                          <p className="co-error">{errors.firstName}</p>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-last-name">
                          Last Name <span>*</span>
                        </label>
                        <input
                          id="co-last-name"
                          type="text"
                          className={`co-input ${errors.lastName ? "invalid" : ""}`}
                          placeholder="Enter your last name"
                          value={form.lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                          required
                        />
                        {errors.lastName && (
                          <p className="co-error">{errors.lastName}</p>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-email">
                          Email <span>*</span>
                        </label>
                        <input
                          id="co-email"
                          type="email"
                          className={`co-input ${errors.email ? "invalid" : ""}`}
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          required
                        />
                        {errors.email && <p className="co-error">{errors.email}</p>}
                      </div>
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-phone">
                          Phone Number <span>*</span>
                        </label>
                        <input
                          id="co-phone"
                          type="tel"
                          className={`co-input ${errors.phone ? "invalid" : ""}`}
                          placeholder="+92 300 0000000"
                          value={form.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          required
                        />
                        {errors.phone && <p className="co-error">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="co-card">
                    <div className="co-card-head">
                      <div className="co-card-icon">
                        <i className="bi bi-geo-alt"></i>
                      </div>
                      <div>
                        <h2>Shipping Address</h2>
                        <p>Where should your order be delivered?</p>
                      </div>
                    </div>

                    <div className="row g-3 g-lg-4">
                      <div className="col-12">
                        <label className="co-label" htmlFor="co-address">
                          Address <span>*</span>
                        </label>
                        <input
                          id="co-address"
                          type="text"
                          className={`co-input ${errors.address ? "invalid" : ""}`}
                          placeholder="House, Street, Area"
                          value={form.address}
                          onChange={(e) => handleChange("address", e.target.value)}
                          required
                        />
                        {errors.address && (
                          <p className="co-error">{errors.address}</p>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-city">
                          City <span>*</span>
                        </label>
                        <input
                          id="co-city"
                          type="text"
                          className={`co-input ${errors.city ? "invalid" : ""}`}
                          placeholder="e.g. Karachi"
                          value={form.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          required
                        />
                        {errors.city && <p className="co-error">{errors.city}</p>}
                      </div>
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-state">
                          State / Province
                        </label>
                        <input
                          id="co-state"
                          type="text"
                          className="co-input"
                          placeholder="e.g. Sindh"
                          value={form.state}
                          onChange={(e) => handleChange("state", e.target.value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-postal">
                          Postal Code <span>*</span>
                        </label>
                        <input
                          id="co-postal"
                          type="text"
                          className={`co-input ${errors.postalCode ? "invalid" : ""}`}
                          placeholder="e.g. 75500"
                          value={form.postalCode}
                          onChange={(e) => handleChange("postalCode", e.target.value)}
                          required
                        />
                        {errors.postalCode && (
                          <p className="co-error">{errors.postalCode}</p>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label className="co-label" htmlFor="co-country">
                          Country <span>*</span>
                        </label>
                        <select
                          id="co-country"
                          className={`co-input ${errors.country ? "invalid" : ""}`}
                          value={form.country}
                          onChange={(e) => handleChange("country", e.target.value)}
                          required
                        >
                          <option value="Pakistan">Pakistan</option>
                          <option value="India">India</option>
                          <option value="United States">United States</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="UAE">UAE</option>
                          <option value="Canada">Canada</option>
                          <option value="Australia">Australia</option>
                        </select>
                        {errors.country && (
                          <p className="co-error">{errors.country}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="co-summary-card">
                    <h2 className="co-summary-title">
                      <i className="bi bi-receipt"></i>
                      Order Summary
                    </h2>

                    <div className="co-items">
                      {cart.map((item) => (
                        <div className="co-item" key={item.id}>
                          <div className="co-item-thumb">
                            <img src={item.image} alt={item.name} loading="lazy" />
                          </div>
                          <div className="co-item-info">
                            <p className="co-item-name">{item.name}</p>
                            <span className="co-item-qty">
                              <i className="bi bi-x-lg"></i>
                              {item.quantity}
                            </span>
                          </div>
                          <span className="co-item-price">
                            {rs(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="co-totals">
                      <div className="co-total-row">
                        <span>Subtotal</span>
                        <strong>{rs(subtotal)}</strong>
                      </div>
                      {savings > 0 && (
                        <div className="co-total-row co-savings">
                          <span>Your Savings</span>
                          <strong>- {rs(savings)}</strong>
                        </div>
                      )}
                      <div className="co-total-row">
                        <span>Shipping</span>
                        <strong>
                          {shipping === 0 ? "Free" : rs(shipping)}
                        </strong>
                      </div>
                    </div>

                    <div className="co-grand">
                      <span>Grand Total</span>
                      <strong>{rs(grandTotal)}</strong>
                    </div>

                    {shipping === 0 ? (
                      <p className="co-free-note">
                        <i className="bi bi-check-circle-fill"></i>
                        Free delivery on orders above Rs. 5,000
                      </p>
                    ) : (
                      <p className="co-ship-note">
                        <i className="bi bi-truck"></i>
                        Free delivery on orders above Rs. 5,000
                      </p>
                    )}

                    <div className="co-payment">
                      <div className="co-payment-block">
                        <span className="co-payment-title">
                          <i className="bi bi-credit-card"></i>
                          Payment Method
                        </span>

                        <label
                          className={`co-payment-option ${
                            payment === "cod" ? "selected" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment"
                            value="cod"
                            checked={payment === "cod"}
                            onChange={() => setPayment("cod")}
                          />
                          <div className="co-payment-icon">
                            <i className="bi bi-cash-coin"></i>
                          </div>
                          <div className="co-payment-text">
                            <strong>Cash on Delivery</strong>
                            <span>Pay in cash when your order arrives.</span>
                          </div>
                          <i className="bi bi-check-circle-fill co-payment-check"></i>
                        </label>

                        <p className="co-payment-note">
                          <i className="bi bi-info-circle"></i>
                          Online payments are coming soon. For now you can pay
                          comfortably with cash on delivery.
                        </p>
                      </div>
                    </div>

                    {submitError && (
                      <div className="co-error co-submit-error">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {submitError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="co-place-btn"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          Place Order
                          <i className="bi bi-arrow-right"></i>
                        </>
                      )}
                    </button>

                    <div className="co-secure-row">
                      <span>
                        <i className="bi bi-shield-lock"></i>
                        Secure Checkout
                      </span>
                      <span>
                        <i className="bi bi-lock-fill"></i>
                        Your information is safe
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </form>
            </>
          )}
        </div>
      </section>

      <section className="co-trust">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>SHOP WITH CONFIDENCE</span>
            <h2>A Secure Checkout</h2>
            <p>Your privacy and safety matter to us.</p>
          </div>

          <div className="row g-4">
            {trustItems.map((item, index) => (
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
    </main>
  );
}

export default Checkout;