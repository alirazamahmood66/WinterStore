import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const readUser = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("winterstore_user"));
    return raw && raw.loggedIn ? raw : null;
  } catch {
    return null;
  }
};

function Navbar() {
  const [user, setUser] = useState(readUser);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const navigate = useNavigate();

  const runSearch = (raw) => {
    const query = raw.trim();
    if (!query) {
      setSearchError("Please enter a search term.");
      return;
    }
    setSearchError("");
    setSearchQuery(query);
    const close = document.querySelector("#searchModal .btn-close");
    if (close) close.click();
    navigate("/shop?search=" + encodeURIComponent(query));
  };

  useEffect(() => {
    const refresh = () => setUser(readUser());
    window.addEventListener("auth-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("auth-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">

            <span>
              <i className="bi bi-truck me-2"></i>
              Free Delivery on Orders Above Rs. 5,000
            </span>

            <span className="top-bar-center">
              WINTER SALE — UP TO 40% OFF
            </span>

            <span>
              <i className="bi bi-headset me-2"></i>
              Customer Support
            </span>

          </div>
        </div>
      </div>


      {/* Main Navbar */}
      <nav className="navbar navbar-expand-lg winter-navbar">
        <div className="container">

          {/* Logo */}
          <Link
            className="navbar-brand winter-logo"
            to="/"
          >
            WINTER<span>STORE</span>
          </Link>


          {/* Mobile Toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list"></i>
          </button>


          {/* Navbar Content */}
          <div
            className="collapse navbar-collapse"
            id="mainNavbar"
          >

            {/* Navigation Links */}
            <ul className="navbar-nav mx-auto winter-nav-links">

              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/"
                  end
                >
                  Home
                </NavLink>
              </li>


              {/* Shop Dropdown */}
              <li className="nav-item dropdown">

                <button
                  className="nav-link dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Shop
                </button>

                <ul className="dropdown-menu winter-dropdown">

                  <li>
                    <Link
                      className="dropdown-item"
                      to="/shop"
                    >
                      All Products
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to="/shop"
                    >
                      New Arrivals
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to="/shop"
                    >
                      Best Sellers
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to="/shop"
                    >
                      Sale
                    </Link>
                  </li>

                </ul>

              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/men"
                >
                  Men
                </NavLink>
              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/women"
                >
                  Women
                </NavLink>
              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/kids"
                >
                  Kids
                </NavLink>
              </li>


              {/* Accessories Dropdown */}
              <li className="nav-item dropdown">

                <button
                  className="nav-link dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Accessories
                </button>

                <ul className="dropdown-menu winter-dropdown">

                  <li>
                    <Link
                      className="dropdown-item"
                      to="/accessories"
                    >
                      All Accessories
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to={{ pathname: "/accessories", search: "?type=Scarves" }}
                    >
                      Scarves
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to={{ pathname: "/accessories", search: "?type=Gloves" }}
                    >
                      Gloves
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to={{
                        pathname: "/accessories",
                        search: "?type=" + encodeURIComponent("Caps & Beanies"),
                      }}
                    >
                      Caps & Beanies
                    </Link>
                  </li>

                  <li>
                    <Link
                      className="dropdown-item"
                      to={{
                        pathname: "/accessories",
                        search: "?type=" + encodeURIComponent("Winter Socks"),
                      }}
                    >
                      Winter Socks
                    </Link>
                  </li>

                </ul>

              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/services"
                >
                  Services
                </NavLink>
              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/gallery"
                >
                  Gallery
                </NavLink>
              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/about"
                >
                  About
                </NavLink>
              </li>


              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/contact"
                >
                  Contact
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/feedback"
                >
                  Feedback
                </NavLink>
              </li>

            </ul>


            {/* Right Side Actions */}
            <div className="navbar-actions">

              {/* Search */}
              <button
                className="nav-icon-btn"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#searchModal"
                aria-label="Search"
              >
                <i className="bi bi-search"></i>
              </button>


              {/* Admin */}
              {user && user.role === "admin" && (
                <Link
                  to="/admin/dashboard"
                  className="nav-icon-btn"
                  aria-label="Admin"
                  title="Admin Dashboard"
                >
                  <i className="bi bi-grid-1x2"></i>
                </Link>
              )}

              {/* Account */}
              <Link
                to={user ? "/account" : "/login"}
                className="nav-icon-btn"
                aria-label="Account"
              >
                <i className="bi bi-person"></i>
              </Link>


              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="nav-icon-btn"
                aria-label="Wishlist"
              >
                <i className="bi bi-heart"></i>
              </Link>


              {/* Cart */}
              <Link
                to="/cart"
                className="nav-icon-btn cart-btn"
                aria-label="Shopping cart"
              >
                <i className="bi bi-bag"></i>

                <span className="cart-count">
                  0
                </span>

              </Link>

            </div>

          </div>
        </div>
      </nav>


      {/* Search Modal */}
      <div
        className="modal fade"
        id="searchModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">

          <div className="modal-content search-modal">

            <div className="modal-header border-0">

              <h5 className="modal-title">
                Search Products
              </h5>

              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>

            </div>


            <div className="modal-body">

              <form
                className="search-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  runSearch(searchQuery);
                }}
                noValidate
              >

                <i className="bi bi-search"></i>

                <input
                  type="text"
                  placeholder="Search jackets, sweaters, hoodies..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError("");
                  }}
                />

                <button type="submit">
                  Search
                </button>

              </form>

              {searchError && (
                <p className="search-error" role="alert">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {searchError}
                </p>
              )}


              <div className="popular-searches">

                <span>Popular:</span>

                <button type="button" onClick={() => runSearch("Jackets")}>
                  Jackets
                </button>
                <button type="button" onClick={() => runSearch("Hoodies")}>
                  Hoodies
                </button>
                <button type="button" onClick={() => runSearch("Sweaters")}>
                  Sweaters
                </button>
                <button type="button" onClick={() => runSearch("Coats")}>
                  Coats 
                </button>

              </div>

            </div>

          </div>
        </div>
      </div>

    </>
  );
}

export default Navbar;