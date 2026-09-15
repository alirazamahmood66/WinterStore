import { Link } from "react-router-dom";

function formatPrice(price) {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

function ProductCard({ product, wishlist, toggleWishlist, onAddToCart }) {
  const isWished = wishlist[product.id];

  return (
    <div className="shop-product-card">
      <div className="product-image">
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        <button
          className={`wishlist-btn ${isWished ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          aria-label="Toggle wishlist"
        >
          <i className={`bi ${isWished ? "bi-heart-fill" : "bi-heart"}`}></i>
        </button>
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.alt}
            className="product-img"
            loading="lazy"
          />
        </Link>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>
          <Link to={`/product/${product.id}`} className="product-name-link">
            {product.name}
          </Link>
        </h3>

        <div className="product-rating">
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
          <span>({product.reviews})</span>
        </div>

        <div className="product-price">
          <strong>{formatPrice(product.price)}</strong>
          {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
        </div>

        <div className="product-card-actions">
          <button
            className="add-cart-btn"
            onClick={() => onAddToCart(product)}
          >
            <i className="bi bi-bag-plus me-2"></i>
            Add to Cart
          </button>

          <Link to={`/product/${product.id}`} className="view-details-btn">
            View Details
            <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
