import { Link } from "react-router-dom";

const infoCards = [
  {
    icon: "bi-box-seam",
    title: "Order Processing",
    description:
      "Every order is confirmed, prepared and packed by our team. Once you place an order, it appears in My Orders and its status is updated as it moves through each stage.",
  },
  {
    icon: "bi-truck",
    title: "Shipping Methods",
    description:
      "Standard delivery is available on every order. Delivery is free on orders above Rs. 5,000, and a standard fee of Rs. 200 applies to smaller orders. Your shipping cost is always shown at checkout.",
  },
  {
    icon: "bi-geo-alt",
    title: "Delivery Areas",
    description:
      "We deliver across Pakistan and a range of supported destinations. Select your country and city at checkout to confirm delivery options for your area.",
  },
  {
    icon: "bi-bell",
    title: "Delivery Updates",
    description:
      "Follow your order from checkout to your doorstep in My Orders, as its status moves through Pending, Confirmed, Prepared, Shipped and Delivered.",
  },
];

const processSteps = [
  {
    icon: "bi-cart-plus",
    title: "Order Placed",
    description:
      "You complete checkout and your order is recorded instantly — it appears in My Orders with a Pending status.",
  },
  {
    icon: "bi-check2-circle",
    title: "Order Confirmed",
    description:
      "Our team verifies your order and contacts you to confirm your delivery details before it moves forward.",
  },
  {
    icon: "bi-box-seam",
    title: "Order Prepared",
    description:
      "Your items are gathered, quality checked and carefully packed, ready for dispatch.",
  },
  {
    icon: "bi-truck",
    title: "Order Shipped",
    description:
      "Your parcel leaves our facility and begins its journey to your delivery address.",
  },
  {
    icon: "bi-house-check",
    title: "Order Delivered",
    description:
      "Your order reaches you. With Cash on Delivery, you simply pay when it arrives.",
  },
];

const faqItems = [
  {
    q: "How long does shipping take?",
    a: "Delivery times depend on your location and the items you order. You'll see the relevant shipping details at checkout before you confirm your order.",
  },
  {
    q: "When will my order be processed?",
    a: "Orders are processed after confirmation. Once placed, your order appears in My Orders and you'll be contacted to confirm your delivery details before it moves ahead.",
  },
  {
    q: "How can I track my order?",
    a: "Open My Orders and follow your order's status as it moves through Pending, Confirmed, Prepared, Shipped and Delivered. For anything specific, our support team can help.",
  },
  {
    q: "What happens if I am unavailable at delivery?",
    a: "Our team reaches out to confirm delivery details before your order ships. If a delivery can't be completed, we'll get in touch to arrange a suitable alternative.",
  },
  {
    q: "Can I change my shipping address?",
    a: "If you need to update your address, contact our support team as early as possible and we'll update the delivery details for you wherever possible.",
  },
  {
    q: "Do you deliver to all areas?",
    a: "We deliver to the areas we support. You can confirm delivery availability for your destination by selecting your country and city at checkout.",
  },
];

const importantPoints = [
  {
    icon: "bi-exclamation-triangle",
    text: "Incorrect or incomplete shipping information may cause delivery delays — please double-check your details before placing an order.",
  },
  {
    icon: "bi-clock",
    text: "Delivery times may vary by location and should be treated as estimates rather than exact guarantees.",
  },
  {
    icon: "bi-person-check",
    text: "Please provide accurate contact information so our team can confirm your delivery details without delays.",
  },
  {
    icon: "bi-calendar2-check",
    text: "Orders may experience delays during peak seasons and sale periods, so please allow extra time at those times.",
  },
];

function ShippingPolicy() {
  return (
    <main>

      <section className="sp-hero">
        <div className="container">
          <nav className="sp-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Shipping Policy</span>
          </nav>
          <h1>Shipping Policy</h1>
          <p>
            Everything you need to know about WinterStore delivery and
            shipping.
          </p>
        </div>
      </section>

      <section className="sp-overview">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>OUR SHIPPING APPROACH</span>
            <h2>Delivery, Done Right</h2>
            <p>
              At WinterStore we aim to process every order efficiently, confirm
              your delivery details with you and get your parcel on its way as
              smoothly as possible. Each order moves through a clear set of
              stages — from the moment it's placed to the day it arrives — and
              you can follow its progress every step of the way.
            </p>
          </div>

          <div className="row g-4">
            {infoCards.map((card, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <div className="feature-box">
                  <div className="feature-icon">
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sp-process">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>HOW DELIVERY WORKS</span>
            <h2>The Delivery Process</h2>
            <p>Five simple steps from checkout to your doorstep.</p>
          </div>

          <div className="row g-4">
            {processSteps.map((step, index) => (
              <div className="col-md-6 col-lg" key={index}>
                <div className="sp-step-card">
                  <span className="sp-step-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="sp-step-icon">
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

      <section className="sp-faq">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>SHIPPING FAQS</span>
            <h2>Common Questions</h2>
            <p>Quick answers about delivery and shipping.</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="accordion sp-accordion">
                {faqItems.map((item, i) => (
                  <div className="accordion-item" key={i}>
                    <h3 className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#sp-faq-${i}`}
                        aria-expanded="false"
                        aria-controls={`sp-faq-${i}`}
                      >
                        <span className="sp-acc-icon">
                          <i className="bi bi-plus-lg"></i>
                        </span>
                        <span className="sp-acc-question">{item.q}</span>
                      </button>
                    </h3>
                    <div
                      id={`sp-faq-${i}`}
                      className="accordion-collapse collapse"
                      data-bs-parent="#spShippingFaq"
                    >
                      <div className="accordion-body">
                        <p>{item.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sp-important">
        <div className="container">
          <div className="sp-important-box">
            <div className="sp-important-head">
              <div className="sp-important-icon">
                <i className="bi bi-info-circle"></i>
              </div>
              <div>
                <h2>Important Information</h2>
                <p>Please keep the following points in mind when ordering.</p>
              </div>
            </div>

            <div className="row g-3 g-lg-4">
              {importantPoints.map((point, index) => (
                <div className="col-md-6" key={index}>
                  <div className="sp-important-item">
                    <i className={`bi ${point.icon}`}></i>
                    <p>{point.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sp-support">
        <div className="container">
          <span className="sp-support-label">
            <i className="bi bi-chat-dots"></i>
            WE'RE HERE TO HELP
          </span>
          <h2>Need Help With Your Delivery?</h2>
          <p>
            Contact our support team if you have questions about your shipment.
          </p>
          <div className="sp-support-buttons">
            <Link to="/contact" className="btn btn-dark btn-lg px-5">
              Contact Us
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-box">
            <h2>Ready to Find Your Winter Look?</h2>
            <p>
              Explore the WinterStore collection and discover something made
              for you.
            </p>
            <Link to="/shop" className="btn btn-light btn-lg px-5">
              Continue Shopping
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

export default ShippingPolicy;