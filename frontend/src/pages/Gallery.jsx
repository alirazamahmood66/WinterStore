import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Modal } from "bootstrap";
import { useProducts } from "../services/ProductsContext";

const ACCESSORY_CATS = [
  "Accessories",
  "Bags",
  "Watches",
  "Sunglasses",
  "Belts",
  "Wallets",
  "Jewelry",
];

const enlarge = (url, w, h, q) =>
  url.split("?")[0] + `?w=${w}&h=${h}&fit=crop&q=${q}`;

const gallerySeedIds = [
  1, 25, 27, 16, 9,
  2, 5, 4, 34, 38,
  14, 39, 17,
  8, 6, 59,
];

const featuredLookIds = [25, 34, 39, 8];

const filters = ["All", "Men", "Women", "Kids", "Accessories"];

function Gallery() {
  const { products } = useProducts();

  const galleryItems = useMemo(() => {
    return gallerySeedIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .map((p, index) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        gender: p.gender,
        image: enlarge(p.image, 800, 1000, 80),
        large: enlarge(p.image, 1200, 1500, 85),
        isFeatured: index === 0,
      }));
  }, [products]);

  const featuredLooks = useMemo(
    () =>
      featuredLookIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean),
    [products]
  );

  const [activeFilter, setActiveFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const visible =
    activeFilter === "All"
      ? galleryItems
      : activeFilter === "Accessories"
        ? galleryItems.filter((i) => ACCESSORY_CATS.includes(i.category))
        : galleryItems.filter((i) => i.gender === activeFilter);

  const openModal = (item) => {
    setSelected(item);
    requestAnimationFrame(() => {
      const el = document.getElementById("galleryModal");
      if (!el) return;
      const existing = Modal.getInstance(el);
      if (existing) {
        existing.show();
      } else {
        new Modal(el).show();
      }
    });
  };

  return (
    <main>
      <section className="gl-hero">
        <div className="container">
          <nav className="gl-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Gallery</span>
          </nav>
          <span className="gl-hero-badge">
            <i className="bi bi-images"></i>
            Our Gallery
          </span>
          <h1>WinterStore Gallery</h1>
          <p>
            Explore our latest winter styles, collections and seasonal looks.
          </p>
        </div>
      </section>

      <section className="gl-section">
        <div className="container">
          <div className="gl-filters">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`gl-chip ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {visible.length > 0 ? (
            <div className="gl-grid">
              {visible.map((item) => (
                <div
                  className={`gl-item${
                    item.isFeatured ? " gl-item--featured" : ""
                  }`}
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${item.name}`}
                  onClick={() => openModal(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openModal(item);
                    }
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="gl-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="gl-overlay"></div>
                  <span className="gl-view-btn">
                    <i className="bi bi-zoom-in"></i>
                  </span>
                  {item.isFeatured && (
                    <span className="gl-featured-chip">
                      <i className="bi bi-star-fill"></i>
                      Featured
                    </span>
                  )}
                  <div className="gl-caption">
                    <span className="gl-caption-name">{item.name}</span>
                    <span className="gl-caption-cat">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="gl-empty">
              <p>No images found for this filter.</p>
            </div>
          )}
        </div>
      </section>

      <section className="gl-featured">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>SEASON'S BEST</span>
            <h2>Featured Winter Looks</h2>
            <p>A few of our most loved styles this season.</p>
          </div>

          <div className="row g-4">
            {featuredLooks.map((product) => (
              <div className="col-md-6 col-lg-3" key={product.id}>
                <Link
                  to={`/product/${product.id}`}
                  className="gl-featured-card"
                >
                  <img
                    src={enlarge(product.image, 700, 900, 80)}
                    alt={product.alt}
                    className="gl-featured-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="gl-featured-overlay"></div>
                  <div className="gl-featured-caption">
                    <span>{product.name}</span>
                    <small>
                      {product.category}
                      <i className="bi bi-arrow-right"></i>
                    </small>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-box">
            <h2>Find Your Winter Style</h2>
            <p>
              Discover our latest collections and shop your favorite looks.
            </p>
            <div className="service-cta-buttons">
              <Link to="/shop" className="btn btn-light btn-lg px-5">
                Shop Now
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
              <Link to="/shop" className="btn btn-outline-light btn-lg px-5">
                Explore Collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div
        className="modal fade"
        id="galleryModal"
        tabIndex="-1"
        aria-hidden="true"
        aria-labelledby="galleryModalLabel"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content gl-modal-content">
            <div className="gl-modal-head">
              <h5 className="gl-modal-title" id="galleryModalLabel">
                {selected ? selected.name : "WinterStore Gallery"}
              </h5>
              <button
                type="button"
                className="gl-modal-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="gl-modal-body">
              {selected && (
                <img
                  src={selected.large}
                  alt={selected.name}
                  className="gl-modal-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            {selected && (
              <div className="gl-modal-meta">
                <span>{selected.category}</span>
                <small>{selected.name}</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Gallery;