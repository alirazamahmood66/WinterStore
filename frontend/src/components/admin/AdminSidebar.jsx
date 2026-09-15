import { Link } from "react-router-dom";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "bi-grid", to: "/admin/dashboard", built: true, section: "Main" },
  { key: "products", label: "Products", icon: "bi-box-seam", to: "/admin/products", built: true, section: "Catalog" },
  { key: "categories", label: "Categories", icon: "bi-tags", to: "/admin/categories", built: true },
  { key: "inventory", label: "Inventory", icon: "bi-clipboard-data", to: "/admin/inventory", built: true },
  { key: "orders", label: "Orders", icon: "bi-bag", to: "/admin/orders", built: true },
  { key: "customers", label: "Customers", icon: "bi-people", to: "/admin/customers", built: true },
  { key: "reviews", label: "Reviews & Feedback", icon: "bi-chat-square-text", to: "/admin/reviews", built: true },
  { key: "coupons", label: "Coupons", icon: "bi-ticket-perforated", to: "/admin/coupons", built: true },
  { key: "reports", label: "Reports", icon: "bi-bar-chart", to: "/admin/reports", built: true },
  { key: "settings", label: "Settings", icon: "bi-gear", to: "/admin/settings", built: true },
];

const LinkItem = ({ item, active, onComingSoon }) =>
  item.built ? (
    <Link to={item.to} className={`admin-side-link ${active === item.key ? "active" : ""}`}>
      <i className={`bi ${item.icon}`}></i>
      <span>{item.label}</span>
      <i className="bi bi-chevron-right admin-side-caret"></i>
    </Link>
  ) : (
    <button type="button" className="admin-side-link" onClick={() => onComingSoon && onComingSoon(item.label)}>
      <i className={`bi ${item.icon}`}></i>
      <span>{item.label}</span>
      <span className="admin-side-badge">Soon</span>
    </button>
  );

function AdminSidebar({ active = "dashboard", onComingSoon, onLogout }) {
  const rows = [];
  let lastSection = null;
  for (const item of NAV_ITEMS) {
    if (item.section && item.section !== lastSection) {
      rows.push(
        <p key={`label-${item.section}`} className="admin-sidebar-label">
          {item.section}
        </p>
      );
      lastSection = item.section;
    }
    rows.push(
      <li key={item.key}>
        <LinkItem item={item} active={active} onComingSoon={onComingSoon} />
      </li>
    );
  }

  return (
    <>
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-logo">W</span>
        <div>
          <strong>WINTERSTORE</strong>
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        <ul className="list-unstyled mb-0">{rows}</ul>
      </nav>

      <div className="admin-sidebar-foot">
        <button type="button" className="admin-side-link" onClick={onLogout}>
          <i className="bi bi-box-arrow-right"></i>
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}

export default AdminSidebar;