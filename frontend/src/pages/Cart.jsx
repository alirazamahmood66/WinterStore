import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../services/ProductsContext";

const FREE_DELIVERY_THRESHOLD = 5000;
const STANDARD_DELIVERY_FEE = 200;

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
};

const rs = (n) => `Rs. ${n.toLocaleString()}`;

function Cart() {
  const { products } = useProducts();
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    const sync = () => setCart(readCart());
    sync();
    window.addEventListener("cart-updated", sync);
    return () => window.removeEventListener("cart-updated", sync);
  }, []);

  const persistCart = (next) => {
    setCart(next);
    try {
      localStorage.setItem("cart", JSON.stringify(next));
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      // localStorage not available
    }
  };

  const updateQuantity = (id, delta) => {
    const product = products.find((p) => p.id === id);
    const max = product && product.stock > 0 ? product.stock : 999;
    const next = cart.map((item) => {
      if (item.id !== id) return item;
      const quantity = Math.min(Math.max(item.quantity + delta, 1), max);
      return { ...item, quantity };
    });
    persistCart(next);
  };

  const removeItem = (id) => {
    persistCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discount = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    const oldPrice = product && product.oldPrice > item.price ? product.oldPrice : null;
    return sum + (oldPrice ? (oldPrice - item.price) * item.quantity : 0);
  }, 0);

  const shipping =
    subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;

  const total = subtotal + shipping;

  return (
    <main>
      <section className="ca-hero">
        <div className="container">
          <nav className="ca-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Shopping Cart</span>
          </nav>
          <h1>Shopping Cart</h1>
          <p>Review your selected winter favorites before checking out.</p>
        </div>
      </section>

      <section className="ca-main">
        <div className="container">

          {cart.length === 0 ? (
            <div className="ca-empty">
              <div className="ca-empty-icon">
                <i className="bi bi-bag-x"></i>
              </div>
              <h1>Your Cart is Empty</h1>
              <p>
                You haven't added any winter favorites yet. Browse the
                collection and add the pieces you love.
              </p>
              <Link to="/shop" className="btn btn-dark btn-lg px-5">
                Continue Shopping
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          ) : (
            <div className="row g-4 g-lg-5">

              <div className="col-lg-8">
                <div className="ca-items">
                  {cart.map((item) => {
                    const product = products.find((p) => p.id === item.id);
                    const stock = product && product.stock > 0 ? product.stock : 999;
                    const oldPrice =
                      product && product.oldPrice > item.price
                        ? product.oldPrice
                        : null;

                    return (
                      <div className="ca-item" key={item.id}>
                        <Link
                          to={`/product/${item.id}`}
                          className="ca-item-thumb"
                          aria-label={item.name}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                          />
                        </Link>

                        <div className="ca-item-info">
                          <div className="ca-item-head">
                            <div className="ca-item-titles">
                              <p className="ca-item-name">
                                <Link to={`/product/${item.id}`}>
                                  {item.name}
                                </Link>
                              </p>
                              {product?.category && (
                                <span className="ca-item-meta">
                                  {product.category}
                                </span>
                              )}
                            </div>
                            <button
                              className="ca-remove"
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>

                          <div className="ca-item-pricing">
                            <span className="ca-item-price">
                              {rs(item.price)}
                            </span>
                            {oldPrice && (
                              <span className="ca-item-old">
                                {rs(oldPrice)}
                              </span>
                            )}
                          </div>

                          <div className="ca-controls">
                            <div className="ca-qty">
                              <button
                                type="button"
                                className="ca-qty-btn"
                                onClick={() => updateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <i className="bi bi-dash-lg"></i>
                              </button>
                              <span className="ca-qty-value">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                className="ca-qty-btn"
                                onClick={() => updateQuantity(item.id, 1)}
                                disabled={item.quantity >= stock}
                                aria-label="Increase quantity"
                              >
                                <i className="bi bi-plus-lg"></i>
                              </button>
                            </div>

                            <div className="ca-item-subtotal">
                              <span>Item Total</span>
                              <strong>{rs(item.price * item.quantity)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link to="/shop" className="ca-continue-link">
                  <i className="bi bi-arrow-left"></i>
                  Continue Shopping
                </Link>
              </div>

              <div className="col-lg-4">
                <div className="ca-summary-card">
                  <h2 className="ca-summary-title">
                    <i className="bi bi-receipt"></i>
                    Order Summary
                  </h2>

                  <div className="ca-summary-rows">
                    <div className="ca-summary-row">
                      <span>Subtotal</span>
                      <strong>{rs(subtotal)}</strong>
                    </div>
                    {discount > 0 && (
                      <div className="ca-summary-row ca-discount">
                        <span>Discount</span>
                        <strong>- {rs(discount)}</strong>
                      </div>
                    )}
                    <div className="ca-summary-row">
                      <span>Shipping</span>
                      <strong>{shipping === 0 ? "Free" : rs(shipping)}</strong>
                    </div>
                  </div>

                  <div className="ca-grand">
                    <span>Total</span>
                    <strong>{rs(total)}</strong>
                  </div>

                  {shipping === 0 ? (
                    <p className="ca-free-note">
                      <i className="bi bi-check-circle-fill"></i>
                      Free delivery on orders above Rs. 5,000
                    </p>
                  ) : (
                    <p className="ca-ship-note">
                      <i className="bi bi-truck"></i>
                      Add items worth{" "}
                      {rs(FREE_DELIVERY_THRESHOLD - subtotal)} more for free
                      delivery.
                    </p>
                  )}

                  <Link
                    to="/checkout"
                    className={`ca-checkout-btn ${
                      cart.length === 0 ? "disabled" : ""
                    }`}
                    aria-disabled={cart.length === 0}
                  >
                    Proceed to Checkout
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                  <Link
                    to="/shop"
                    className="ca-outline-btn"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>

            </div>
          )}

        </div>
      </section>
    </main>
  );
}

export default Cart;