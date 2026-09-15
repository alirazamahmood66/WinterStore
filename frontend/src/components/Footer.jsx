import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="winter-footer">

      {/* Main Footer */}
      <div className="container">

        <div className="row g-5">

          {/* Brand */}
          <div className="col-lg-4">

            <Link
              to="/"
              className="footer-logo"
            >
              WINTER<span>STORE</span>
            </Link>

            <p className="footer-description">
              Your destination for stylish, comfortable and
              quality winter fashion. Discover everything you
              need to stay warm this season.
            </p>


            {/* Social Icons */}
            <div className="footer-social">

              <a href="#!" aria-label="Facebook">
                <i className="bi bi-facebook"></i>
              </a>

              <a href="#!" aria-label="Instagram">
                <i className="bi bi-instagram"></i>
              </a>

              <a href="#!" aria-label="Twitter">
                <i className="bi bi-twitter-x"></i>
              </a>

              <a href="#!" aria-label="YouTube">
                <i className="bi bi-youtube"></i>
              </a>

            </div>

          </div>


          {/* Quick Links */}
          <div className="col-6 col-lg-2">

            <h4>Quick Links</h4>

            <ul>

              <li>
                <Link to="/">Home</Link>
              </li>

              <li>
                <Link to="/about">About Us</Link>
              </li>

              <li>
                <Link to="/services">Services</Link>
              </li>

              <li>
                <Link to="/gallery">Gallery</Link>
              </li>

              <li>
                <Link to="/contact">Contact</Link>
              </li>

            </ul>

          </div>


          {/* Categories */}
          <div className="col-6 col-lg-2">

            <h4>Categories</h4>

            <ul>

              <li>
                <Link to="/men">Men</Link>
              </li>

              <li>
                <Link to="/women">Women</Link>
              </li>

              <li>
                <Link to="/kids">Kids</Link>
              </li>

              <li>
                <Link to="/accessories">
                  Accessories
                </Link>
              </li>

              <li>
                <Link to="/shop">
                  All Products
                </Link>
              </li>

            </ul>

          </div>


          {/* Customer Service */}
          <div className="col-6 col-lg-2">

            <h4>Customer Service</h4>

            <ul>

              <li>
                <Link to="/faq">
                  FAQ
                </Link>
              </li>

              <li>
                <Link to="/feedback">
                  Feedback
                </Link>
              </li>

              <li>
                <Link to="/shipping-policy">
                  Shipping
                </Link>
              </li>

              <li>
                <Link to="/return-policy">
                  Returns
                </Link>
              </li>

              <li>
                <Link to="/privacy-policy">
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link to="/terms">
                  Terms & Conditions
                </Link>
              </li>

            </ul>

          </div>


          {/* Contact */}
          <div className="col-6 col-lg-2">

            <h4>Contact</h4>

            <ul className="footer-contact">

              <li>
                <i className="bi bi-telephone"></i>
                <span>+92 300 0000000</span>
              </li>

              <li>
                <i className="bi bi-envelope"></i>
                <span>support@winterstore.com</span>
              </li>

              <li>
                <i className="bi bi-geo-alt"></i>
                <span>Karachi, Pakistan</span>
              </li>

            </ul>

          </div>

        </div>


        {/* Footer Bottom */}
        <div className="footer-bottom">

          <p>
            © 2026 WinterStore. All rights reserved.
          </p>

          <div className="payment-icons">

            <i className="bi bi-credit-card"></i>
            <i className="bi bi-wallet2"></i>
            <i className="bi bi-cash-stack"></i>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;