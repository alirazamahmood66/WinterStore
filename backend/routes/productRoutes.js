import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { getProductReviews } from "../controllers/reviewController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.get("/:id/reviews", getProductReviews);

router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;