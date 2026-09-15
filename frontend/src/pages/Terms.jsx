import { Link } from "react-router-dom";

const useItems = [
  "Using the website lawfully and in line with these terms",
  "Providing accurate and current information where it is requested",
  "Not attempting to disrupt, overload or interfere with the website",
  "Not abusing or misusing website functionality",
];

const accountItems = [
  "You are responsible for the information associated with your account.",
  "You should keep your login credentials secure and not share them with others.",
  "You should provide accurate, up-to-date information when creating or updating your account.",
];

const productPts = [
  {
    icon: "bi-info-circle",
    text: "Product descriptions and details are provided with care, but may be updated or change over time.",
  },
  {
    icon: "bi-image",
    text: "Product images are intended to give a fair impression of the item, but may not always be perfectly accurate.",
  },
  {
    icon: "bi-tags",
    text: "Prices and availability may change at any time.",
  },
];

const orderPts = [
  { icon: "bi-currency-exchange", text: "Prices may change at any time." },
  { icon: "bi-box", text: "Product availability may change." },
  { icon: "bi-check2-square", text: "An order may require confirmation before it is finalized." },
  { icon: "bi-eye", text: "Please review your order information before completing checkout." },
];

const prohibitedItems = [
  "Engaging in fraudulent or deceptive activity",
  "Unauthorized access to the website, accounts or systems",
  "Abusing or disrupting website functionality",
  "Malicious activity, including interfering with the operation of the website",
  "Misusing accounts or the information associated with them",
];

const useCardLists = [
  {
    icon: "bi-laptop",
    title: "Website Use",
    lead: "When using WinterStore, we ask that you use the website responsibly and only for its intended purpose:",
    list: useItems,
    note: "We rely on all visitors to help keep the website safe and working for everyone.",
  },
  {
    icon: "bi-person-gear",
    title: "User Accounts",
    lead: "If you create an account, the following responsibilities apply:",
    list: accountItems,
    note: "WinterStore accounts in this demo are stored on your device and are not shared with the wider internet.",
  },
];

const termsCards = [
  {
    icon: "bi-box-seam",
    title: "Products & Product Information",
    body: (
      <>
        <p>
          WinterStore attempts to provide clear, useful product information —
          including descriptions, images, prices and availability — so you can
          shop with confidence.
        </p>
        <p>However, product information may change, and you should keep in mind:</p>
      </>
    ),
    list: productPts.map((pt, i) => (
      <li key={i}>
        <i className={`bi ${pt.icon}`}></i>
        {pt.text}
      </li>
    )),
    note: "Product information is provided for guidance and is not a guarantee.",
  },
  {
    icon: "bi-tags",
    title: "Pricing & Orders",
    lead: "When you place an order on WinterStore, a few general principles apply:",
    body: null,
    list: orderPts.map((pt, i) => (
      <li key={i}>
        <i className={`bi ${pt.icon}`}></i>
        {pt.text}
      </li>
    )),
  },
  {
    icon: "bi-credit-card",
    title: "Payments",
    body: (
      <p>
        When you place an order, payment is handled through the payment method
        you select at checkout. WinterStore currently offers Cash on Delivery
        for orders, and no online payment details are required unless an online
        payment method is introduced at a later stage.
      </p>
    ),
    note: "No payment provider is used or named in this demo outside of what appears at checkout.",
  },
  {
    icon: "bi-truck",
    title: "Shipping",
    body: (
      <p>
        Orders placed on WinterStore are dispatched and delivered in line with
        the delivery options available at checkout. Delivery times,
        free-delivery conditions and any applicable details are described in
        our Shipping Policy.
      </p>
    ),
    link: { to: "/shipping-policy", text: "View Shipping Policy" },
  },
  {
    icon: "bi-arrow-repeat",
    title: "Returns and Refunds",
    body: (
      <p>
        Return requests are reviewed on a case-by-case basis. Refunds or
        exchanges may be arranged where they apply, and the full process is
        explained in our Return Policy.
      </p>
    ),
    link: { to: "/return-policy", text: "View Return Policy" },
  },
  {
    icon: "bi-palette",
    title: "Intellectual Property",
    body: (
      <p>
        The content on the WinterStore website — including the WinterStore logo
        and branding, text, graphics, images and the overall website design —
        may be protected by applicable intellectual-property rights. Unless
        stated otherwise, nothing on the website should be taken as permission
        to copy or reuse that content.
      </p>
    ),
    note: "We do not make claims about the ownership of third-party content that may be referenced or linked from the website.",
  },
  {
    icon: "bi-shield-exclamation",
    title: "Prohibited Activities",
    lead: "To keep WinterStore safe and fair for everyone, the following types of activity are prohibited:",
    list: prohibitedItems.map((item, i) => (
      <li key={i}>
        <i className="bi bi-x-circle"></i>
        {item}
      </li>
    )),
  },
  {
    icon: "bi-exclamation-triangle",
    title: "Limitation of Liability",
    body: (
      <>
        <p>
          To the fullest extent permitted by applicable law, WinterStore's
          liability in connection with the use of the website or the
          information on it is limited. This includes, where the law permits,
          indirect or consequential losses that arise from your use of the
          website.
        </p>
        <p>
          The website currently operates as a frontend/demo project, so please
          use your own judgment and do not treat anything here as formal legal
          advice.
        </p>
      </>
    ),
    noteBox: true,
  },
  {
    icon: "bi-journal-text",
    title: "Changes to Terms",
    body: (
      <p>
        WinterStore may update these Terms &amp; Conditions from time to time
        when the website or our business practices change. When the terms are
        updated, the "Last Updated" date at the top of this page will be
        revised accordingly.
      </p>
    ),
  },
];

const relatedPolicies = [
  {
    icon: "bi-truck",
    title: "Shipping Policy",
    description: "Delivery details and shipping information.",
    to: "/shipping-policy",
    cta: "View Shipping Policy",
  },
  {
    icon: "bi-arrow-repeat",
    title: "Return Policy",
    description: "Returns, refunds and exchanges.",
    to: "/return-policy",
    cta: "View Return Policy",
  },
  {
    icon: "bi-shield-lock",
    title: "Privacy Policy",
    description: "How we handle your information.",
    to: "/privacy-policy",
    cta: "View Privacy Policy",
  },
  {
    icon: "bi-patch-question",
    title: "FAQ",
    description: "Quick answers to common questions.",
    to: "/faq",
    cta: "Visit the FAQ",
  },
];

function Terms() {
  return (
    <main>

      <section className="tm-hero">
        <div className="container">
          <nav className="tm-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Terms &amp; Conditions</span>
          </nav>
          <h1>Terms &amp; Conditions</h1>
          <p>Please review the terms that apply when using WinterStore.</p>
          <span className="tm-date-pill">
            <i className="bi bi-calendar3"></i>
            Last Updated: <strong>[Update Date]</strong>
          </span>
        </div>
      </section>

      <section className="tm-acceptance">
        <div className="container">
          <div className="tm-acceptance-card">
            <div className="tm-acceptance-icon">
              <i className="bi bi-hand-thumbs-up"></i>
            </div>
            <div>
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing or using the WinterStore website, you indicate
                that you accept these Terms &amp; Conditions and agree to be
                guided by them when using the website. If you do not agree with
                any part of these terms, please refrain from using the website.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="tm-grid">
        <div className="container">
          <div className="row g-4">

            {useCardLists.map((card, index) => (
              <div className="col-md-6" key={index}>
                <div className="tm-card">
                  <div className="tm-card-head">
                    <div className="tm-card-icon">
                      <i className={`bi ${card.icon}`}></i>
                    </div>
                    <h2>{card.title}</h2>
                  </div>
                  {card.lead && <p className="tm-card-lead">{card.lead}</p>}
                  <ul className="tm-card-list">
                    {card.list.map((item, i) => (
                      <li key={i}>
                        <i className="bi bi-check-circle"></i>
                        {item}
                      </li>
                    ))}
                  </ul>
                  {card.note && (
                    <p className="tm-card-foot">
                      <i className="bi bi-info-circle"></i>
                      {card.note}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {termsCards.map((card, index) => (
              <div className="col-md-6" key={index}>
                <div className="tm-card">
                  <div className="tm-card-head">
                    <div className="tm-card-icon">
                      <i className={`bi ${card.icon}`}></i>
                    </div>
                    <h2>{card.title}</h2>
                  </div>

                  {card.lead && <p className="tm-card-lead">{card.lead}</p>}
                  {card.body}
                  {card.list && <ul className="tm-card-list">{card.list}</ul>}

                  {card.link && (
                    <Link to={card.link.to} className="tm-card-link">
                      {card.link.text}
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  )}

                  {card.note && (
                    <p className="tm-card-foot">
                      <i className="bi bi-info-circle"></i>
                      {card.note}
                    </p>
                  )}

                  {card.noteBox && (
                    <div className="tm-card-notebox">
                      <i className="bi bi-info-circle"></i>
                      <p>
                        This page is informational and is not official legal
                        advice. If you intend to rely on these terms as the
                        official Terms &amp; Conditions of a live business,
                        they should be reviewed by a qualified legal
                        professional first.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      <section className="tm-contact">
        <div className="container">
          <span className="tm-contact-label">
            <i className="bi bi-chat-left-dots"></i>
            SOMETHING UNCLEAR?
          </span>
          <h2>Questions About These Terms?</h2>
          <p>Contact us if you have questions about these terms.</p>
          <Link to="/contact" className="btn btn-dark btn-lg px-5">
            Contact Us
            <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

      <section className="tm-policies">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span>RELATED POLICIES</span>
            <h2>More Information</h2>
            <p>Browse our policies and help pages for more details.</p>
          </div>

          <div className="row g-4">
            {relatedPolicies.map((policy, index) => (
              <div className="col-md-6 col-lg-3" key={index}>
                <Link to={policy.to} className="tm-policy-card">
                  <div className="tm-policy-icon">
                    <i className={`bi ${policy.icon}`}></i>
                  </div>
                  <h3>{policy.title}</h3>
                  <p>{policy.description}</p>
                  <span className="tm-policy-cta">
                    {policy.cta}
                    <i className="bi bi-arrow-right"></i>
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

export default Terms;