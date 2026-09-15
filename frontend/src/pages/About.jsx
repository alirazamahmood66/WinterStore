import { Link } from "react-router-dom";

function About() {
  return (
    <main>

      <section className="about-hero">
        <div className="container">
          <nav className="about-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>About</span>
          </nav>
          <div className="row align-items-center g-5">
            <div className="col-lg-6 about-hero-content">
              <div className="about-hero-eyebrow">
                <span className="about-hero-badge">
                  <i className="bi bi-gem"></i>
                  Our Story
                </span>
                <span className="about-hero-tag">WINTERSTORE</span>
              </div>
              <h1>
                Style That Moves
                <br />
                <span>With You</span>
              </h1>
              <p>
                We craft premium winter fashion that blends comfort, quality
                and modern design so you feel great every day, in every season.
              </p>
              <div className="about-hero-buttons">
                <Link to="/shop" className="btn btn-light btn-lg px-4">
                  Shop Collection
                  <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <a href="#our-story" className="btn btn-outline-light btn-lg px-4">
                  Explore Our Story
                </a>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="about-hero-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&h=820&fit=crop&q=80"
                  alt="Curated winter fashion and accessories on display"
                  className="about-hero-image"
                />
                <div className="about-hero-floating">
                  <div className="about-hero-floating-icon">
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

      <section id="our-story" className="about-story">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="about-story-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=700&h=900&fit=crop&q=80"
                  alt="Winter fashion editorial look featuring warm layered styling"
                  className="about-story-image"
                />
                <span className="about-story-badge">Since Day One</span>
              </div>
            </div>
            <div className="col-lg-6">
              <span className="about-story-label">WHO WE ARE</span>
              <h2>
                More Than Fashion.
                <br />
                It's Your Everyday Style.
              </h2>
              <p>
                WinterStore was born from one simple idea: winter wear should
                never make you choose between comfort and style. We carefully
                curate every piece so you get premium quality, modern design
                and cozy warmth — all in one.
              </p>
              <p>
                From timeless classics to fresh seasonal favorites, our
                collections are made for real life. Whether you're headed to
                work, the mountains or a quiet evening out, there's a
                WinterStore piece that fits your every day.
              </p>
              <Link to="/shop" className="about-story-link">
                Explore Our Collection
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WHAT WE STAND FOR</span>
            <h2>The Values Behind Every Piece</h2>
            <p>
              Everything we do is guided by the principles that make the
              WinterStore experience truly special.
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="bi bi-award"></i>
                </div>
                <h3>Quality First</h3>
                <p>
                  Durable fabrics and thoughtful finishing on every item, so it
                  lasts season after season.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="bi bi-stars"></i>
                </div>
                <h3>Modern Style</h3>
                <p>
                  Trends curated into timeless silhouettes that keep you
                  confident all winter long.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="bi bi-headset"></i>
                </div>
                <h3>Customer First</h3>
                <p>
                  Friendly support at every step, from browsing to delivery and
                  beyond.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="feature-box">
                <div className="feature-icon">
                  <i className="bi bi-people"></i>
                </div>
                <h3>Made for Everyone</h3>
                <p>
                  Inclusive sizing and collections for men, women and kids of
                  every style.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-why">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WHY WINTERSTORE</span>
            <h2>Why Shop With WinterStore?</h2>
            <p>
              A better way to shop for winter — simple, curated and built
              around you.
            </p>
          </div>
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="about-why-card">
                <div className="about-why-icon">
                  <i className="bi bi-grid"></i>
                </div>
                <h3>Curated Collections</h3>
                <p>
                  Every season's best, handpicked and ready, so you never have
                  to search endlessly.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="about-why-card">
                <div className="about-why-icon">
                  <i className="bi bi-bag-check"></i>
                </div>
                <h3>Easy Shopping</h3>
                <p>
                  A smooth, secure checkout and fast delivery right to your
                  doorstep.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="about-why-card">
                <div className="about-why-icon">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h3>Quality Products</h3>
                <p>
                  Premium materials and trusted craftsmanship in every single
                  piece.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="about-why-card">
                <div className="about-why-icon">
                  <i className="bi bi-headset"></i>
                </div>
                <h3>Reliable Service</h3>
                <p>
                  Real support around the clock, whenever you need a helping
                  hand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-stats">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WINTERSTORE IN NUMBERS</span>
            <h2>Growing With Our Community</h2>
            <p>
              A store built on trust, backed by the people who shop with us.
            </p>
          </div>
          <div className="row align-items-center g-4">
            <div className="col-6 col-lg-3">
              <div className="about-stat">
                <span className="about-stat-number">1000+</span>
                <span className="about-stat-label">Happy Customers</span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="about-stat">
                <span className="about-stat-number">500+</span>
                <span className="about-stat-label">Products</span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="about-stat">
                <span className="about-stat-number">50+</span>
                <span className="about-stat-label">New Styles</span>
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div className="about-stat">
                <span className="about-stat-number">24/7</span>
                <span className="about-stat-label">Customer Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-box">
            <h2>Find Your Next Favorite Style</h2>
            <p>Your perfect winter look is just a click away.</p>
            <Link to="/shop" className="btn btn-light btn-lg px-5">
              Shop Now
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

export default About;