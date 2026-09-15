import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useProducts } from "../services/ProductsContext";

const categories = [
  {
    title: "Men's Collection",
    description: "Explore premium winter wear for men",
    link: "/men",
    image: "https://images.unsplash.com/photo-1608063615781-e2ef8c73d114?w=500&h=650&fit=crop&q=80",
    alt: "Men's winter fashion collection",
  },
  {
    title: "Women's Collection",
    description: "Discover elegant winter styles for women",
    link: "/women",
    image: "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=500&h=650&fit=crop&q=80",
    alt: "Women's winter fashion collection",
  },
  {
    title: "Kids Collection",
    description: "Keep your little ones warm and cozy",
    link: "/kids",
    image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=500&h=650&fit=crop&q=80",
    alt: "Kids winter fashion collection",
  },
  {
    title: "Accessories",
    description: "Complete your winter look",
    link: "/accessories",
    image: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&h=650&fit=crop&q=80",
    alt: "Winter accessories collection",
  },
];

const features = [
  {
    icon: "bi-truck",
    title: "FREE SHIPPING",
    description: "Free delivery on orders above Rs. 5,000",
  },
  {
    icon: "bi-shield-check",
    title: "SECURE PAYMENT",
    description: "Safe and secure checkout experience",
  },
  {
    icon: "bi-arrow-repeat",
    title: "EASY RETURNS",
    description: "Simple and hassle-free returns",
  },
  {
    icon: "bi-headset",
    title: "CUSTOMER SUPPORT",
    description: "We're here whenever you need us",
  },
];

const instagramImages = [
  {
    src: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop&q=80",
    alt: "Winter outfit inspiration",
  },
  {
    src: "https://images.unsplash.com/photo-1608063615781-e2ef8c73d114?w=400&h=400&fit=crop&q=80",
    alt: "Stylish winter coat",
  },
  {
    src: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop&q=80",
    alt: "Cozy knit sweater",
  },
  {
    src: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop&q=80",
    alt: "Winter scarf style",
  },
  {
    src: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&h=400&fit=crop&q=80",
    alt: "Elegant winter fashion",
  },
  {
    src: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop&q=80",
    alt: "Winter street style",
  },
];

function Home() {
  const { products } = useProducts();

  const featuredProducts = useMemo(
    () => products.filter((p) => p.isFeatured).slice(0, 8),
    [products]
  );

  const newArrivals = useMemo(
    () => products.filter((p) => p.isNew).slice(0, 4),
    [products]
  );

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || {};
    } catch {
      return {};
    }
  });

  const [cartCount, setCartCount] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      return cart.reduce((sum, item) => sum + item.quantity, 0);
    } catch {
      return 0;
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
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      // localStorage not available
    }
  };

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

  const formatPrice = (price) =>
    `Rs. ${price.toLocaleString("en-PK")}`;

  return (
    <main>

      {/* ================= 1. HERO SECTION ================= */}
      <section className="home-hero">
        <div className="container">
          <div className="row align-items-center min-vh-75">

            <div className="col-lg-6 hero-content-col">
              <span className="hero-small-text">
                NEW WINTER COLLECTION 2026
              </span>

              <h1 className="hero-title">
                Stay Warm. <br />
                <span>Stay Stylish.</span>
              </h1>

              <p className="hero-description">
                Discover premium winter fashion designed for comfort,
                confidence and everyday style.
              </p>

              <div className="hero-buttons">
                <Link to="/men" className="btn btn-light btn-lg px-4">
                  SHOP MEN
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>

                <Link to="/women" className="btn btn-outline-light btn-lg px-4">
                  SHOP WOMEN
                </Link>
              </div>
            </div>

            <div className="col-lg-6 hero-image-col">
              <div className="hero-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=700&h=900&fit=crop&q=80"
                  alt="Winter fashion model wearing premium winter collection"
                  className="hero-image"
                />
                <div className="hero-image-overlay"></div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ================= 2. CATEGORY SECTION ================= */}
      <section className="categories-section py-5">
        <div className="container">

          <div className="section-heading text-center mb-5">
            <span>EXPLORE COLLECTION</span>
            <h2>Shop By Category</h2>
            <p>Explore our winter essentials</p>
          </div>

          <div className="row g-4">
            {categories.map((category, index) => (
              <div className="col-sm-6 col-lg-3" key={index}>
                <Link to={category.link} className="category-card-link">
                  <div className="home-category-card">
                    <div className="home-category-image">
                      <img
                        src={category.image}
                        alt={category.alt}
                        loading="lazy"
                      />
                      <div className="home-category-overlay"></div>
                    </div>
                    <div className="home-category-content">
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                      <span className="home-category-btn">
                        Explore Collection
                        <i className="bi bi-arrow-right ms-2"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ================= 3. FEATURED PRODUCTS ================= */}
      <section className="products-section py-5">
        <div className="container">

          <div className="text-center mb-5">
      <div className="section-heading mb-3">
        <span className="text-uppercase fw-bold small" style={{letterSpacing: '2px', color: '#0dcaf0'}}>
      FEATURED COLLECTION
        </span>
      <h2 className="fw-bold">Featured Products</h2>
        <p className="text-muted">Winter essentials everyone is talking about</p>
        </div>
  
      <Link to="/shop" className="view-all-btn d-inline-block">
        View All
        <i className="bi bi-arrow-right ms-2"></i>
      </Link>
      </div>

          <div className="row g-4">
            {featuredProducts.map((product) => (
              <div className="col-sm-6 col-lg-3" key={product.id}>
                <div className="product-card">
                  <div className="product-image">
                    {product.badge && (
                      <span className="product-badge">{product.badge}</span>
                    )}
                    <button
                      className={`wishlist-btn ${wishlist[product.id] ? "active" : ""}`}
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Toggle wishlist"
                    >
                      <i className={`bi ${wishlist[product.id] ? "bi-heart-fill" : "bi-heart"}`}></i>
                    </button>
                    <img
                      src={product.image}
                      alt={product.alt}
                      className="product-img"
                      loading="lazy"
                    />
                  </div>

                  <div className="product-info">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>

                    <div className="product-rating">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < Math.floor(product.rating) ? "bi-star-fill" : "bi-star"}`}
                        ></i>
                      ))}
                      <span>({product.reviews})</span>
                    </div>

                    <div className="product-price">
                      <strong>{formatPrice(product.price)}</strong>
                      {product.oldPrice && (
                        <del>{formatPrice(product.oldPrice)}</del>
                      )}
                    </div>

                    <button
                      className="add-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      <i className="bi bi-bag-plus me-2"></i>
                      Add to Cart
                    </button>

                    <Link
                      to={`/product/${product.id}`}
                      className="view-details-btn"
                    >
                      View Details
                      <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5 d-md-none">
            <Link to="/shop" className="btn btn-outline-dark btn-lg px-5">
              VIEW ALL PRODUCTS
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>

          <div className="text-center mt-5 d-none d-md-block">
            <Link to="/shop" className="btn btn-dark btn-lg px-5 home-cta-btn">
              VIEW ALL PRODUCTS
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>

        </div>
      </section>


      {/* ================= 4. PROMOTIONAL BANNER ================= */}
      <section className="promo-banner-section">
        <div className="container">
          <div className="promo-banner">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=500&fit=crop&q=80"
              alt="Winter sale fashion banner"
              className="promo-banner-bg"
              loading="lazy"
            />
            <div className="promo-banner-overlay"></div>
            <div className="promo-banner-content">
              <span className="promo-banner-tag">LIMITED TIME OFFER</span>
              <h2>WINTER SALE</h2>
              <h3>Up to 40% Off</h3>
              <p>Refresh your winter wardrobe with our seasonal collection.</p>
              <Link to="/shop" className="btn btn-light btn-lg px-5">
                SHOP SALE
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ================= 5. WHY SHOP WITH US ================= */}
      <section className="why-section py-5">
        <div className="container">

          <div className="section-heading text-center mb-5">
            <span>WHY WINTERSTORE?</span>
            <h2>Winter Shopping Made Easy</h2>
            <p>Everything you need for a comfortable winter</p>
          </div>

          <div className="row g-4">
            {features.map((feature, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <i className={`bi ${feature.icon}`}></i>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ================= 6. NEW ARRIVALS ================= */}
      <section className="products-section new-arrivals-section py-5">
        <div className="container">

          <div className="text-center mb-5">
            <div className="section-heading mb-3">
        <span className="text-uppercase fw-bold small" style={{letterSpacing: '2px', color: '#0dcaf0'}}>
          FRESH DROPS
        </span>
          <h2 className="fw-bold">New Arrivals</h2>
          <p className="text-muted">Fresh styles for the season</p>
        </div>
  
          <Link to="/shop" className="view-all-btn d-inline-block">
            View All
        <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>

          <div className="row g-4">
            {newArrivals.map((product) => (
              <div className="col-sm-6 col-lg-3" key={product.id}>
                <div className="product-card">
                  <div className="product-image">
                    {product.badge && (
                      <span className="product-badge">{product.badge}</span>
                    )}
                    <button
                      className={`wishlist-btn ${wishlist[product.id] ? "active" : ""}`}
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Toggle wishlist"
                    >
                      <i className={`bi ${wishlist[product.id] ? "bi-heart-fill" : "bi-heart"}`}></i>
                    </button>
                    <img
                      src={product.image}
                      alt={product.alt}
                      className="product-img"
                      loading="lazy"
                    />
                  </div>

                  <div className="product-info">
                    <span className="product-category">{product.category}</span>
                    <h3>{product.name}</h3>

                    <div className="product-rating">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < Math.floor(product.rating) ? "bi-star-fill" : "bi-star"}`}
                        ></i>
                      ))}
                      <span>({product.reviews})</span>
                    </div>

                    <div className="product-price">
                      <strong>{formatPrice(product.price)}</strong>
                      {product.oldPrice && (
                        <del>{formatPrice(product.oldPrice)}</del>
                      )}
                    </div>

                    <button
                      className="add-cart-btn"
                      onClick={() => handleAddToCart(product)}
                    >
                      <i className="bi bi-bag-plus me-2"></i>
                      Add to Cart
                    </button>

                    <Link
                      to={`/product/${product.id}`}
                      className="view-details-btn"
                    >
                      View Details
                      <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/shop" className="btn btn-dark btn-lg px-5 home-cta-btn">
              EXPLORE NEW ARRIVALS
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>

        </div>
      </section>


      {/* ================= 7. WINTER EDITORIAL SECTION ================= */}
      <section className="editorial-section">
        <div className="container">
          <div className="editorial-banner">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=600&fit=crop&q=80"
              alt="Winter fashion editorial styling"
              className="editorial-image"
              loading="lazy"
            />
            <div className="editorial-overlay"></div>
            <div className="editorial-content">
              <span className="editorial-tag">THE WINTER EDIT</span>
              <h2>Layer up. Stand out.</h2>
              <p>
                Discover carefully selected pieces designed to make
                winter dressing effortless.
              </p>
              <Link to="/shop" className="btn btn-light btn-lg px-5">
                EXPLORE COLLECTION
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ================= 8. NEWSLETTER SECTION ================= */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-box">

            <div className="newsletter-content">
              <span>STAY UPDATED</span>
              <h2>Get 10% Off Your First Order</h2>
              <p>
                Sign up for exclusive offers, new arrivals and
                winter style updates.
              </p>
            </div>

            <div className="newsletter-form-wrapper">
              {!subscribed ? (
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                  />
                  <button type="submit">SUBSCRIBE</button>
                </form>
              ) : (
                <div className="newsletter-success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Thank you! Check your email for 10% off.
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


      {/* ================= 9. INSTAGRAM / SOCIAL SECTION ================= */}
      <section className="instagram-section py-5">
        <div className="container">

          <div className="section-heading text-center mb-5">
            <span>GET INSPIRED</span>
            <h2>Follow The Winter Style</h2>
            <p>
              <i className="bi bi-instagram me-2"></i>
              @winterstore
            </p>
          </div>

          <div className="row g-3 instagram-grid">
            {instagramImages.map((img, index) => (
              <div className="col-4 col-md-2" key={index}>
                <div className="instagram-item">
                  <img
                    src={img.src}
                    alt={img.alt}
                    loading="lazy"
                  />
                  <div className="instagram-overlay">
                    <i className="bi bi-instagram"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ================= 10. FINAL CTA ================= */}
      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-box">
            <h2>READY FOR WINTER?</h2>
            <p>Find your perfect winter look today.</p>
            <Link to="/shop" className="btn btn-light btn-lg px-5">
              START SHOPPING
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

export default Home;
