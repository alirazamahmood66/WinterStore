# AGENTS.md

## PROJECT OVERVIEW

WinterStore — React (Vite) + Express + MySQL winter wear ecommerce site.

**Frontend:** C:\WinterStore\frontend (port 5173)
**Backend:** C:\WinterStore\backend (port 5000)

## DONE

### Session: Full Product Image Accuracy Audit & Safe Image Fix

**Date:** 2026-09-14

**What was done:**
- Audited all 70 products and 70 product_images against product names, categories, and genders
- Found 4 incorrect image mappings: adult-woman/adult-man images on kids products (products 40, 42, 45, 46), confirmed by developer labels in frontend JSX
- Corrected all 4 mappings to existing verified kids-winter-clothing images (photo-1503944583220, photo-1519238263530 — both already used on other kids products)
- Verified: product count unchanged (70), product_images unchanged (70), all 70 image URLs HTTP 200, API returns 70 products with correct images, category filtering works, npm run build succeeds, browser test shows 0 broken images and 0 console errors across all pages
- No source files changed; only 4 rows in `product_images` DB table updated
- 36 products marked AMBIGUOUS — needs human visual review (this model session had no image input support)

**Files changed:** None in application source. DB-only: `product_images` rows for product_id 40, 42, 45, 46
**Backup:** C:\WinterStore\backend\_image_fix_backup.json

### Session: Duplicate Product Image Fix (7 groups, 13 products)

**Date:** 2026-09-14

**What was done:**
- Audited all 70 product_images; found 7 duplicate-URL groups spanning 20 products (57 unique URLs / 70 images). `product_images` has no UNIQUE constraint on image, so duplicate rows existed.
- Kept the first product in each group, assigned 13 products a unique, verified Unsplash photo (HTTP 200, not used by any other product) matching the product type/gender where possible:
  - Scarves (2): p31 Men's Classic Wool Scarf, p33 Women's Wool Scarf
  - Kids winter accessories (1): p51 Kids Winter Beanie & Scarf Set
  - Kids hoodies/sweaters (3): p40 Kids Sherpa Fleece Hoodie, p44 Kids Cozy Fleece Sweatshirt, p46 Kids Half-Zip Winter Pullover
  - Kids jackets/coats (4): p39 Kids Puffer Winter Jacket, p41 Kids Quilted Winter Coat, p42 Kids Cable Knit Sweater, p45 Kids Wool Blend Winter Coat
  - Women (2): p37 Women's Winter Cardigan, p38 Women's Fleece Hoodie
  - Men belts (1): p63 Everyday Leather Belt
- Verified: counts unchanged (70 products / 70 product_images), 0 remaining duplicate groups, all 70 image URLs HTTP 200, API returns 70 unique images, `npm run build` succeeds, browser QA shows 0 broken images + 0 console errors on all pages.
- No source files changed; only 13 rows in `product_images` DB table updated.

**Files changed:** None in application source. DB-only: `product_images` rows for product_id 31, 33, 37, 38, 39, 40, 41, 42, 44, 45, 46, 51, 63
**Backup:** C:\WinterStore\backend\_image_fix_backup_3.json (script: `_fix_images_3.mjs`; verifier: `_verify_images_3.mjs`)

### Session: Reviews & Feedback, Coupons, Reports — Admin Pages

**Date:** 2026-09-14

**What was done:**
- Created `engagementController.js`: GET /reviews (paged, status/search/rating filters, counts), PATCH /reviews/:id/status (transaction + product rating recalc), DELETE /reviews/:id, GET /feedback (paged, rating/search filters, distribution summary), DELETE /feedback/:id
- Created `couponController.js`: GET /coupons, GET /coupons/:id, POST /coupons, PUT /coupons/:id, DELETE /coupons/:id — codes uppercased/dash-normalized, 3-month default expiry, duplicate-code → 409
- Created `reportController.js`: GET /reports?period=7|30|90|365 — summary, revenueByDay, ordersByStatus, paymentMethods, topProducts, topCategories, salesByGender, monthly, customersByMonth, totalCustomers
- Wired all routes in `adminRoutes.js` behind protect + adminOnly; updated `customerController.getCustomer` to return addresses
- Created `AdminReviews.jsx`: Reviews & Feedback tabs, summary chips, filters, approve/reject/status-change modal, feedback detail modal, delete confirmation modal
- Created `AdminCoupons.jsx`: summary chips, search/status filters, view/edit/add modals with all form fields, delete confirmation modal; codes saved uppercase
- Created `AdminReports.jsx`: period selector, stat cards, daily revenue CSS bar chart (no chart library), orders-by-status, payment methods, top products, top categories, sales by gender, monthly performance, customer growth
- Added "Saved Addresses" section to `AdminCustomers.jsx` detail modal (`.admin-address-card`)
- Added all new admin CSS classes to `index.css` (status grid, stars, engage tabs/filters, comment clip, feedback bars, coupon code, chart bars, address cards, stat notes)
- Updated `App.jsx` routes and `AdminSidebar.jsx` NAV_ITEMS (9 items total: Dashboard, Categories, Products, Orders, Customers, Reviews & Feedback, Coupons, Reports, Settings)

**DB seeded (test data):** Reviews: 2 (id 4 = rejected, id 5 = approved). Coupons: 3 (WINTER20 20% active, FLAT500 ₨500 expired, SALE10 10% inactive — OLDBOX deleted during QA). Addresses: 1 (Ali Raza Mahmood, Gulshan-e-Iqbal Karachi 75300).

**Files created:** `backend/controllers/engagementController.js`, `backend/controllers/couponController.js`, `backend/controllers/reportController.js`
**Files modified:** `backend/routes/adminRoutes.js`, `backend/controllers/customerController.js`, `frontend/src/pages/AdminReviews.jsx`, `frontend/src/pages/AdminCoupons.jsx`, `frontend/src/pages/AdminReports.jsx`, `frontend/src/pages/AdminCustomers.jsx`, `frontend/src/App.jsx`, `frontend/src/components/admin/AdminSidebar.jsx`, `frontend/src/index.css`

**Verified:** All 3 pages render with correct data; zero console errors; zero failed requests across all new pages; coupon CRUD round-trip works (create/update/delete via API); review status-change modal opens and submits successfully (round-trip tested: approved → rejected); delete confirmation modal opens and closes; customer detail modal shows Saved Addresses with seeded data; reports period select re-renders; `node --check` all backend files OK; `npm run build` passes.

**Known:** ESLint `react-hooks/set-state-in-effect` (from `setMobileOpen(false)` in `useEffect`) already present on all existing admin pages — new pages keep same pattern; not a new regression. Coupon/customer-side checkout validation NOT built (scope was admin CRUD only).

**DB config:** host 127.0.0.1, port 3306, user root, no password, database `winterstore`
**mysql CLI unavailable** — use Node `mysql2/promise` for DB queries (module available in backend/node_modules)
