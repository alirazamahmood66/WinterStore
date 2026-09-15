import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../services/ProductsContext";
import ProductCard from "../components/ProductCard";

const categories = [
  {
    title: "Jackets",
    description: "Puffers, parkas & sherpa",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=650&fit=crop&q=80",
    alt: "Men's winter jackets collection",
  },
  {
    title: "Coats",
    description: "Overcoats & wool coats",
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&h=650&fit=crop&q=80",
    alt: "Men's winter coats collection",
  },
  {
    title: "Sweaters",
    description: "Knits, cable & crewnecks",
    image:
      "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=500&h=650&fit=crop&q=80",
    alt: "Men's sweaters collection",
  },
  {
    title: "Hoodies",
    description: "Fleece & zip-ups",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=650&fit=crop&q=80",
    alt: "Men's hoodies collection",
  },
  {
    title: "Accessories",
    description: "Scarves & beanies",
    image:
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500&h=650&fit=crop&q=80",
    alt: "Men's winter accessories collection",
  },
];

const features = [
  {
    icon: "bi-thermometer-snow",
    title: "BUILT FOR EXTREME COLD",
    description: "Down, fleece and wool pieces rated for sub-zero temperatures.",
  },
  {
    icon: "bi-shield-check",
    title: "PREMIUM MATERIALS",
    description: "Italian wool, full-grain leather and 700-fill down insulation.",
  },
  {
    icon: "bi-truck",
    title: "FAST DELIVERY",
    description: "Get your winter gear within 2-3 business days nationwide.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "EASY EXCHANGES",
    description: "Free size exchanges if your fit isn't just right.",
  },
];

function Men() {
  const { products, loading } = useProducts();

  const menProducts = useMemo(
    () => products.filter((p) => p.gender === "Men"),
    [products]
  );

  const allCategories = useMemo(
    () => ["All", ...new Set(menProducts.map((p) => p.category))],
    [menProducts]
  );

  const allSizes = useMemo(
    () => ["All", ...new Set(menProducts.flatMap((p) => p.sizes))],
    [menProducts]
  );

  const allColors = useMemo(
    () => ["All", ...new Set(menProducts.flatMap((p) => p.colors))],
    [menProducts]
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [size, setSize] = useState("All");
  const [color, setColor] = useState("All");
  const [rating, setRating] = useState("All");
  const [sort, setSort] = useState("Featured");
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
    rating !== "All";

  const selectCategory = (cat) => {
    setCategory(cat);
    const el = document.getElementById("men-products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const filteredProducts = useMemo(() => {
    let result = menProducts.filter((p) => {
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
  }, [search, category, minPrice, maxPrice, size, color, rating, sort, menProducts]);

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
      <section className="men-hero">
        <div className="container">
          <nav className="men-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Men</span>
          </nav>
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="men-hero-tag">THE MEN'S EDIT</span>
              <h1>
                MEN'S WINTER
                <br />
                <span>COLLECTION</span>
              </h1>
              <p>
                Rugged outerwear, cosy knits and premium layers crafted to
                handle the coldest months in style.
              </p>
              <div className="men-hero-buttons">
                <Link
                  to="#men-products"
                  className="btn btn-light btn-lg px-4"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById("men-products");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  SHOP COLLECTION
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link
                  to="/shop"
                  className="btn btn-outline-light btn-lg px-4 ms-3"
                >
                  VIEW ALL
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="men-hero-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1516826957135-700dedea698c?w=700&h=820&fit=crop&q=80"
                  alt="Man wearing premium winter fashion"
                  className="men-hero-image"
                />
                <div className="men-hero-floating">
                  <div className="men-hero-floating-icon">
                    <i className="bi bi-snow"></i>
                  </div>
                  <div>
                    <strong>-20°C Rated</strong>
                    <span>Arctic-grade insulation</span>
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
            <h2>Shop Men's By Category</h2>
            <p>Find your perfect winter layer</p>
          </div>

          <div className="row g-4">
            {categories.map((cat, index) => (
              <div className="col-6 col-md-4 col-lg" key={index}>
                <button
                  className="men-category-card"
                  onClick={() => selectCategory(cat.title)}
                  aria-label={`Shop ${cat.title}`}
                >
                  <img src={cat.image} alt={cat.alt} loading="lazy" />
                  <div className="men-category-overlay"></div>
                  <div className="men-category-content">
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

      {/* ================= 3. SHOP MEN'S COLLECTION ================= */}
      <section id="men-products" className="shop-main-section">
        <div className="container">

          <div className="section-heading text-center mb-4">
            <span>SHOP MEN'S</span>
            <h2>Men's Winter Collection</h2>
            <p>Premium outerwear and layers for every look</p>
          </div>

          {/* Toolbar */}
          <div className="shop-toolbar-section pt-3 pb-3 mb-4">
            <div className="shop-toolbar">
              <div className="shop-search-wrapper">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search men's winter wear..."
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
                  <strong>{menProducts.length}</strong> products
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
                <div className="shop-product-grid grid-cols-4">
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

      {/* ================= 4. PROMOTIONAL BANNER ================= */}
      <section className="promo-banner-section">
        <div className="container">
          <div className="promo-banner">
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1400&h=520&fit=crop&q=80"
              alt="Men's winter sale banner"
              className="promo-banner-bg"
              loading="lazy"
            />
            <div className="promo-banner-overlay"></div>
            <div className="promo-banner-content">
              <span className="promo-banner-tag">MEN'S WEEK</span>
              <h2>WINTER READY</h2>
              <h3>Up to 40% Off Outerwear</h3>
              <p>Gear up with premium jackets and coats before the cold hits.</p>
              <Link
                to="/shop"
                className="btn btn-light btn-lg px-5"
              >
                SHOP SALE
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. WHY SHOP MEN'S ================= */}
      <section className="why-section py-5">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WHY WINTERSTORE?</span>
            <h2>Why Shop Men's With Us</h2>
            <p>Built to perform, styled to impress</p>
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

      {/* ================= 6. NEWSLETTER ================= */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-box">
            <div className="newsletter-content">
              <span>THE MEN'S MAIL</span>
              <h2>Get 10% Off Your First Order</h2>
              <p>
                Join for exclusive drops, fit tips and early access to the
                men's winter collection.
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

export default Men;