import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getAuth } from "../utils/auth";

const getUser = () => {
  const auth = getAuth();
  return auth && auth.token ? auth.user : null;
};

const rs = (n) => `Rs. ${Number(n).toLocaleString()}`;

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

const statusClass = (status) =>
  `or-badge or-badge-${(status || "pending").toLowerCase()}`;

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

const orderItemCount = (order) =>
  (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

const mapItems = (items) =>
  (items || []).map((item) => ({
    id: item.product_id,
    name: item.product_name,
    image: item.image,
    quantity: item.quantity,
  }));

function Orders() {
  const [user, setUser] = useState(getUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, []);

  useEffect(() => {
    if (!getAuth()?.token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/orders");
        if (cancelled) return;
        setOrders(
          (res.data.data || []).map((order) => ({
            ...order,
            items: mapItems(order.items),
          }))
        );
      } catch (err) {
        if (!cancelled) setError("We couldn't load your orders. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <main>
        <section className="or-hero">
          <div className="container">
            <nav className="or-breadcrumb" aria-label="breadcrumb">
              <Link to="/">Home</Link>
              <i className="bi bi-chevron-right"></i>
              <span>Orders</span>
            </nav>
            <h1>My Orders</h1>
            <p>View and manage your recent WinterStore orders.</p>
          </div>
        </section>

        <section className="or-main">
          <div className="container">
            <div className="or-auth-card">
              <div className="or-auth-icon">
                <i className="bi bi-box-seam"></i>
              </div>
              <h2>Login to View Your Orders</h2>
              <p>Please sign in to access your order history and track your purchases.</p>
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

  return (
    <main>
      <section className="or-hero">
        <div className="container">
          <nav className="or-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Orders</span>
          </nav>
          <h1>My Orders</h1>
          <p>View and manage your recent WinterStore orders.</p>
        </div>
      </section>

      <section className="or-main">
        <div className="container">

          {loading ? (
            <div className="or-loading text-center py-5">
              <div className="spinner-border text-dark" role="status"></div>
              <p className="mt-3 text-muted">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="or-error text-center py-5">
              <p>{error}</p>
              <button
                className="btn btn-dark px-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="or-empty">
              <div className="or-empty-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h2>No Orders Yet</h2>
              <p>
                Your orders will appear here after you make a purchase.
                Browse our collection and find something you love.
              </p>
              <Link to="/shop" className="btn btn-dark btn-lg px-5">
                Start Shopping
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          ) : (
            <>
              <div className="or-header">
                <div className="or-header-info">
                  <h2>
                    <i className="bi bi-box-seam"></i>
                    Order History
                  </h2>
                  <p>
                    {orders.length} {orders.length === 1 ? "order" : "orders"} placed
                  </p>
                </div>
                <Link to="/shop" className="btn btn-outline-dark btn-sm">
                  <i className="bi bi-plus-lg me-1"></i>
                  New Order
                </Link>
              </div>

              <div className="or-list">
                {orders.map((order) => (
                  <div className="or-card" key={order.id}>
                    <div className="or-card-top">
                      <div className="or-card-id">
                        <span className="or-label">Order</span>
                        <strong>#{order.order_number || order.id}</strong>
                      </div>
                      <span className={statusClass(order.status)}>
                        {order.status
                          ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                          : "Pending"}
                      </span>
                      <span className={`or-badge or-badge-${paymentStatus(order.payment_status)}`}>
                        <i className="bi bi-credit-card"></i>
                        Payment: {paymentStatusLabel(order.payment_status)}
                      </span>
                    </div>

                    <div className="or-card-meta">
                      <div className="or-meta-item">
                        <i className="bi bi-calendar3"></i>
                        <div>
                          <span className="or-meta-label">Date</span>
                          <strong>{formatDate(order.created_at)}</strong>
                        </div>
                      </div>
                      <div className="or-meta-item">
                        <i className="bi bi-bag"></i>
                        <div>
                          <span className="or-meta-label">Items</span>
                          <strong>
                            {orderItemCount(order)}{" "}
                            {orderItemCount(order) === 1 ? "item" : "items"}
                          </strong>
                        </div>
                      </div>
                      <div className="or-meta-item">
                        <i className="bi bi-credit-card"></i>
                        <div>
                          <span className="or-meta-label">Payment</span>
                          <strong>{paymentLabel(order.payment_method)}</strong>
                          <span className="or-meta-status">
                            {paymentStatusMessage(order.payment_status)}
                          </span>
                        </div>
                      </div>
                      <div className="or-meta-item">
                        <i className="bi bi-cash"></i>
                        <div>
                          <span className="or-meta-label">Total</span>
                          <strong className="or-total-amount">
                            {rs(order.total)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="or-card-items">
                      {(order.items || []).slice(0, 3).map((item) => (
                        <div className="or-item-thumb" key={item.id}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} loading="lazy" />
                          ) : (
                            <span>{item.name}</span>
                          )}
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <div className="or-item-more">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="or-card-actions">
                      <Link
                        to={`/orders/${order.id}`}
                        className="btn btn-dark btn-sm"
                      >
                        View Order
                        <i className="bi bi-arrow-right ms-1"></i>
                      </Link>
                      {(order.status || "").toLowerCase() === "delivered" && (
                        <Link
                          to={`/orders/${order.id}?review=1`}
                          className="btn btn-outline-dark btn-sm"
                        >
                          <i className="bi bi-star me-1"></i>
                          Leave a Review
                        </Link>
                      )}
                      <Link
                        to="/shop"
                        className="btn btn-outline-dark btn-sm"
                      >
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </section>
    </main>
  );
}

export default Orders;