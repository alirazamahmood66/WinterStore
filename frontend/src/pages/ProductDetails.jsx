import { useState, useEffect, useRef, useCallback } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useProducts } from "../services/ProductsContext";
import ProductCard from "../components/ProductCard";
import api from "../services/api";
import { getAuth } from "../utils/auth";

const colorHex = {
  Black: "#111827",
  Navy: "#1e3a5f",
  Olive: "#6b7f43",
  Camel: "#c19a6b",
  Grey: "#8a919c",
  Charcoal: "#3f4752",
  "Forest Green": "#2d4a3e",
  Cream: "#f3ead8",
  Burgundy: "#6e1f34",
  Sage: "#a8b49a",
  Ivory: "#f4efe6",
  "Dark Brown": "#4a3126",
  Oatmeal: "#d6c6ae",
  "Dusty Rose": "#c98a86",
  Red: "#b23b3b",
  Blue: "#2f5fbf",
  Green: "#3d7a4d",
  Tan: "#c39a6b",
  Mocha: "#6f4e37",
  "Denim Blue": "#3f5a8f",
  Blush: "#e8b4b8",
  Ink: "#27304a",
  Coyote: "#b08a5a",
  Brown: "#5b3a29",
};

function formatPrice(price) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function Stars({ value }) {
  return (
    <span className="pd-reviews-stars" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <i
          key={i}
          className={`bi ${
            i < Math.floor(value)
              ? "bi-star-fill"
              : i < value
                ? "bi-star-half"
                : "bi-star"
          }`}
        ></i>
      ))}
    </span>
  );
}

function formatReviewDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function ProductScreen({ product, wishlist, toggleWishlist, addToCart }) {
  const { products, patchProduct } = useProducts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [activeTab, setActiveTab] = useState("description");
  const [activeImage, setActiveImage] = useState(0);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ average: 0, count: 0 });
  const [myReview, setMyReview] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const loggedIn = !!getAuth()?.token;

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const res = await api.get(`/products/${product.id}/reviews`);
      const data = res.data?.data || {};
      const summary = {
        average: Number(data.average || 0),
        count: Number(data.count || 0),
      };
      setReviews(data.reviews || []);
      setReviewsSummary(summary);
      setMyReview(data.myReview || null);
      return summary;
    } catch {
      setReviewsError(
        "We couldn't load reviews right now. Please try again later."
      );
      return null;
    } finally {
      setReviewsLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (searchParams.get("review") === "1") {
      setActiveTab("reviews");
      const t = window.setTimeout(() => {
        const el = document.getElementById("pd-reviews");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => window.clearTimeout(t);
    }
  }, [searchParams]);

  const validateReview = () => {
    const next = {};
    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      next.rating = "Please select a star rating.";
    }
    if (!reviewForm.comment.trim()) {
      next.comment = "Please write a short review.";
    } else if (reviewForm.comment.trim().length > 2000) {
      next.comment = "Reviews must be 2000 characters or fewer.";
    }
    return next;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewSubmitting) return;
    setReviewSubmitted(false);
    setReviewErrors({});
    const next = validateReview();
    if (Object.keys(next).length > 0) {
      setReviewErrors(next);
      return;
    }
    setReviewSubmitting(true);
    try {
      await api.post("/reviews", {
        product_id: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      setReviewForm({ rating: 0, comment: "" });
      setReviewSubmitted(true);
      const summary = await loadReviews();
      if (summary) {
        patchProduct(product.id, {
          rating: summary.average,
          reviews: summary.count,
        });
      }
    } catch (err) {
      setReviewErrors({
        form:
          err?.response?.data?.message ||
          "We couldn't submit your review right now. Please try again.",
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const flashToast = (productName) => {
    setToast(productName);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const images = product.images?.length
    ? product.images
    : [product.image].filter(Boolean);
  const activeIdx = images.length ? Math.min(activeImage, images.length - 1) : 0;

  const inStock = product.stock > 0;
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const isWished = !!wishlist[product.id];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    flashToast(product.name);
  };

  const handleRelatedAddToCart = (p) => {
    addToCart(p, 1);
    flashToast(p.name);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate("/checkout");
  };

  const related = [
    ...products.filter(
      (p) => p.id !== product.id && p.category === product.category
    ),
    ...products.filter(
      (p) =>
        p.id !== product.id &&
        p.category !== product.category &&
        p.gender === product.gender
    ),
    ...products.filter(
      (p) =>
        p.id !== product.id &&
        p.category !== product.category &&
        p.gender !== product.gender
    ),
  ].slice(0, 4);

  const detailRows = [
    { label: "Category", value: product.category },
    { label: "Gender", value: product.gender },
    product.material && { label: "Material", value: product.material },
    {
      label: "Rating",
      value: `${product.rating} / 5 (${product.reviews} reviews)`,
    },
    {
      label: "Availability",
      value: inStock ? `${product.stock} in stock` : "Out of Stock",
    },
    product.sizes?.length && {
      label: "Sizes",
      value: product.sizes.join(", "),
    },
    product.colors?.length && {
      label: "Colors",
      value: product.colors.join(", "),
    },
  ].filter(Boolean);

  return (
    <main>
      <section className="pd-page">
        <div className="container">
          <nav className="pd-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <Link to="/shop">Shop</Link>
            <i className="bi bi-chevron-right"></i>
            <span>{product.name}</span>
          </nav>

          <div className="pd-card">
            <div className="row g-4 g-lg-5">
              <div className="col-md-6">
                <div className="pd-gallery">
                  <div className="pd-main-image-wrap">
                    {product.badge && (
                      <span className="pd-badge">{product.badge}</span>
                    )}
                    {discount > 0 && (
                      <span className="pd-discount-badge">-{discount}%</span>
                    )}
                    <img
                      src={images[activeIdx]}
                      alt={product.alt}
                      className="pd-main-image"
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="pd-thumbnails">
                      {images.map((src, i) => (
                        <button
                          key={i}
                          className={`pd-thumb ${activeImage === i ? "active" : ""}`}
                          onClick={() => setActiveImage(i)}
                          aria-label={`View image ${i + 1}`}
                        >
                          <img src={src} alt={product.alt} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="pd-info">
                  <span className="pd-eyebrow">
                    {product.gender} · {product.category}
                  </span>
                  <h1 className="pd-title">{product.name}</h1>

                  <div className="pd-rating">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`bi ${
                          i < Math.floor(product.rating)
                            ? "bi-star-fill"
                            : i < product.rating
                              ? "bi-star-half"
                              : "bi-star"
                        }`}
                      ></i>
                    ))}
                    <span>{product.rating}</span>
                    {product.reviews && (
                      <span>({product.reviews} reviews)</span>
                    )}
                  </div>

                  <div className="pd-price">
                    <strong>{formatPrice(product.price)}</strong>
                    {product.oldPrice && (
                      <del>{formatPrice(product.oldPrice)}</del>
                    )}
                    {discount > 0 && (
                      <span className="pd-save-label">
                        Save {formatPrice(product.oldPrice - product.price)}
                      </span>
                    )}
                  </div>

                  <div className="pd-stock">
                    <span className={`pd-stock-dot ${inStock ? "in" : "out"}`}></span>
                    <span>{inStock ? "In Stock" : "Out of Stock"}</span>
                    {inStock && (
                      <span className="pd-stock-count">
                        {product.stock} available
                      </span>
                    )}
                  </div>

                  <p className="pd-description">{product.description}</p>

                  {product.sizes?.length > 0 && (
                    <div className="pd-option-group">
                      <span className="pd-option-label">Size</span>
                      <div className="pd-option-list">
                        {product.sizes.map((s) => (
                          <button
                            key={s}
                            className={`pd-size-btn ${selectedSize === s ? "active" : ""}`}
                            onClick={() => setSelectedSize(s)}
                            aria-pressed={selectedSize === s}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.colors?.length > 0 && (
                    <div className="pd-option-group">
                      <span className="pd-option-label">Color</span>
                      <div className="pd-option-list pd-color-list">
                        {product.colors.map((c) => (
                          <button
                            key={c}
                            className={`pd-color-btn ${selectedColor === c ? "active" : ""}`}
                            onClick={() => setSelectedColor(c)}
                            aria-pressed={selectedColor === c}
                            aria-label={`Color: ${c}`}
                            title={c}
                          >
                            <span
                              className="pd-color-swatch"
                              style={{ background: colorHex[c] || "#94a3b8" }}
                            ></span>
                          </button>
                        ))}
                      </div>
                      <span className="pd-color-name">{selectedColor}</span>
                    </div>
                  )}

                  <div className="pd-qty-row">
                    <div className="pd-qty">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || !inStock}
                        aria-label="Decrease quantity"
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <span>{quantity}</span>
                      <button
                        onClick={() =>
                          setQuantity((q) => Math.min(product.stock, q + 1))
                        }
                        disabled={quantity >= product.stock || !inStock}
                        aria-label="Increase quantity"
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                  </div>

                  <div className="pd-actions">
                    <button
                      className="pd-add-btn"
                      onClick={handleAddToCart}
                      disabled={!inStock}
                    >
                      <i className="bi bi-bag-plus me-2"></i>
                      Add to Cart
                    </button>
                    <button
                      className="pd-buy-btn"
                      onClick={handleBuyNow}
                      disabled={!inStock}
                    >
                      <i className="bi bi-bag-check me-2"></i>
                      Buy Now
                    </button>
                    <button
                      className={`pd-wish-btn ${isWished ? "active" : ""}`}
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Toggle wishlist"
                      aria-pressed={isWished}
                    >
                      <i
                        className={`bi ${isWished ? "bi-heart-fill" : "bi-heart"}`}
                      ></i>
                    </button>
                  </div>

                  <div className="pd-meta-row">
                    <span>
                      <i className="bi bi-truck"></i>
                      Free delivery over Rs. 5,000
                    </span>
                    <span>
                      <i className="bi bi-arrow-repeat"></i>
                      14-day returns
                    </span>
                    <span>
                      <i className="bi bi-shield-check"></i>
                      Secure checkout
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pd-tabs">
            <div className="pd-tab-nav" role="tablist">
              <button
                className={activeTab === "description" ? "active" : ""}
                onClick={() => setActiveTab("description")}
                role="tab"
                aria-selected={activeTab === "description"}
              >
                Description
              </button>
              <button
                className={activeTab === "details" ? "active" : ""}
                onClick={() => setActiveTab("details")}
                role="tab"
                aria-selected={activeTab === "details"}
              >
                Product Details
              </button>
              <button
                className={activeTab === "shipping" ? "active" : ""}
                onClick={() => setActiveTab("shipping")}
                role="tab"
                aria-selected={activeTab === "shipping"}
              >
                Shipping &amp; Returns
              </button>
              <button
                className={activeTab === "reviews" ? "active" : ""}
                onClick={() => setActiveTab("reviews")}
                role="tab"
                aria-selected={activeTab === "reviews"}
              >
                Reviews
                {reviewsSummary.count > 0 ? ` (${reviewsSummary.count})` : ""}
              </button>
            </div>

            <div className="pd-tab-panel">
              {activeTab === "description" && (
                <p className="pd-tab-description">{product.description}</p>
              )}

              {activeTab === "details" && (
                <div className="pd-details-table">
                  {detailRows.map((row) => (
                    <div className="pd-details-row" key={row.label}>
                      <span className="pd-details-label">{row.label}</span>
                      <span className="pd-details-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "shipping" && (
                <div className="pd-shipping-content">
                  <div>
                    <h5>Delivery</h5>
                    <p>
                      Orders are dispatched within 24 hours. Delivery across
                      Pakistan takes 2 to 5 working days, and is free on all
                      orders above Rs. 5,000.
                    </p>
                  </div>
                  <div>
                    <h5>Returns &amp; Exchanges</h5>
                    <p>
                      Not quite right? Return unused items in their original
                      packaging within 14 days of delivery for a refund or
                      exchange. Simple and convenient.
                    </p>
                  </div>
                  <div>
                    <h5>Secure Payment</h5>
                    <p>
                      Checkout is safe and secure. Your payment details are
                      protected at every step of the order process.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="pd-reviews" id="pd-reviews">
                  <div className="pd-reviews-summary">
                    <span className="pd-reviews-score">
                      {reviewsSummary.count > 0
                        ? reviewsSummary.average.toFixed(1)
                        : "—"}
                    </span>
                    <Stars value={reviewsSummary.average} />
                    <span className="pd-reviews-count">
                      {reviewsSummary.count}{" "}
                      {reviewsSummary.count === 1 ? "review" : "reviews"}
                    </span>
                  </div>

                  <div className="pd-reviews-feed">
                    <div className="pd-reviews-heading">
                      <h4>Customer Reviews</h4>
                      {!loggedIn && (
                        <Link
                          to="/login"
                          state={{ from: `/product/${product.id}?review=1` }}
                          className="pd-review-login-link"
                        >
                          Log in to write a review
                        </Link>
                      )}
                    </div>

                    {reviewsLoading && (
                      <div className="pd-reviews-loading">
                        <div
                          className="spinner-border spinner-border-sm text-dark me-2"
                          role="status"
                        ></div>
                        Loading reviews...
                      </div>
                    )}

                    {!reviewsLoading && reviewsError && (
                      <p className="pd-reviews-error">{reviewsError}</p>
                    )}

                    {!reviewsLoading && !reviewsError && reviews.length === 0 && (
                      <div className="pd-reviews-empty">
                        <i className="bi bi-chat-square-text"></i>
                        <p className="mt-2 mb-0">
                          No reviews yet. Be the first to share your thoughts on
                          this product.
                        </p>
                      </div>
                    )}

                    {!reviewsLoading && reviews.length > 0 && (
                      <div className="pd-reviews-list">
                        {reviews.map((r) => (
                          <article className="pd-review-card" key={r.id}>
                            <div className="pd-review-head">
                              <strong>{r.userName}</strong>
                              <span className="pd-review-date">
                                {formatReviewDate(r.createdAt)}
                              </span>
                            </div>
                            <Stars value={r.rating} />
                            <p>{r.comment}</p>
                          </article>
                        ))}
                      </div>
                    )}

                    {loggedIn &&
                      (myReview ? (
                        <div className="pd-review-success" role="status">
                          <i className="bi bi-check-circle-fill"></i>
                          You've reviewed this product. Thank you for your
                          review!
                        </div>
                      ) : (
                        <form
                          className="pd-review-form"
                          onSubmit={handleReviewSubmit}
                          noValidate
                        >
                          <h5>Write a Review</h5>
                          <p className="pd-review-form-sub">
                            How would you rate this product?
                          </p>

                          {reviewErrors.form && (
                            <div
                              className="pd-review-form-error"
                              role="alert"
                            >
                              <i className="bi bi-exclamation-circle-fill"></i>
                              {reviewErrors.form}
                            </div>
                          )}

                          <div
                            className="pd-review-sstars"
                            role="radiogroup"
                            aria-label="Star rating"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                type="button"
                                key={n}
                                className={`pd-review-sstar ${
                                  reviewForm.rating >= n ? "filled" : ""
                                }`}
                                onClick={() =>
                                  setReviewForm((f) => ({
                                    ...f,
                                    rating: n,
                                  }))
                                }
                                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                              >
                                <i className="bi bi-star-fill"></i>
                              </button>
                            ))}
                            <span className="pd-review-slabel">
                              {reviewForm.rating
                                ? `${reviewForm.rating} / 5`
                                : "Select a rating"}
                            </span>
                          </div>
                          {reviewErrors.rating && (
                            <p className="pd-review-field-error">
                              {reviewErrors.rating}
                            </p>
                          )}

                          <textarea
                            className="pd-review-textarea"
                            placeholder="Share what you liked or disliked about this product..."
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm((f) => ({
                                ...f,
                                comment: e.target.value,
                              }))
                            }
                            maxLength={2000}
                          ></textarea>
                          {reviewErrors.comment && (
                            <p className="pd-review-field-error">
                              {reviewErrors.comment}
                            </p>
                          )}

                          <button
                            type="submit"
                            className="pd-review-submit"
                            disabled={reviewSubmitting}
                          >
                            {reviewSubmitting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                ></span>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-send me-1"></i>
                                Submit Review
                              </>
                            )}
                          </button>

                          {reviewSubmitted && (
                            <div className="pd-review-success" role="status">
                              <i className="bi bi-check-circle-fill"></i>
                              Review submitted successfully!
                            </div>
                          )}
                        </form>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="pd-related-section">
          <div className="container">
            <div className="section-heading text-center mb-5">
              <span>YOU MAY ALSO LIKE</span>
              <h2>You May Also Like</h2>
            </div>
            <div className="shop-product-grid grid-cols-4">
              {related.map((p) => (
                <div className="shop-grid-item" key={p.id}>
                  <ProductCard
                    product={p}
                    wishlist={wishlist}
                    toggleWishlist={toggleWishlist}
                    onAddToCart={handleRelatedAddToCart}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {toast && (
        <div className="pd-toast" role="status">
          <div className="pd-toast-icon">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <div className="pd-toast-body">
            <strong>Added to Cart</strong>
            <span>{toast}</span>
          </div>
          <Link to="/cart" className="pd-toast-link">
            View Cart
          </Link>
          <button
            className="pd-toast-close"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}
    </main>
  );
}

function ProductDetails() {
  const { id } = useParams();
  const { products, loading } = useProducts();
  const product = products.find((p) => p.id === Number(id));

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const toggleWishlist = (pid) => {
    setWishlist((prev) => {
      const next = { ...prev };
      if (next[pid]) {
        delete next[pid];
      } else {
        next[pid] = true;
      }
      return next;
    });
  };

  const addToCart = (p, qty) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existing = cart.find((item) => item.id === p.id);
      if (existing) {
        existing.quantity += qty;
      } else {
        cart.push({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          quantity: qty,
        });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      // localStorage not available
    }
  };

  if (loading) {
    return (
      <main>
        <section className="pd-page">
          <div className="container text-center py-5">
            <div className="spinner-border text-dark" role="status"></div>
            <p className="mt-3 text-muted">Loading product...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <section className="pd-notfound">
          <div className="container">
            <div className="pd-notfound-card">
              <div className="pd-notfound-icon">
                <i className="bi bi-bag-x"></i>
              </div>
              <h1>Product Not Found</h1>
              <p>
                The product you are looking for does not exist or may have been
                removed from the collection.
              </p>
              <Link to="/shop" className="pd-back-btn">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Shop
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <ProductScreen
      key={product.id}
      product={product}
      wishlist={wishlist}
      toggleWishlist={toggleWishlist}
      addToCart={addToCart}
    />
  );
}

export default ProductDetails;