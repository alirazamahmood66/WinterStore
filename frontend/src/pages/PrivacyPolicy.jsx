import { Link } from "react-router-dom";

const collectItems = [
  "Name",
  "Email address",
  "Phone number",
  "Shipping address",
  "Billing / order information",
  "Account information",
  "Details you provide through contact forms",
];

const useItems = [
  "Processing and delivering your orders",
  "Providing customer support",
  "Managing your account and profile",
  "Improving the website experience",
  "Communicating with you about your orders",
  "Handling returns, refunds and exchanges",
];

const storageItems = [
  { label: "Shopping cart", note: "the items you add while browsing" },
  { label: "Wishlist", note: "the products you save for later" },
  { label: "Demo account & session", note: "a simple, device-only log-in state" },
  { label: "Order history", note: "so your recent orders show on your account" },
];

const privacyCards = [
  {
    icon: "bi-database",
    title: "Information We May Collect",
    body: (
      <p>
        WinterStore only handles the information that is reasonably relevant
        to the functionality of our website. When you browse, register, place
        an order or get in touch, we may handle the following categories:
      </p>
    ),
    list: collectItems.map((item, i) => (
      <li key={i}>
        <i className="bi bi-check-circle"></i>
        {item}
      </li>
    )),
    note: "We keep this limited to what the website actually needs — nothing extra is gathered for its own sake.",
  },
  {
    icon: "bi-gear",
    title: "How Information Is Used",
    body: (
      <p>
        The information provided through the website is used for clear,
        practical purposes that support your shopping experience:
      </p>
    ),
    list: useItems.map((item, i) => (
      <li key={i}>
        <i className="bi bi-check-circle"></i>
        {item}
      </li>
    )),
    note: "We do not sell or rent personal information to third parties.",
  },
  {
    icon: "bi-credit-card",
    title: "Payment Information",
    body: (
      <>
        <p>
          Orders on WinterStore are currently paid for via Cash on Delivery,
          so no online payment details are required at checkout. If online
          payment is introduced in the future, payment information is intended
          to be handled through secure payment providers rather than stored by
          the website itself.
        </p>
        <div className="pp-card-note">
          <i className="bi bi-shield-check"></i>
          <p>
            WinterStore does not store complete payment card details, such as
            card numbers, CVV codes or expiry dates.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: "bi-cookie",
    title: "Cookies / Local Storage",
    body: (
      <p>
        WinterStore is a React frontend application that does not currently
        set tracking cookies or run analytics. The application may use your
        browser's local storage — a type of storage built into your browser —
        to keep basic frontend state such as:
      </p>
    ),
    list: storageItems.map((item, i) => (
      <li key={i}>
        <i className="bi bi-hdd"></i>
        <span>
          <strong>{item.label}</strong> — {item.note}
        </span>
      </li>
    )),
    note: "This data stays in your browser on your device and can be cleared at any time through your browser's settings.",
  },
  {
    icon: "bi-shield-check",
    title: "Data Security",
    body: (
      <>
        <p>
          WinterStore applies reasonable security practices to help protect
          the information handled by the website. Frontend data such as your
          cart, wishlist and demo account are kept on your own device, and any
          account-related data is treated with sensible access controls.
        </p>
        <p>
          No method of storage or data handling is completely secure, so we
          recommend you use a strong, unique password and keep your device
          protected.
        </p>
      </>
    ),
  },
  {
    icon: "bi-link-45deg",
    title: "Third-Party Services",
    body: (
      <>
        <p>
          WinterStore does not currently use third-party analytics or payment
          processors as part of this demo website.
        </p>
        <p>
          If third-party services — such as payment providers or analytics
          tools — are added in the future, they will have their own privacy
          policies, and any information you provide to them will be subject to
          those policies.
        </p>
      </>
    ),
  },
  {
    icon: "bi-clock-history",
    title: "Data Retention",
    body: (
      <>
        <p>
          Information may be retained as long as it is necessary for the
          orders you place, your account, customer support requests and
          legitimate business or legal purposes.
        </p>
        <p>
          When information is no longer needed, reasonable steps are taken to
          remove or update it where applicable.
        </p>
      </>
    ),
  },
  {
    icon: "bi-person-check",
    title: "User Rights",
    body: (
      <>
        <p>
          To the extent applicable, you may be able to request access to
          information WinterStore holds about you, ask for it to be corrected,
          or request that it be deleted or removed where appropriate.
        </p>
        <p>
          You can also clear the data stored in your browser's local storage at
          any time through your browser settings or by using the contact
          section below.
        </p>
      </>
    ),
  },
  {
    icon: "bi-people",
    title: "Children's Privacy",
    body: (
      <p>
        WinterStore is not intentionally designed to collect unnecessary
        personal information from children. We do not knowingly target the
        collection of information at children. If you believe a child has
        provided personal information through the website, please contact us
        and we will review the matter.
      </p>
    ),
  },
  {
    icon: "bi-file-earmark-text",
    title: "Policy Updates",
    body: (
      <p>
        This privacy policy may be updated from time to time when the website
        or WinterStore's business practices change. When the policy is
        updated, the "Last Updated" date at the top of this page will be
        revised accordingly.
      </p>
    ),
  },
];

function PrivacyPolicy() {
  return (
    <main>

      <section className="pp-hero">
        <div className="container">
          <nav className="pp-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <i className="bi bi-chevron-right"></i>
            <span>Privacy Policy</span>
          </nav>
          <h1>Privacy Policy</h1>
          <p>Learn how WinterStore handles information provided through our website.</p>
        </div>
      </section>

      <section className="pp-intro">
        <div className="container">
          <div className="pp-intro-card">
            <span className="pp-date-pill">
              <i className="bi bi-calendar3"></i>
              Last Updated: <strong>[Update Date]</strong>
            </span>

            <div className="section-heading mb-3">
              <span>OUR PRIVACY PROMISE</span>
              <h2>Introduction</h2>
            </div>

            <p>
              WinterStore respects your privacy. This policy explains, in
              plain language, how information provided through our website
              may be handled.
            </p>
            <p>
              It applies to the information you share when you browse our
              products, create an account, place an order or get in touch
              with our support team.
            </p>

            <div className="pp-info-note">
              <i className="bi bi-info-circle"></i>
              <p>
                This page is provided for general information and is not
                intended as legal advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pp-grid">
        <div className="container">
          <div className="row g-4">

            {privacyCards.map((card, index) => (
              <div className="col-md-6" key={index}>
                <div className="pp-card">
                  <div className="pp-card-head">
                    <div className="pp-card-icon">
                      <i className={`bi ${card.icon}`}></i>
                    </div>
                    <h2>{card.title}</h2>
                  </div>

                  {card.body}
                  {card.list && <ul className="pp-card-list">{card.list}</ul>}
                  {card.note && (
                    <p className="pp-card-foot">
                      <i className="bi bi-info-circle"></i>
                      {card.note}
                    </p>
                  )}
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      <section className="pp-contact">
        <div className="container">
          <span className="pp-contact-label">
            <i className="bi bi-chat-heart"></i>
            WE'RE HERE TO HELP
          </span>
          <h2>Questions About Privacy?</h2>
          <p>
            Reach out to our support team and we'll be happy to help.
          </p>
          <Link to="/contact" className="btn btn-dark btn-lg px-5">
            Contact Us
            <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

    </main>
  );
}

export default PrivacyPolicy;