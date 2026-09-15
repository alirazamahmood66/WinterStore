import { Link } from "react-router-dom";

const services = [
  {
    icon: "bi-truck",
    title: "Fast Delivery",
    description:
      "Get your favorite winter styles delivered quickly and reliably.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "Easy Returns",
    description:
      "Shop with confidence with a simple and convenient return experience.",
  },
  {
    icon: "bi-shield-lock",
    title: "Secure Payments",
    description:
      "Your checkout experience is designed with security and convenience in mind.",
  },
  {
    icon: "bi-patch-check",
    title: "Quality Products",
    description:
      "Discover carefully selected fashion pieces made for comfort and style.",
  },
  {
    icon: "bi-headset",
    title: "Customer Support",
    description:
      "Our support team is here to help with your questions and shopping needs.",
  },
  {
    icon: "bi-bag-check",
    title: "Easy Online Shopping",
    description:
      "Browse collections, save favorites and shop from anywhere.",
  },
];

const whyPoints = [
  {
    title: "Simple shopping experience",
    description: "Easy browsing, smooth checkout and clear tracking at every step.",
  },
  {
    title: "Reliable service",
    description: "On-time delivery and dependable support whenever you need us.",
  },
  {
    title: "Carefully selected products",
    description: "Every winter piece is chosen for quality, comfort and style.",
  },
  {
    title: "Customer-first approach",
    description: "Your satisfaction guides everything we do, from order to delivery.",
  },
];

const steps = [
  {
    number: "01",
    icon: "bi-search",
    title: "Browse",
    description: "Explore our collections and discover pieces you love.",
  },
  {
    number: "02",
    icon: "bi-bag",
    title: "Choose",
    description: "Pick your favorites and save them to your wishlist.",
  },
  {
    number: "03",
    icon: "bi-credit-card",
    title: "Checkout",
    description: "Enjoy a smooth, secure and simple checkout process.",
  },
  {
    number: "04",
    icon: "bi-box-seam",
    title: "Receive",
    description: "Get your order delivered quickly, ready to wear.",
  },
];

function Services() {
  return (
    <main>

      <section className="service-hero">
        <div className="container">
          <nav className="service-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Services</span>
          </nav>
          <span className="service-hero-badge">
            <i className="bi bi-bag-check"></i>
            What We Offer
          </span>
          <h1>Our Services</h1>
          <p>
            Everything you need for a smooth, simple and enjoyable
            shopping experience.
          </p>
        </div>
      </section>

      <section className="service-services">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>WINTERSTORE SERVICES</span>
            <h2>What We Offer</h2>
            <p>Premium service at every step of your shopping journey.</p>
          </div>

          <div className="row g-4">
            {services.map((service, index) => (
              <div className="col-md-6 col-lg-4" key={index}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <i className={`bi ${service.icon}`}></i>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="service-why">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="service-why-label">THE WINTERSTORE DIFFERENCE</span>
              <h2 className="service-why-title">Why Choose Our Service</h2>
              <p className="service-why-text">
                We work hard to make shopping simple and stress-free, so you
                can focus on finding the winter style you love.
              </p>

              <ul className="service-checklist">
                {whyPoints.map((point, index) => (
                  <li className="service-check-item" key={index}>
                    <i className="bi bi-check-circle-fill"></i>
                    <div>
                      <strong>{point.title}</strong>
                      <span>{point.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-lg-6">
              <div className="service-why-card">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=900&fit=crop&q=80"
                  alt="Curated winter fashion shopping experience"
                  className="service-why-image"
                  loading="lazy"
                />
                <div className="service-why-float">
                  <div className="service-why-float-icon">
                    <i className="bi bi-award"></i>
                  </div>
                  <div>
                    <strong>1000+</strong>
                    <span>Happy Customers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="service-process">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>HOW IT WORKS</span>
            <h2>Simple In Four Steps</h2>
            <p>From browsing to your doorstep in no time.</p>
          </div>

          <div className="row g-4">
            {steps.map((step, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <div className="service-step-card">
                  <span className="service-step-number">{step.number}</span>
                  <div className="service-step-icon">
                    <i className={`bi ${step.icon}`}></i>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-box">
            <h2>Ready to find your winter style?</h2>
            <p>Explore our collections and let us take care of the rest.</p>
            <div className="service-cta-buttons">
              <Link to="/shop" className="btn btn-light btn-lg px-5">
                Shop Now
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
              <Link to="/contact" className="btn btn-outline-light btn-lg px-5">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

export default Services;