import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProducts } from "../services/ProductsContext";
import ProductCard from "../components/ProductCard";

function Shop() {
  const { products, loading } = useProducts();

  const allCategories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category))],
    [products]
  );

  const allGenders = useMemo(
    () => ["All", ...new Set(products.map((p) => p.gender))],
    [products]
  );

  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(urlSearch);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlSearch);

  if (urlSearch !== prevUrlSearch) {
    setPrevUrlSearch(urlSearch);
    setSearch(urlSearch);
  }

  const [category, setCategory] = useState("All");
  const [gender, setGender] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availability, setAvailability] = useState("All");
  const [rating, setRating] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [gridCols, setGridCols] = useState(3);
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist")) || {};
    } catch {
      return {};
    }
  });
  const [showFilters, setShowFilters] = useState(false);

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
    } catch {
      // localStorage not available
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setGender("All");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("All");
    setRating("All");
    setSort("Featured");
  };

  const hasActiveFilters =
    search ||
    category !== "All" ||
    gender !== "All" ||
    minPrice ||
    maxPrice ||
    availability !== "All" ||
    rating !== "All";

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const searchLower = search.toLowerCase();
      const textFields = [
        p.name,
        p.category,
        p.gender,
        p.description,
        p.alt,
        p.badge,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !search || textFields.includes(searchLower);

      const matchesCategory = category === "All" || p.category === category;
      const matchesGender = gender === "All" || p.gender === gender;

      const matchesPrice =
        (!minPrice || p.price >= Number(minPrice)) &&
        (!maxPrice || p.price <= Number(maxPrice));

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
        matchesGender &&
        matchesPrice &&
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
  }, [search, category, gender, minPrice, maxPrice, availability, rating, sort, products]);

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

      {/* Category */}
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

      {/* Gender */}
      <div className="filter-group">
        <h6>Gender</h6>
        {allGenders.map((g) => (
          <label key={g} className="filter-option">
            <input
              type="radio"
              name="gender"
              checked={gender === g}
              onChange={() => setGender(g)}
            />
            <span className="filter-radio"></span>
            {g}
          </label>
        ))}
      </div>

      {/* Price Range */}
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

      {/* Availability */}
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

      {/* Rating */}
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
            {opt === "All"
              ? "All"
              : `${opt} stars & above`}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <main>
      {/* Shop Hero */}
      <section className="shop-hero">
        <div className="container">
          <div className="shop-hero-content">
            <span className="shop-hero-tag">OUR COLLECTION</span>
            <h1>SHOP</h1>
            <p>Discover premium winter fashion for every style.</p>
          </div>
        </div>
      </section>

      {/* Shop Toolbar */}
      <section className="shop-toolbar-section">
        <div className="container">
          <div className="shop-toolbar">
            <div className="shop-search-wrapper">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search winter products..."
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
      </section>

      {/* Shop Main Content */}
      <section className="shop-main-section">
        <div className="container">
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
                  <strong>{products.length}</strong> products
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
                  {search ? (
                    <>
                      <h3>
                        No products found for &quot;{search}&quot;
                      </h3>
                      <p>
                        Try a different search term or adjust your filters to
                        find what you&apos;re looking for.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>No products found</h3>
                      <p>
                        Try adjusting your filters or search to find what
                        you&apos;re looking for.
                      </p>
                    </>
                  )}
                  <div className="shop-empty-actions">
                    <Link to="/shop" className="btn btn-dark px-4">
                      <i className="bi bi-grid me-2"></i>
                      View All Products
                    </Link>
                    <button
                      className="btn btn-outline-dark px-4"
                      onClick={clearFilters}
                    >
                      <i className="bi bi-x-lg me-2"></i>
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Filter Offcanvas */}
      {showFilters && (
        <div className="shop-offcanvas-overlay" onClick={() => setShowFilters(false)}>
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

export default Shop;
