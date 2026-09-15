import { Link } from "react-router-dom";

const eligibility = [
  {
    icon: "bi-check-circle",
    title: "Unused & Original Condition",
    text: "The product should be unused and returned in its original condition so it can be resold once approved.",
  },
  {
    icon: "bi-box-seam",
    title: "Original Packaging",
    text: "Where applicable, the product should include its original packaging and any accessories that came with it.",
  },
  {
    icon: "bi-calendar3",
    title: "Within the Return Period",
    text: "Return requests should be submitted within the applicable return period for your order.",
  },
  {
    icon: "bi-search",
    title: "May Be Inspected",
    text: "Your product may need to be inspected before a return is approved and moves forward.",
  },
];

const processSteps = [
  {
    icon: "bi-megaphone",
    title: "Request a Return",
    description:
      "Contact our support team and let us know which items you'd like to return and why.",
  },
  {
    icon: "bi-clipboard-data",
    title: "Provide Order Information",
    description:
      "Share your order number, the items in question and your contact details so we can locate your order.",
  },
  {
    icon: "bi-search",
    title: "Return Review",
    description:
      "We check that your request meets the return conditions and confirm the next steps with you.",
  },
  {
    icon: "bi-eye",
    title: "Product Inspection",
    description:
      "Once the item is received, it may be inspected to confirm it is in its original condition.",
  },
  {
    icon: "bi-arrow-repeat",
    title: "Refund / Exchange",
    description:
      "After approval, your refund is processed or an exchange is arranged where available.",
  },
];

const refundPoints = [
  {
    icon: "bi-receipt",
    text: "Refund processing depends on the original order and the payment method used.",
  },
  {
    icon: "bi-shield-check",
    text: "Refunds are processed only after your return has been approved.",
  },
  {
    icon: "bi-cash-coin",
    text: "For Cash on Delivery orders, our support team will coordinate how your refund is issued.",
  },
  {
    icon: "bi-clock",
    text: "Actual refund timing may vary, and you'll be notified once your refund has been processed.",
  },
];

const damagedItems = [
  { icon: "bi-exclamation-triangle", label: "Damaged Product" },
  { icon: "bi-x-octagon", label: "Incorrect Product" },
  { icon: "bi-box", label: "Missing Item" },
];

const faqItems = [
  {
    q: "How do I request a return?",
    a: "Contact our support team with your order number and the items you'd like to return. We'll confirm whether your request is eligible and guide you through the rest of the process.",
  },
  {
    q: "Can I exchange an item?",
    a: "Exchanges are possible where availability allows. Once your return request is reviewed, our support team will let you know whether an exchange can be arranged for your item.",
  },
  {
    q: "What if I received a damaged product?",
    a: "Please contact our support team as soon as possible and keep the item and its packaging. This helps us review your case quickly and arrange the right solution.",
  },
  {
    q: "How long does a refund take?",
    a: "Refunds begin once your return has been approved. The exact timing depends on how your order was paid for and the refund method agreed with our support team, so it may vary.",
  },
  {
    q: "Can sale items be returned?",
    a: "Return eligibility for sale items is assessed when you submit your request. Our support team will confirm what applies to your order at that point.",
  },
  {
    q: "What information is required for a return?",
    a: "You'll need your order number, the item or items being returned, the reason for the return and a way for us to reach you. Original packaging is helpful where available.",
  },
];

function ReturnPolicy() {
  return (
    <main>

      <section className="rp-hero">
        <div className="container">
          <nav className="rp-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Return Policy</span>
          </nav>
          <h1>Return &amp; Refund Policy</h1>
          <p>Learn about our return, exchange and refund process.</p>
        </div>
      </section>

      <section className="rp-overview">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>OUR RETURN PROCESS</span>
            <h2>Returns Made Simple</h2>
            <p>
              We want you to love your WinterStore purchase. If something
              isn't right, our return process is designed to be clear and
              straightforward — you request a return, we review it, and once
              approved, we handle your refund or exchange. Every request is
              reviewed on a case-by-case basis to make sure the outcome is
              fair.
            </p>
          </div>
        </div>
      </section>

      <section className="rp-eligibility">
        <div className="container">
          <div className="rp-eligibility-box">
            <div className="rp-eligibility-head">
              <div className="rp-eligibility-icon">
                <i className="bi bi-clipboard-check"></i>
              </div>
              <div>
                <h2>Return Eligibility</h2>
                <p>To keep things simple, a return is generally considered when:</p>
              </div>
            </div>

            <div className="row g-3 g-lg-4">
              {eligibility.map((item, index) => (
                <div className="col-md-6" key={index}>
                  <div className="rp-eligibility-item">
                    <i className={`bi ${item.icon}`}></i>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rp-nonreturnable">
        <div className="container">
          <div className="rp-note">
            <div className="rp-note-icon">
              <i className="bi bi-ban"></i>
            </div>
            <div>
              <h2>Non-Returnable Items</h2>
              <p>
                Certain products may not be eligible for return where
                applicable — for example, items that have been worn, washed,
                altered or are no longer in their original condition. If an
                item can't be returned, our support team will let you know
                when you submit your request.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rp-process">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>HOW RETURNS WORK</span>
            <h2>The Return Process</h2>
            <p>Five simple steps from request to refund or exchange.</p>
          </div>

          <div className="row g-4">
            {processSteps.map((step, index) => (
              <div className="col-md-6 col-lg" key={index}>
                <div className="rp-step-card">
                  <span className="rp-step-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="rp-step-icon">
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

      <section className="rp-money">
        <div className="container">
          <div className="row g-4 g-lg-5">

            <div className="col-lg-6">
              <div className="rp-card">
                <div className="rp-card-head">
                  <div className="rp-card-icon">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                  <div>
                    <h2>Refunds</h2>
                    <p>How refunds are handled.</p>
                  </div>
                </div>

                <div className="rp-card-list">
                  {refundPoints.map((point, index) => (
                    <div className="rp-card-item" key={index}>
                      <i className={`bi ${point.icon}`}></i>
                      <p>{point.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="rp-card">
                <div className="rp-card-head">
                  <div className="rp-card-icon">
                    <i className="bi bi-arrow-left-right"></i>
                  </div>
                  <div>
                    <h2>Exchanges</h2>
                    <p>Swapping an item for another.</p>
                  </div>
                </div>

                <div className="rp-card-list">
                  <div className="rp-card-item">
                    <i className="bi bi-box-seam"></i>
                    <p>
                      Exchanges are arranged where the requested item is
                      available in stock.
                    </p>
                  </div>
                  <div className="rp-card-item">
                    <i className="bi bi-search"></i>
                    <p>
                      The original item is reviewed as part of your return
                      request before an exchange is confirmed.
                    </p>
                  </div>
                  <div className="rp-card-item">
                    <i className="bi bi-arrow-repeat"></i>
                    <p>
                      Once confirmed, the replacement item is dispatched and
                      any price difference is handled by our support team.
                    </p>
                  </div>
                  <div className="rp-card-item">
                    <i className="bi bi-headset"></i>
                    <p>
                      If an exchange isn't possible, you'll always have the
                      option of a return and refund instead.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="rp-damaged">
        <div className="container">
          <div className="rp-damaged-box">
            <span className="rp-damaged-label">
              <i className="bi bi-exclamation-diamond"></i>
              RECEIVED SOMETHING WRONG?
            </span>
            <h2>Damaged or Incorrect Product?</h2>
            <p>
              If your order arrives with a problem, contact our support team
              right away and we'll help you make it right.
            </p>

            <div className="rp-damaged-chips">
              {damagedItems.map((item, index) => (
                <div className="rp-damaged-chip" key={index}>
                  <i className={`bi ${item.icon}`}></i>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <Link to="/contact" className="btn btn-light btn-lg px-5">
              Contact Support
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>

      <section className="rp-faq">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>RETURN FAQS</span>
            <h2>Common Questions</h2>
            <p>Quick answers about returns, refunds and exchanges.</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="accordion rp-accordion">
                {faqItems.map((item, i) => (
                  <div className="accordion-item" key={i}>
                    <h3 className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#rp-faq-${i}`}
                        aria-expanded="false"
                        aria-controls={`rp-faq-${i}`}
                      >
                        <span className="rp-acc-icon">
                          <i className="bi bi-plus-lg"></i>
                        </span>
                        <span className="rp-acc-question">{item.q}</span>
                      </button>
                    </h3>
                    <div
                      id={`rp-faq-${i}`}
                      className="accordion-collapse collapse"
                      data-bs-parent="#rpFaq"
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

      <section className="rp-cta">
        <div className="container">
          <span className="rp-cta-label">
            <i className="bi bi-box-arrow-in-right"></i>
            GET STARTED
          </span>
          <h2>Ready to Start a Return?</h2>
          <p>
            Head to your order history to review your orders and begin the
            process.
          </p>
          <div className="rp-cta-buttons">
            <Link to="/orders" className="btn btn-dark btn-lg px-5">
              View My Orders
              <i className="bi bi-arrow-right ms-2"></i>
            </Link>
            <Link to="/shop" className="btn btn-outline-dark btn-lg px-5">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}

export default ReturnPolicy;