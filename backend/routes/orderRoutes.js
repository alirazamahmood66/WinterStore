import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, createOrder);
router.get("/", protect, getMyOrders);
router.get("/:id", protect, getMyOrder);

export default router;