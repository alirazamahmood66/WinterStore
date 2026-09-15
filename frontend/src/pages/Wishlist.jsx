import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../services/ProductsContext";

function Wishlist() {
  const { products } = useProducts();

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

  const wishlistProducts = products.filter((product) => wishlist[product.id]);

  return (
    <main>
      <section className="wl-hero">
        <div className="container">
          <nav className="wl-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Wishlist</span>
          </nav>
          <h1>My Wishlist</h1>
          <p>Save your favorite styles and shop them whenever you're ready.</p>
        </div>
      </section>

      <section className="wl-main">
        <div className="container">
          {wishlistProducts.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon">
                <i className="bi bi-heart"></i>
              </div>
              <h1>Your Wishlist is Empty</h1>
              <p>
                Save your favorite products here and come back when you're
                ready to shop.
              </p>
              <Link to="/shop" className="btn btn-dark btn-lg px-5">
                Explore Products
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>
          ) : (
            <>
              <div className="wl-bar">
                <span className="wl-count">
                  <i className="bi bi-heart-fill"></i>
                  {wishlistProducts.length}{" "}
                  {wishlistProducts.length === 1 ? "item" : "items"} saved
                </span>
                <Link to="/shop" className="wl-continue">
                  <i className="bi bi-arrow-left"></i>
                  Continue Shopping
                </Link>
              </div>

              <div className="shop-product-grid grid-cols-4">
                {wishlistProducts.map((product) => (
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
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Wishlist;