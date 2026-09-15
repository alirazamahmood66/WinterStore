import { Link } from "react-router-dom";

const categories = [
  { id: "shopping", icon: "bi-bag", title: "Shopping", blurb: "Placing orders and finding products." },
  { id: "orders", icon: "bi-box-seam", title: "Orders", blurb: "Order status, history and cancellations." },
  { id: "payment", icon: "bi-credit-card", title: "Payment", blurb: "Payment methods and security." },
  { id: "shipping", icon: "bi-truck", title: "Shipping", blurb: "Delivery times, costs and coverage." },
  { id: "returns", icon: "bi-arrow-counterclockwise", title: "Returns & Refunds", blurb: "Returns, exchanges and refunds." },
  { id: "account", icon: "bi-person", title: "Account", blurb: "Managing your WinterStore account." },
];

const faqSections = [
  {
    id: "shopping",
    icon: "bi-bag",
    title: "Shopping",
    blurb: "Everything you need to know about browsing and buying from WinterStore.",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse the shop, add items to your cart and then go to Checkout. Fill in your contact and shipping details, choose a payment method and confirm — that's it. You'll see an order reference once your order has been placed.",
      },
      {
        q: "Do you sell products for men, women and kids?",
        a: "Yes. We carry dedicated collections for Men, Women and Kids, plus a full range of winter accessories. You can reach each collection from the site menu.",
      },
      {
        q: "How can I find a specific product?",
        a: "Use the search icon at the top of the page to look for a product by name or keyword, or browse the Shop and narrow things down by category and type on the Men, Women, Kids and Accessories pages.",
      },
      {
        q: "Are product sizes available?",
        a: "Most clothing items are offered in multiple sizes. Open any product page to see the sizes available for that item before adding it to your cart.",
      },
    ],
  },
  {
    id: "orders",
    icon: "bi-box-seam",
    title: "Orders",
    blurb: "How to keep track of your WinterStore orders.",
    items: [
      {
        q: "How can I check my order status?",
        a: "Sign in and open My Orders from your account. Each order shows its current status, from Pending through to Delivered, so you always know where things stand.",
      },
      {
        q: "Where can I view my previous orders?",
        a: "All of your orders are listed in My Orders, which you can reach from your account page.",
      },
      {
        q: "Can I cancel my order?",
        a: "Orders can usually be cancelled while they are still pending. If you no longer need an order, contact our support team as soon as possible and they'll help you.",
      },
      {
        q: "What happens after I place an order?",
        a: "Your order is saved to your account and marked as Pending. It then moves through confirmation, processing, shipping and, finally, delivery — and its status updates in My Orders at every step.",
      },
    ],
  },
  {
    id: "payment",
    icon: "bi-credit-card",
    title: "Payment",
    blurb: "Payments accepted and how they work.",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery as well as standard online card payments where available. The payment options for your order are shown clearly at checkout.",
      },
      {
        q: "Is online payment secure?",
        a: "Yes — online payments are processed through standard secure channels and your payment details are handled safely. Never share your password or payment details with anyone.",
      },
      {
        q: "Do I have to pay before my order is shipped?",
        a: "With Cash on Delivery you only pay when your order reaches you. If you choose to pay online, the charge is taken at checkout before your order ships.",
      },
    ],
  },
  {
    id: "shipping",
    icon: "bi-truck",
    title: "Shipping",
    blurb: "Delivery times, costs and coverage.",
    items: [
      {
        q: "How long does delivery take?",
        a: "Delivery times depend on your location and the items you order. You'll always find the shipping details at checkout before you confirm your purchase.",
      },
      {
        q: "Do you offer free shipping?",
        a: "We offer free delivery on orders above Rs. 5,000. Orders below that amount have a delivery charge calculated at checkout.",
      },
      {
        q: "How can I track my order?",
        a: "The easiest way is to follow the status in My Orders, which updates as your order moves through processing and shipping. For more detailed tracking, our support team can assist you.",
      },
      {
        q: "Do you deliver nationwide?",
        a: "Yes, we deliver across the country. Enter your delivery city at checkout to see the delivery options available for your area.",
      },
    ],
  },
  {
    id: "returns",
    icon: "bi-arrow-counterclockwise",
    title: "Returns & Refunds",
    blurb: "Returning products and getting your refund.",
    items: [
      {
        q: "What is your return policy?",
        a: "If a product arrives damaged, defective or not what you ordered, let us know and we'll arrange a return. See our Return Policy page for the full details.",
      },
      {
        q: "How long do I have to return a product?",
        a: "Return requests must be raised within the window described on our Return Policy page — reach out as soon as you spot a problem to keep the process quick.",
      },
      {
        q: "How will I receive my refund?",
        a: "Approved refunds are returned to your original payment method. The exact timing can vary, and you'll be notified once your refund has been processed.",
      },
      {
        q: "Can I exchange a product?",
        a: "Exchanges are subject to availability. If you'd like to exchange an item rather than return it, contact our support team and we'll check what's possible.",
      },
    ],
  },
  {
    id: "account",
    icon: "bi-person",
    title: "Account",
    blurb: "Managing your WinterStore account.",
    items: [
      {
        q: "How do I create an account?",
        a: "Click the person icon at the top of the page, then choose Register. Enter your details and you'll be signed in, ready to shop and track your orders.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "If you can't access your account, get in touch with our support team and we'll help you get signed back in.",
      },
      {
        q: "Can I update my account information?",
        a: "Yes — open your account and edit your profile to update your name, contact details and other information at any time.",
      },
    ],
  },
];

function FAQ() {
  return (
    <main>

      <section className="faq-hero">
        <div className="container">
          <nav className="faq-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>FAQ</span>
          </nav>
          <h1>Frequently Asked Questions</h1>
          <p>
            Find answers to common questions about WinterStore, orders,
            shipping, payments and returns.
          </p>
        </div>
      </section>

      <section className="faq-main">
        <div className="container">

          <div className="section-heading text-center mb-5">
            <span>GET HELP</span>
            <h2>Browse Topics</h2>
            <p>Jump straight to the category that matches your question.</p>
          </div>

          <div className="row g-3 g-lg-4 faq-topics">
            {categories.map((cat) => (
              <div className="col-6 col-md-4 col-lg-2" key={cat.id}>
                <a href={`#faq-${cat.id}`} className="faq-topic-card">
                  <div className="faq-topic-icon">
                    <i className={`bi ${cat.icon}`}></i>
                  </div>
                  <span>{cat.title}</span>
                </a>
              </div>
            ))}
          </div>

          <div className="row g-5 faq-layout">
            <div className="col-lg-4">
              <aside className="faq-sidebar">
                <div className="faq-side-nav">
                  <span className="faq-side-label">All Topics</span>
                  {categories.map((cat) => (
                    <a
                      href={`#faq-${cat.id}`}
                      className="faq-side-link"
                      key={cat.id}
                    >
                      <span className="faq-side-link-icon">
                        <i className={`bi ${cat.icon}`}></i>
                      </span>
                      <span>{cat.title}</span>
                      <i className="bi bi-chevron-right"></i>
                    </a>
                  ))}
                </div>

                <div className="faq-side-help">
                  <div className="faq-side-help-icon">
                    <i className="bi bi-headset"></i>
                  </div>
                  <h3>Need More Help?</h3>
                  <p>Our support team is here to answer anything we missed.</p>
                  <Link to="/contact" className="btn btn-dark w-100">
                    Contact Us
                    <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>
              </aside>
            </div>

            <div className="col-lg-8">
              <div className="faq-sections">
                {faqSections.map((section) => (
                  <div className="faq-section" id={`faq-${section.id}`} key={section.id}>
                    <div className="faq-section-head">
                      <div className="faq-section-icon">
                        <i className={`bi ${section.icon}`}></i>
                      </div>
                      <div>
                        <h2>{section.title}</h2>
                        <p>{section.blurb}</p>
                      </div>
                    </div>

                    <div className="accordion faq-accordion">
                      {section.items.map((item, i) => (
                        <div className="accordion-item" key={i}>
                          <h3 className="accordion-header">
                            <button
                              className="accordion-button"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#accordion-${section.id}-${i}`}
                              aria-expanded="false"
                              aria-controls={`accordion-${section.id}-${i}`}
                            >
                              <span className="faq-acc-icon">
                                <i className="bi bi-plus-lg"></i>
                              </span>
                              <span className="faq-acc-question">
                                {item.q}
                              </span>
                            </button>
                          </h3>
                          <div
                            id={`accordion-${section.id}-${i}`}
                            className="accordion-collapse collapse"
                            data-bs-parent={`#accordionGroup-${section.id}`}
                          >
                            <div className="accordion-body">
                              <p>{item.a}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="faq-support">
        <div className="container">
          <span className="faq-support-label">
            <i className="bi bi-chat-dots"></i>
            WE'RE HERE FOR YOU
          </span>
          <h2>Still Have Questions?</h2>
          <p>Our support team is here to help.</p>
          <div className="faq-support-buttons">
            <Link to="/contact" className="btn btn-dark btn-lg px-5">
              Contact Us
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
            <Link to="/shop" className="btn btn-outline-dark btn-lg px-5">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

export default FAQ;