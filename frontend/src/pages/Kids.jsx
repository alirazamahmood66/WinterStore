import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../services/ProductsContext";
import ProductCard from "../components/ProductCard";

const categories = [
  {
    title: "Jackets",
    description: "Puffers & warm shells",
    image:
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&h=650&fit=crop&q=80",
    alt: "Kids winter jackets collection",
  },
  {
    title: "Hoodies",
    description: "Fleece & easy-wear knits",
    image:
      "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500&h=650&fit=crop&q=80",
    alt: "Kids winter hoodies collection",
  },
  {
    title: "Boots",
    description: "Snow-ready footwear",
    image:
      "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&h=650&fit=crop&q=80",
    alt: "Kids winter boots collection",
  },
];

const features = [
  {
    icon: "bi-thermometer-snow",
    title: "WARM & COMFORTABLE",
    description:
      "Soft fleece linings and insulated layers built for chilly playtime.",
  },
  {
    icon: "bi-shield-check",
    title: "KID-FRIENDLY MATERIALS",
    description:
      "Gentle, breathable fabrics that stay safe against little skin.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "EASY EXCHANGES",
    description:
      "Grow-with-me sizing made simple with free size exchanges.",
  },
  {
    icon: "bi-truck",
    title: "FAST DELIVERY",
    description: "Get your kids' winter gear within 2-3 business days.",
  },
];

function FilterPanel(props) {
  const {
    allCategories,
    allSizes,
    allColors,
    category,
    setCategory,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    size,
    setSize,
    color,
    setColor,
    rating,
    setRating,
    hasActiveFilters,
    clearFilters,
  } = props;

  return (
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
              name="kids-category"
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
              name="kids-size"
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
              name="kids-color"
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
              name="kids-rating"
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
}

function Kids() {
  const { products, loading } = useProducts();

  const kidsProducts = useMemo(
    () => products.filter((p) => p.gender === "Kids"),
    [products]
  );

  const allCategories = useMemo(
    () => ["All", ...new Set(kidsProducts.map((p) => p.category))],
    [kidsProducts]
  );

  const allSizes = useMemo(
    () => ["All", ...new Set(kidsProducts.flatMap((p) => p.sizes))],
    [kidsProducts]
  );

  const allColors = useMemo(
    () => ["All", ...new Set(kidsProducts.flatMap((p) => p.colors))],
    [kidsProducts]
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
    const el = document.getElementById("kids-products");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const filteredProducts = useMemo(() => {
    const result = kidsProducts.filter((p) => {
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
  }, [search, category, minPrice, maxPrice, size, color, rating, sort, kidsProducts]);

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

      {/* ================= 1. HERO + BREADCRUMB ================= */}
      <section className="kids-hero">
        <div className="container">
          <nav className="kids-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Kids</span>
          </nav>
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="kids-hero-tag">THE KIDS' EDIT</span>
              <h1>
                KIDS WINTER
                <br />
                <span>COLLECTION</span>
              </h1>
              <p>
                Warm. Playful. Ready for Winter. — cozy layers and snow-ready
                gear designed to keep up with every little adventure.
              </p>
              <div className="kids-hero-buttons">
                <Link
                  to="#kids-products"
                  className="btn btn-light btn-lg px-4"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById("kids-products");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  SHOP KIDS COLLECTION
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
              <div className="kids-hero-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=700&h=820&fit=crop&q=80"
                  alt="Kids wearing warm winter fashion"
                  className="kids-hero-image"
                />
                <div className="kids-hero-floating">
                  <div className="kids-hero-floating-icon">
                    <i className="bi bi-snow"></i>
                  </div>
                  <div>
                    <strong>Fleece Lined</strong>
                    <span>Extra warmth for play</span>
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
            <span>PLAYTIME ESSENTIALS</span>
            <h2>Shop Kids' By Category</h2>
            <p>Everything little ones need for winter</p>
          </div>

          <div className="row g-4">
            {categories.map((cat, index) => (
              <div className="col-6 col-md-4 col-lg" key={index}>
                <button
                  className="kids-category-card"
                  onClick={() => selectCategory(cat.title)}
                  aria-label={`Shop ${cat.title}`}
                >
                  <img src={cat.image} alt={cat.alt} loading="lazy" />
                  <div className="kids-category-overlay"></div>
                  <div className="kids-category-content">
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

      {/* ================= 3. SHOP KIDS' COLLECTION ================= */}
      <section id="kids-products" className="shop-main-section">
        <div className="container">

          <div className="section-heading text-center mb-4">
            <span>SHOP KIDS'</span>
            <h2>Kids' Winter Collection</h2>
            <p>Warm layers and playful styles for your little one</p>
          </div>

          {/* Toolbar */}
          <div className="shop-toolbar-section pt-3 pb-3 mb-4">
            <div className="shop-toolbar">
              <div className="shop-search-wrapper">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search kids' winter wear..."
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
              <FilterPanel
                allCategories={allCategories}
                allSizes={allSizes}
                allColors={allColors}
                category={category}
                setCategory={setCategory}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                size={size}
                setSize={setSize}
                color={color}
                setColor={setColor}
                rating={rating}
                setRating={setRating}
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
              />
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
                  <strong>{kidsProducts.length}</strong> products
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
              src="https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1400&h=520&fit=crop&q=80"
              alt="Kids winter gear banner"
              className="promo-banner-bg"
              loading="lazy"
            />
            <div className="promo-banner-overlay"></div>
            <div className="promo-banner-content kids-banner-content">
              <span className="promo-banner-tag">KIDS' WINTER</span>
              <h2>MADE FOR LITTLE ADVENTURES</h2>
              <h3>Snow. Play. Warmth.</h3>
              <p>
                Waterproof boots, cozy knits and puffy layers that keep every
                little explorer warm from first flake to last.
              </p>
              <Link
                to="#kids-products"
                className="btn btn-light btn-lg px-5"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("kids-products");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                SHOP KIDS
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. WHY SHOP KIDS' ================= */}
      <section className="why-section py-5">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WHY WINTERSTORE?</span>
            <h2>Why Shop Kids' Winterwear With Us</h2>
            <p>Made for little ones, trusted by parents</p>
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
              <span>THE KIDS' MAIL</span>
              <h2>Get 10% Off Your First Order</h2>
              <p>
                Join for exclusive drops, parenting-friendly picks and early
                access to the kids' winter collection.
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
              <FilterPanel
                allCategories={allCategories}
                allSizes={allSizes}
                allColors={allColors}
                category={category}
                setCategory={setCategory}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                size={size}
                setSize={setSize}
                color={color}
                setColor={setColor}
                rating={rating}
                setRating={setRating}
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
              />
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

export default Kids;