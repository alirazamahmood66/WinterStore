import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../services/ProductsContext";
import ProductCard from "../components/ProductCard";

const categories = [
  {
    title: "Jackets",
    label: "Discover our jackets",
    image:
      "https://images.unsplash.com/photo-1544441892-794166f1e3be?w=500&h=650&fit=crop&q=80",
    alt: "Women's winter jackets collection",
  },
  {
    title: "Coats",
    label: "Discover our coats",
    image:
      "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=500&h=650&fit=crop&q=80",
    alt: "Women's winter coats collection",
  },
  {
    title: "Sweaters",
    label: "Discover our sweaters",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=650&fit=crop&q=80",
    alt: "Women's sweaters collection",
  },
  {
    title: "Hoodies",
    label: "Discover our hoodies",
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=650&fit=crop&q=80",
    alt: "Women's hoodies collection",
  },
  {
    title: "Dresses",
    label: "Discover our dresses",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=650&fit=crop&q=80",
    alt: "Women's winter dresses collection",
  },
  {
    title: "Accessories",
    label: "Discover our accessories",
    image:
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&h=650&fit=crop&q=80",
    alt: "Women's winter accessories collection",
  },
];

const featuredStyles = [
  {
    title: "Cozy Layers",
    description: "Plush knits and soft fleece that keep you warm from morning coffee to evening walks.",
    link: "/shop",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700&h=900&fit=crop&q=80",
    alt: "Woman wearing cozy knit layers",
  },
  {
    title: "Elegant Outerwear",
    description: "Tailored coats and sophisticated jackets that make winter dressing effortless.",
    link: "/shop",
    image:
      "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=700&h=900&fit=crop&q=80",
    alt: "Woman wearing elegant winter coat",
  },
  {
    title: "Everyday Essentials",
    description: "Versatile pieces and accessories that complete every winter outfit.",
    link: "/shop",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=80",
    alt: "Woman styling winter essentials",
  },
];

const features = [
  {
    icon: "bi-gem",
    title: "Premium Quality",
    description: "Carefully selected winter products.",
  },
  {
    icon: "bi-truck",
    title: "Fast Delivery",
    description: "Reliable delivery across Pakistan.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "Easy Returns",
    description: "Simple and convenient returns.",
  },
  {
    icon: "bi-shield-check",
    title: "Secure Payment",
    description: "Safe and secure checkout.",
  },
];

function Women() {
  const { products, loading } = useProducts();

  const womenProducts = useMemo(
    () => products.filter((p) => p.gender === "Women"),
    [products]
  );

  const allCategories = useMemo(
    () => ["All", ...new Set(womenProducts.map((p) => p.category))],
    [womenProducts]
  );

  const allSizes = useMemo(
    () => ["All", ...new Set(womenProducts.flatMap((p) => p.sizes))],
    [womenProducts]
  );

  const allColors = useMemo(
    () => ["All", ...new Set(womenProducts.flatMap((p) => p.colors))],
    [womenProducts]
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [size, setSize] = useState("All");
  const [color, setColor] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [rating, setRating] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [gridCols, setGridCols] = useState(4);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || {};
    } catch {
      return {};
    }
  });
  const [showFilters, setShowFilters] = useState(false);
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

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setMinPrice("");
    setMaxPrice("");
    setSize("All");
    setColor("All");
    setAvailability("All");
    setRating("All");
    setSort("Featured");
  };

  const hasActiveFilters =
    search ||
    category !== "All" ||
    minPrice ||
    maxPrice ||
    size !== "All" ||
    color !== "All" ||
    availability !== "All" ||
    rating !== "All";

  const selectCategory = (cat) => {
    setCategory(cat);
    const el = document.getElementById("women-products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const filteredProducts = useMemo(() => {
    let result = womenProducts.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.badge.toLowerCase().includes(searchLower);

      const matchesCategory = category === "All" || p.category === category;

      const matchesPrice =
        (!minPrice || p.price >= Number(minPrice)) &&
        (!maxPrice || p.price <= Number(maxPrice));

      const matchesSize = size === "All" || p.sizes.includes(size);
      const matchesColor = color === "All" || p.colors.includes(color);

      const matchesAvailability =
        availability === "All" ||
        (availability === "In Stock" && p.stock > 0) ||
        (availability === "Out of Stock" && p.stock === 0);

      const matchesRating =
        rating === "All" ||
        (rating === "4+" && p.rating >= 4) ||
        (rating === "3+" && p.rating >= 3);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPrice &&
        matchesSize &&
        matchesColor &&
        matchesAvailability &&
        matchesRating
      );
    });

    switch (sort) {
      case "Newest":
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "Price: Low to High":
        result.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        result.sort((a, b) => b.price - a.price);
        break;
      case "Highest Rated":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [search, category, minPrice, maxPrice, size, color, availability, rating, sort, womenProducts]);

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

  const FilterPanel = () => (
    <div className="shop-filter-panel">
      <div className="filter-header">
        <h5>
          <i className="bi bi-funnel me-2"></i>
          Filters
        </h5>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            <i className="bi bi-x-lg me-1"></i>
            Clear All
          </button>
        )}
      </div>

      <div className="filter-group">
        <h6>Category</h6>
        {allCategories.map((cat) => (
          <label key={cat} className="filter-option">
            <input
              type="radio"
              name="category"
              checked={category === cat}
              onChange={() => setCategory(cat)}
            />
            <span className="filter-radio"></span>
            {cat}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h6>Price Range</h6>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="price-input"
          />
          <span className="price-separator">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="price-input"
          />
        </div>
      </div>

      <div className="filter-group">
        <h6>Size</h6>
        {allSizes.map((s) => (
          <label key={s} className="filter-option">
            <input
              type="radio"
              name="size"
              checked={size === s}
              onChange={() => setSize(s)}
            />
            <span className="filter-radio"></span>
            {s}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h6>Color</h6>
        {allColors.map((c) => (
          <label key={c} className="filter-option">
            <input
              type="radio"
              name="color"
              checked={color === c}
              onChange={() => setColor(c)}
            />
            <span className="filter-radio"></span>
            {c}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h6>Availability</h6>
        {["All", "In Stock", "Out of Stock"].map((opt) => (
          <label key={opt} className="filter-option">
            <input
              type="radio"
              name="availability"
              checked={availability === opt}
              onChange={() => setAvailability(opt)}
            />
            <span className="filter-radio"></span>
            {opt}
          </label>
        ))}
      </div>

      <div className="filter-group">
        <h6>Rating</h6>
        {["All", "4+", "3+"].map((opt) => (
          <label key={opt} className="filter-option">
            <input
              type="radio"
              name="rating"
              checked={rating === opt}
              onChange={() => setRating(opt)}
            />
            <span className="filter-radio"></span>
            {opt === "All" ? "All" : `${opt} stars & above`}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <main>

      {/* ================= 1. HERO + BREADCRUMB ================= */}
      <section className="women-hero">
        <div className="container">
          <nav className="women-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Women</span>
          </nav>
          <div className="row align-items-center g-5">
            <div className="col-lg-6 women-hero-content">
              <div className="women-hero-eyebrow">
                <span className="women-hero-badge">
                  <i className="bi bi-gem"></i>
                  New Season 2026
                </span>
                <span className="women-hero-tag">WOMEN'S COLLECTION</span>
              </div>
              <h1>
                Winter Style,
                <br />
                <span>Made for Her</span>
              </h1>
              <p>
                Discover elegant layers, cozy essentials and timeless winter
                fashion designed to keep you warm and stylish.
              </p>
              <div className="women-hero-buttons">
                <Link to="/women" className="btn btn-light btn-lg px-4">
                  Shop Women's Collection
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link to="/shop" className="btn btn-outline-light btn-lg px-4">
                  Explore New Arrivals
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="women-hero-image-wrapper">
                <span className="women-hero-arch-ring"></span>
                <span className="women-hero-arch-ring women-hero-arch-ring-2"></span>
                <img
                  src="https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=700&h=820&fit=crop&q=80"
                  alt="Woman wearing an elegant winter coat for a premium fashion look"
                  className="women-hero-image"
                />
                <div className="women-hero-floating">
                  <div className="women-hero-floating-icon">
                    <i className="bi bi-gem"></i>
                  </div>
                  <div>
                    <strong>Handpicked Styles</strong>
                    <span>Premium winter edit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. FEATURED CATEGORIES ================= */}
      <section className="categories-section py-5">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>FEATURED CATEGORIES</span>
            <h2>Shop Women's Winter</h2>
            <p>Find the perfect winter pieces for every style and occasion.</p>
          </div>

          <div className="row g-4">
            {categories.map((cat, index) => (
              <div className="col-6 col-md-4 col-lg-2" key={index}>
                <button
                  className="women-category-card"
                  onClick={() => selectCategory(cat.title)}
                  aria-label={`Shop ${cat.title}`}
                >
                  <img src={cat.image} alt={cat.alt} loading="lazy" />
                  <div className="women-category-overlay"></div>
                  <div className="women-category-content">
                    <span>{cat.label}</span>
                    <h3>{cat.title}</h3>
                    <i className="bi bi-arrow-right"></i>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3. WOMEN'S PRODUCT COLLECTION ================= */}
      <section id="women-products" className="shop-main-section">
        <div className="container">

          <div className="section-heading text-center mb-4">
            <span>SHOP WOMEN'S</span>
            <h2>Women's Winter Collection</h2>
            <p>
              Explore our latest styles designed for warmth, comfort and
              effortless elegance.
            </p>
          </div>

          {/* Toolbar */}
          <div className="shop-toolbar-section pt-3 pb-3 mb-4">
            <div className="shop-toolbar">
              <div className="shop-search-wrapper">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search women's winter wear..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="shop-search-input"
                />
                {search && (
                  <button
                    className="shop-search-clear"
                    onClick={() => setSearch("")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>

              <div className="shop-toolbar-right">
                <button
                  className="shop-filter-toggle d-lg-none"
                  onClick={() => setShowFilters(true)}
                >
                  <i className="bi bi-funnel me-2"></i>
                  Filters
                  {hasActiveFilters && <span className="filter-badge"></span>}
                </button>

                <div className="shop-toolbar-controls">
                  <div className="shop-sort-wrapper">
                    <label>Sort By:</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="shop-sort-select"
                    >
                      <option value="Featured">Featured</option>
                      <option value="Newest">Newest</option>
                      <option value="Price: Low to High">Price: Low to High</option>
                      <option value="Price: High to Low">Price: High to Low</option>
                      <option value="Highest Rated">Highest Rated</option>
                    </select>
                  </div>

                  <div className="shop-view-toggle">
                    <button
                      className={`view-toggle-btn ${gridCols === 3 ? "active" : ""}`}
                      onClick={() => setGridCols(3)}
                      aria-label="3 columns"
                    >
                      <i className="bi bi-grid-3x3-gap-fill"></i>
                    </button>
                    <button
                      className={`view-toggle-btn ${gridCols === 4 ? "active" : ""}`}
                      onClick={() => setGridCols(4)}
                      aria-label="4 columns"
                    >
                      <i className="bi bi-grid-3x3"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            {/* Desktop Sidebar */}
            <div className="col-lg-3 d-none d-lg-block">
              <FilterPanel />
            </div>

            {/* Product Grid */}
            <div className="col-lg-9">
              {loading ? (
                <div className="shop-loading-state text-center py-5">
                  <div className="spinner-border text-dark" role="status"></div>
                  <p className="mt-3 text-muted">Loading products...</p>
                </div>
              ) : (
              <>
              <div className="shop-results-bar">
                <p className="shop-results-count">
                  Showing <strong>{filteredProducts.length}</strong> of{" "}
                  <strong>{womenProducts.length}</strong> products
                </p>
                {hasActiveFilters && (
                  <button
                    className="clear-filters-btn-inline d-none d-md-inline-block"
                    onClick={clearFilters}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Clear All Filters
                  </button>
                )}
              </div>

              {filteredProducts.length > 0 ? (
                <div className={`shop-product-grid grid-cols-${gridCols}`}>
                  {filteredProducts.map((product) => (
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
                  <h3>No products found</h3>
                  <p>
                    Try adjusting your filters or search to find what you're
                    looking for.
                  </p>
                  <button
                    className="btn btn-dark px-4"
                    onClick={clearFilters}
                  >
                    <i className="bi bi-x-lg me-2"></i>
                    Clear All Filters
                  </button>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. WOMEN'S SALE BANNER ================= */}
      <section className="women-sale-section">
        <div className="container">
          <div className="women-sale-banner">
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1500&h=560&fit=crop&q=80"
              alt="Women's winter sale fashion"
              className="women-sale-bg"
              loading="lazy"
            />
            <div className="women-sale-overlay"></div>
            <div className="women-sale-content">
              <span className="women-sale-tag">WOMEN'S WINTER SALE</span>
              <h2>Up to 40% Off</h2>
              <p>Refresh your winter wardrobe with styles you'll love.</p>
              <Link to="/shop" className="btn btn-light btn-lg px-5 women-sale-btn">
                SHOP SALE
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. FEATURED STYLES ================= */}
      <section className="women-featured-section py-5">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>THE WINTER EDIT</span>
            <h2>Made for Winter Days</h2>
            <p>Style, warmth and comfort for every winter moment.</p>
          </div>

          <div className="row g-4">
            {featuredStyles.map((style, index) => (
              <div className="col-md-4" key={index}>
                <Link to={style.link} className="women-feature-block-link">
                  <div className="women-feature-block">
                    <img src={style.image} alt={style.alt} loading="lazy" />
                    <div className="women-feature-overlay"></div>
                    <div className="women-feature-content">
                      <h3>{style.title}</h3>
                      <p>{style.description}</p>
                      <span className="women-feature-btn">
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

      {/* ================= 6. WHY WINTERSTORE ================= */}
      <section className="why-section py-5">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WHY WINTERSTORE?</span>
            <h2>Why Shop With Us</h2>
            <p>Premium winter essentials, delivered with care.</p>
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

      {/* ================= 7. NEWSLETTER ================= */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-box">
            <div className="newsletter-content">
              <span>THE WOMEN'S MAIL</span>
              <h2>Get 10% Off Your First Order</h2>
              <p>
                Join for new arrivals, style guides and early access to the
                women's winter collection.
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

      {/* ================= MOBILE FILTER OFF-CANVAS ================= */}
      {showFilters && (
        <div
          className="shop-offcanvas-overlay"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="shop-offcanvas-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="offcanvas-header">
              <h5>
                <i className="bi bi-funnel me-2"></i>
                Filters
              </h5>
              <button
                className="offcanvas-close"
                onClick={() => setShowFilters(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="offcanvas-body">
              <FilterPanel />
            </div>
            <div className="offcanvas-footer">
              <button
                className="btn btn-dark w-100"
                onClick={() => setShowFilters(false)}
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Women;