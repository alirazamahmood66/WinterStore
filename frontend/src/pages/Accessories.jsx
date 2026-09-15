import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProducts } from "../services/ProductsContext";
import ProductCard from "../components/ProductCard";

const accessoryTypes = [
  "Bags",
  "Watches",
  "Sunglasses",
  "Belts",
  "Wallets",
  "Jewelry",
];

const typeFilters = [
  "All",
  "Scarves",
  "Gloves",
  "Caps & Beanies",
  "Winter Socks",
  ...accessoryTypes,
];

const matchType = (p, t) => {
  if (t === "All") return true;
  if (t === "Scarves") return /scarf/i.test(p.name);
  if (t === "Gloves") return /glove/i.test(p.name);
  if (t === "Caps & Beanies") return /beanie/i.test(p.name);
  if (t === "Winter Socks") return /sock/i.test(p.name);
  return p.category === t;
};

const categories = [
  {
    title: "Bags",
    description: "Everyday & weekend",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&h=650&fit=crop&q=80",
    alt: "Bags and handbags collection",
  },
  {
    title: "Watches",
    description: "Timepieces that last",
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=650&fit=crop&q=80",
    alt: "Watches collection",
  },
  {
    title: "Sunglasses",
    description: "Shades for every day",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&h=650&fit=crop&q=80",
    alt: "Sunglasses collection",
  },
  {
    title: "Belts",
    description: "Sleek finishing touches",
    image:
      "https://images.unsplash.com/photo-1548142813-c348350df52b?w=500&h=650&fit=crop&q=80",
    alt: "Belts collection",
  },
  {
    title: "Wallets",
    description: "Slim & organized",
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&h=650&fit=crop&q=80",
    alt: "Wallets collection",
  },
  {
    title: "Jewelry",
    description: "Delicate statements",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=650&fit=crop&q=80",
    alt: "Jewelry collection",
  },
];

const styles = [
  {
    title: "Everyday Essentials",
    description:
      "Simple accessories designed for everyday wear.",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=700&fit=crop&q=80",
    alt: "Everyday essential leather accessories",
  },
  {
    title: "Statement Pieces",
    description:
      "Bold details that make your style stand out.",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=700&fit=crop&q=80",
    alt: "Statement jewelry pieces",
  },
  {
    title: "Timeless Classics",
    description:
      "Timeless pieces you'll keep reaching for.",
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=700&fit=crop&q=80",
    alt: "Timeless classic watch",
  },
];

function Accessories() {
  const { products, loading } = useProducts();

  const accessoriesProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.category === "Accessories" ||
          p.category === "Winter Accessories" ||
          accessoryTypes.includes(p.category)
      ),
    [products]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const urlType = searchParams.get("type");
  const type = urlType && typeFilters.includes(urlType) ? urlType : "All";
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || {};
    } catch {
      return {};
    }
  });
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  };

  const handleAddToCart = (product) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cart-updated"));
    } catch {
      // localStorage not available
    }
  };

  const selectType = (t) => {
    if (t === "All") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ type: t }, { replace: true });
    }
    const el = document.getElementById("accessories-products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToProducts = () => {
    const el = document.getElementById("accessories-products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const featuredProducts = useMemo(() => {
    return accessoriesProducts.filter((p) => matchType(p, type));
  }, [type, accessoriesProducts]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmailError("");
    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setSubscribed(true);
    setEmail("");
  };

  return (
    <main>

      <section className="acc-hero">
        <div className="container">
          <nav className="acc-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Accessories</span>
          </nav>
          <div className="row align-items-center g-5">
            <div className="col-lg-6 acc-hero-content">
              <div className="acc-hero-eyebrow">
                <span className="acc-hero-badge">
                  <i className="bi bi-gem"></i>
                  New Season 2026
                </span>
                <span className="acc-hero-tag">ACCESSORIES EDIT</span>
              </div>
              <h1>
                Complete Your Look
                <br />
                <span>With The Right Details</span>
              </h1>
              <p>
                Discover carefully selected accessories designed to add the
                perfect finishing touch to every outfit.
              </p>
              <div className="acc-hero-buttons">
                <Link
                  to="#accessories-products"
                  className="btn btn-light btn-lg px-4"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToProducts();
                  }}
                >
                  Shop Accessories
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link to="/shop" className="btn btn-outline-light btn-lg px-4">
                  Explore New Arrivals
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="acc-hero-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&h=820&fit=crop&q=80"
                  alt="Premium leather handbag completing a fashion look"
                  className="acc-hero-image"
                />
                <div className="acc-hero-floating">
                  <div className="acc-hero-floating-icon">
                    <i className="bi bi-gem"></i>
                  </div>
                  <div>
                    <strong>Curated Accessories</strong>
                    <span>Selected for your style</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="accessories-categories" className="categories-section py-5">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>SHOP ACCESSORIES</span>
            <h2>Accessories By Category</h2>
            <p>Find the details that finish every outfit.</p>
          </div>

          <div className="row g-4">
            {categories.map((cat, index) => (
              <div className="col-6 col-md-4 col-lg-2" key={index}>
                <button
                  className="acc-category-card"
                  onClick={() => selectType(cat.title)}
                  aria-label={`Shop ${cat.title}`}
                >
                  <img src={cat.image} alt={cat.alt} loading="lazy" />
                  <div className="acc-category-overlay"></div>
                  <div className="acc-category-content">
                    <span>{cat.description}</span>
                    <h3>{cat.title}</h3>
                    <i className="bi bi-arrow-right"></i>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="accessories-products" className="shop-main-section">
        <div className="container">
          <div className="section-heading text-center mb-4">
            <span>FEATURED ACCESSORIES</span>
            <h2>Featured Accessories</h2>
            <p>Small details. Big impact.</p>
          </div>

          <div className="acc-chip-btns">
            {typeFilters.map((t) => (
              <button
                key={t}
                className={`acc-chip ${type === t ? "active" : ""}`}
                onClick={() => selectType(t)}
              >
                {t === "All" ? "All Accessories" : t}
              </button>
            ))}
          </div>

          <div className="shop-results-bar mb-3">
            <p className="shop-results-count">
              Showing <strong>{featuredProducts.length}</strong> of{" "}
              <strong>{accessoriesProducts.length}</strong> accessories
            </p>
          </div>

          {loading ? (
            <div className="shop-loading-state text-center py-5">
              <div className="spinner-border text-dark" role="status"></div>
              <p className="mt-3 text-muted">Loading accessories...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="shop-product-grid grid-cols-4">
              {featuredProducts.map((product) => (
                <div className="shop-grid-item" key={product.id}>
                  <ProductCard
                    product={product}
                    wishlist={wishlist}
                    toggleWishlist={toggleWishlist}
                    onAddToCart={handleAddToCart}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="shop-empty-state">
              <div className="shop-empty-icon">
                <i className="bi bi-search"></i>
              </div>
              <h3>No accessories found</h3>
              <p>
                Try another category to see what's available.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="accessories-styles" className="acc-styles-section py-5">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>SHOP BY STYLE</span>
            <h2>Find Your Signature Accessory</h2>
            <p>Three ways to wear it your way.</p>
          </div>

          <div className="row g-4">
            {styles.map((style, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <Link to="/shop" className="acc-style-card">
                  <img src={style.image} alt={style.alt} loading="lazy" />
                  <div className="acc-style-overlay"></div>
                  <div className="acc-style-content">
                    <span>SHOP BY STYLE</span>
                    <h3>{style.title}</h3>
                    <p>{style.description}</p>
                    <span className="acc-style-link">
                      Explore Collection
                      <i className="bi bi-arrow-right"></i>
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="promo-banner-section">
        <div className="container">
          <div className="promo-banner">
            <img
              src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1400&h=520&fit=crop&q=80"
              alt="Model wearing sunglasses for the finish the look banner"
              className="promo-banner-bg"
              loading="lazy"
            />
            <div className="promo-banner-overlay"></div>
            <div className="promo-banner-content acc-banner-content">
              <span className="promo-banner-tag">STYLE COMPLETE</span>
              <h2>FINISH THE LOOK</h2>
              <h3>Every detail matters.</h3>
              <p>
                Complete your outfit with accessories selected to match your
                everyday style.
              </p>
              <Link
                to="#accessories-products"
                className="btn btn-light btn-lg px-5"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToProducts();
                }}
              >
                Shop Accessories
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-box">
            <div className="newsletter-content">
              <span>THE STYLE REPORT</span>
              <h2>Stay Ahead Of The Style</h2>
              <p>
                Get updates about new collections, exclusive offers and
                seasonal arrivals.
              </p>
            </div>

            <div className="newsletter-form-wrapper">
              {!subscribed ? (
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                  />
                  <button type="submit">Subscribe</button>
                </form>
              ) : (
                <div className="newsletter-success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Thank you! You're on the list.
                </div>
              )}
              {emailError && (
                <div className="newsletter-error">
                  <i className="bi bi-exclamation-circle-fill me-2"></i>
                  {emailError}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

export default Accessories;