import { Router } from "express";
import { getStats } from "../controllers/dashboardController.js";
import { getOrders, getOrder, updateOrderStatus, updatePaymentStatus } from "../controllers/orderController.js";
import { getCustomers, getCustomer } from "../controllers/customerController.js";
import { getSettings, updateSettings, updateAdminProfile } from "../controllers/settingsController.js";
import {
  getReviews,
  updateReviewStatus,
  deleteReview,
  getFeedback,
  deleteFeedback,
} from "../controllers/engagementController.js";
import {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { getReports, getReportsExport } from "../controllers/reportController.js";
import { getInventory } from "../controllers/inventoryController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/stats", protect, adminOnly, getStats);
router.get("/orders", protect, adminOnly, getOrders);
router.get("/orders/:id", protect, adminOnly, getOrder);
router.patch("/orders/:id/status", protect, adminOnly, updateOrderStatus);
router.patch("/orders/:id/payment-status", protect, adminOnly, updatePaymentStatus);
router.get("/customers", protect, adminOnly, getCustomers);
router.get("/customers/:id", protect, adminOnly, getCustomer);
router.get("/settings", protect, adminOnly, getSettings);
router.put("/settings", protect, adminOnly, updateSettings);
router.put("/settings/profile", protect, adminOnly, updateAdminProfile);

router.get("/reports/export", protect, adminOnly, getReportsExport);
router.get("/reports", protect, adminOnly, getReports);

router.get("/inventory", protect, adminOnly, getInventory);

router.get("/reviews", protect, adminOnly, getReviews);
router.patch("/reviews/:id/status", protect, adminOnly, updateReviewStatus);
router.delete("/reviews/:id", protect, adminOnly, deleteReview);
router.get("/feedback", protect, adminOnly, getFeedback);
router.delete("/feedback/:id", protect, adminOnly, deleteFeedback);

router.get("/coupons", protect, adminOnly, getCoupons);
router.get("/coupons/:id", protect, adminOnly, getCoupon);
router.post("/coupons", protect, adminOnly, createCoupon);
router.put("/coupons/:id", protect, adminOnly, updateCoupon);
router.delete("/coupons/:id", protect, adminOnly, deleteCoupon);

export default router;