import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getAuth } from "../utils/auth";

const getUser = () => {
  const auth = getAuth();
  return auth && auth.token ? auth.user : null;
};

const rs = (n) => `Rs. ${Number(n).toLocaleString()}`;

const formatDateTime = (iso) => {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " at " +
      d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "—";
  }
};

const statusClass = (status) =>
  `od-badge od-badge-${(status || "pending").toLowerCase()}`;

const paymentLabel = (method) => {
  if (method === "cod" || method === "cash-on-delivery") return "Cash on Delivery";
  return "Online Payment";
};

const paymentStatus = (status) => (status || "pending").toLowerCase();

const paymentStatusLabel = (status) =>
  paymentStatus(status).charAt(0).toUpperCase() + paymentStatus(status).slice(1);

const PAY_MESSAGES = {
  pending: "Your payment is still pending.",
  paid: "Payment completed successfully.",
  failed: "Your payment could not be completed.",
  refunded: "Your payment has been refunded.",
};

const paymentStatusMessage = (status) => PAY_MESSAGES[paymentStatus(status)] || "";

const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

const parseAddress = (raw) => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const mapItems = (items) =>
  (items || []).map((item) => ({
    id: item.product_id,
    name: item.name || item.product_name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
  }));

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(getUser);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setUser(getUser());
  }, []);

  useEffect(() => {
    const handle = () => refresh();
    window.addEventListener("auth-updated", handle);
    window.addEventListener("storage", handle);
    return () => {
      window.removeEventListener("auth-updated", handle);
      window.removeEventListener("storage", handle);
    };
  }, [refresh]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (searchParams.get("review") === "1") {
      const t = window.setTimeout(() => {
        const el = document.getElementById("od-review-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      return () => window.clearTimeout(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!getAuth()?.token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      setFound(true);
      try {
        const res = await api.get(`/orders/${id}`);
        if (cancelled) return;
        setOrder({ ...res.data.data, items: mapItems(res.data.data.items) });
      } catch (err) {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          setFound(false);
          setOrder(null);
        } else {
          setError("We couldn't load this order. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (!user) {
    return (
      <main>
        <section className="or-hero">
          <div className="container">
            <nav className="or-breadcrumb" aria-label="breadcrumb">
              <Link to="/">Home</Link>
              <i className="bi bi-chevron-right"></i>
              <Link to="/orders">Orders</Link>
              <i className="bi bi-chevron-right"></i>
              <span>Order Details</span>
            </nav>
            <h1>Order Details</h1>
            <p>View the full details of your WinterStore order.</p>
          </div>
        </section>

        <section className="or-main">
          <div className="container">
            <div className="or-auth-card">
              <div className="or-auth-icon">
                <i className="bi bi-lock"></i>
              </div>
              <h2>Please Sign In</h2>
              <p>You need to be logged in to view order details.</p>
              <div className="or-auth-buttons">
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

  if (loading) {
    return (
      <main>
        <section className="or-hero">
          <div className="container">
            <nav className="or-breadcrumb" aria-label="breadcrumb">
              <Link to="/">Home</Link>
              <i className="bi bi-chevron-right"></i>
              <Link to="/orders">Orders</Link>
              <i className="bi bi-chevron-right"></i>
              <span>Order Details</span>
            </nav>
            <h1>Order Details</h1>
            <p>View the full details of your WinterStore order.</p>
          </div>
        </section>
        <section className="or-main">
          <div className="container text-center py-5">
            <div className="spinner-border text-dark" role="status"></div>
            <p className="mt-3 text-muted">Loading order...</p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <section className="or-hero">
          <div className="container">
            <nav className="or-breadcrumb" aria-label="breadcrumb">
              <Link to="/">Home</Link>
              <i className="bi bi-chevron-right"></i>
              <Link to="/orders">Orders</Link>
              <i className="bi bi-chevron-right"></i>
              <span>Order Details</span>
            </nav>
            <h1>Order Details</h1>
            <p>View the full details of your WinterStore order.</p>
          </div>
        </section>
        <section className="or-main">
          <div className="container text-center py-5">
            <p>{error}</p>
            <button className="btn btn-dark px-4" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!found || !order) {
    return (
      <main>
        <section className="or-hero">
          <div className="container">
            <nav className="or-breadcrumb" aria-label="breadcrumb">
              <Link to="/">Home</Link>
              <i className="bi bi-chevron-right"></i>
              <Link to="/orders">Orders</Link>
              <i className="bi bi-chevron-right"></i>
              <span>Order Not Found</span>
            </nav>
            <h1>Order Not Found</h1>
            <p>The order you're looking for doesn't exist or has been removed.</p>
          </div>
        </section>

        <section className="or-main">
          <div className="container">
            <div className="od-notfound">
              <div className="od-notfound-icon">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h2>Order #{id} Not Found</h2>
              <p>
                This order may have been removed or the order ID is incorrect.
                Please check your order history for the correct ID.
              </p>
              <div className="od-notfound-actions">
                <Link to="/orders" className="btn btn-dark px-4">
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Orders
                </Link>
                <Link to="/shop" className="btn btn-outline-dark px-4">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const currentStatus = order.status || "pending";
  const isCancelled = currentStatus.toLowerCase() === "cancelled";
  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.toLowerCase() === currentStatus.toLowerCase()
  );

  const subtotal = Number(order.subtotal) || 0;
  const shipping = Number(order.shipping_fee) || 0;
  const savings =
    Number(order.discount) > 0
      ? Number(order.discount)
      : ((order.items || []).reduce(
          (sum, item) => sum + Number(item.price) * Number(item.quantity),
          0
        ) || 0) - subtotal;
  const grandTotal = Number(order.total) || 0;

  const address = parseAddress(order.shipping_address);
  const fullAddress = {
    name: address.fullName || order.customer?.name || "Customer",
    email: address.email || order.customer?.email || "",
    phone: address.phone || order.customer?.phone || "",
    address: address.address || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postalCode || "",
    country: address.country || "",
  };

  return (
    <main>
      <section className="or-hero">
        <div className="container">
          <nav className="or-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <Link to="/orders">Orders</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Order Details</span>
          </nav>
          <h1>Order Details</h1>
          <p>View the full details of your WinterStore order.</p>
        </div>
      </section>

      <section className="or-main">
        <div className="container">

          <div className="od-top-bar">
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={() => navigate("/orders")}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Back to Orders
            </button>
            <div className="od-top-meta">
              <span className={statusClass(currentStatus)}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </span>
              <span className={`od-badge od-badge-${paymentStatus(order.payment_status)}`}>
                <i className="bi bi-credit-card"></i>
                Payment: {paymentStatusLabel(order.payment_status)}
              </span>
            </div>
          </div>

          <div className="od-header">
            <div className="od-header-left">
              <h2>
                Order <strong>#{order.order_number || order.id}</strong>
              </h2>
              <p>
                Placed on {formatDateTime(order.created_at)}
              </p>
            </div>
            <div className="od-header-right">
              <div className="od-header-stat">
                <span>Payment</span>
                <strong>{paymentLabel(order.payment_method)}</strong>
                <span className={`od-badge od-badge-${paymentStatus(order.payment_status)}`}>
                  <i className="bi bi-credit-card"></i>
                  {paymentStatusLabel(order.payment_status)}
                </span>
                <small className="od-pay-message">{paymentStatusMessage(order.payment_status)}</small>
              </div>
              <div className="od-header-stat">
                <span>Total</span>
                <strong className="od-grand-total">{rs(grandTotal)}</strong>
              </div>
            </div>
          </div>

          {!isCancelled && currentStepIndex !== -1 && (
            <div className="od-status-tracker">
              <div className="od-tracker-track">
                {STATUS_STEPS.map((step, i) => {
                  const isReached = currentStepIndex >= i;
                  const isCurrent = currentStepIndex === i;
                  return (
                    <div
                      className={`od-tracker-step ${isReached ? "reached" : ""} ${isCurrent ? "current" : ""}`}
                      key={step}
                    >
                      <div className="od-tracker-dot">
                        {isReached ? (
                          <i className="bi bi-check-lg"></i>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      <span className="od-tracker-label">{step}</span>
                    </div>
                  );
                })}
                <div
                  className="od-tracker-line"
                  style={{
                    width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="od-cancelled-banner">
              <div className="od-cancelled-icon">
                <i className="bi bi-x-circle"></i>
              </div>
              <div>
                <strong>Order Cancelled</strong>
                <p>This order has been cancelled and will not be processed.</p>
              </div>
            </div>
          )}

          {currentStatus.toLowerCase() === "delivered" &&
            (order.items || []).some((item) => item.id) && (
              <div className="od-review-panel" id="od-review-panel">
                <div className="od-review-panel-head">
                  <div className="od-review-panel-icon">
                    <i className="bi bi-star"></i>
                  </div>
                  <div>
                    <h2>Loved what you bought?</h2>
                    <p>
                      Rate the products you received and help other shoppers
                      decide.
                    </p>
                  </div>
                </div>
                <div className="od-review-items">
                  {(order.items || [])
                    .filter((item) => item.id)
                    .map((item) => (
                      <div className="od-review-item" key={item.id}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                          />
                        ) : (
                          <span className="od-review-item-thumb">
                            <i className="bi bi-box-seam"></i>
                          </span>
                        )}
                        <div className="od-review-item-info">
                          <strong>{item.name}</strong>
                          <Link
                            to={`/product/${item.id}?review=1`}
                            className="od-review-btn"
                          >
                            <i className="bi bi-star me-1"></i>
                            Write a Review
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="od-card">
                <div className="od-card-head">
                  <div className="od-card-icon">
                    <i className="bi bi-bag-check"></i>
                  </div>
                  <div>
                    <h2>Order Items</h2>
                    <p>
                      {(order.items || []).length}{" "}
                      {(order.items || []).length === 1 ? "product" : "products"} in this
                      order
                    </p>
                  </div>
                </div>

                <div className="od-items">
                  {(order.items || []).map((item) => (
                    <div className="od-item" key={item.id}>
                      <div className="od-item-thumb">
                        {item.image ? (
                          <img src={item.image} alt={item.name} loading="lazy" />
                        ) : (
                          <span>{item.name}</span>
                        )}
                      </div>
                      <div className="od-item-info">
                        <Link
                          to={`/product/${item.id}`}
                          className="od-item-name"
                        >
                          {item.name}
                        </Link>
                        <div className="od-item-meta">
                          <span>
                            <i className="bi bi-x-lg"></i>
                            {item.quantity}
                          </span>
                          <span className="od-item-unit">
                            {rs(item.price)} each
                          </span>
                        </div>
                      </div>
                      <div className="od-item-price">
                        {rs(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="od-card">
                <div className="od-card-head">
                  <div className="od-card-icon">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                  <div>
                    <h2>Shipping Address</h2>
                    <p>Delivery details for this order.</p>
                  </div>
                </div>

                <div className="od-address">
                  <div className="od-address-name">
                    {fullAddress.name}
                  </div>
                  <p>{fullAddress.address}</p>
                  <p>
                    {fullAddress.city}
                    {fullAddress.state ? `, ${fullAddress.state}` : ""}{" "}
                    {fullAddress.postalCode}
                  </p>
                  <p>{fullAddress.country}</p>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="od-card od-summary-card">
                <div className="od-card-head">
                  <div className="od-card-icon">
                    <i className="bi bi-receipt"></i>
                  </div>
                  <div>
                    <h2>Order Summary</h2>
                    <p>Cost breakdown for this order.</p>
                  </div>
                </div>

                <div className="od-summary-rows">
                  <div className="od-summary-row">
                    <span>Subtotal</span>
                    <strong>{rs(subtotal)}</strong>
                  </div>
                  {savings > 0 && (
                    <div className="od-summary-row od-savings">
                      <span>Your Savings</span>
                      <strong>- {rs(savings)}</strong>
                    </div>
                  )}
                  <div className="od-summary-row">
                    <span>Shipping</span>
                    <strong>{shipping === 0 ? "Free" : rs(shipping)}</strong>
                  </div>
                </div>

                <div className="od-grand">
                  <span>Grand Total</span>
                  <strong>{rs(grandTotal)}</strong>
                </div>
              </div>

              <div className="od-card">
                <div className="od-card-head">
                  <div className="od-card-icon">
                    <i className="bi bi-person"></i>
                  </div>
                  <div>
                    <h2>Customer Info</h2>
                    <p>Contact details for this order.</p>
                  </div>
                </div>

                <div className="od-contact-rows">
                  <div className="od-contact-row">
                    <span className="od-contact-label">Name</span>
                    <strong>
                      {fullAddress.name}
                    </strong>
                  </div>
                  <div className="od-contact-row">
                    <span className="od-contact-label">Email</span>
                    <strong>{fullAddress.email}</strong>
                  </div>
                  <div className="od-contact-row">
                    <span className="od-contact-label">Phone</span>
                    <strong>{fullAddress.phone}</strong>
                  </div>
                </div>
              </div>

              <div className="od-actions-card">
                <Link to="/shop" className="btn btn-dark w-100 mb-2">
                  Continue Shopping
                  <i className="bi bi-arrow-right ms-1"></i>
                </Link>
                <Link to="/orders" className="btn btn-outline-dark w-100">
                  View All Orders
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}

export default OrderDetails;