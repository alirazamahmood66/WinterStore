import { Router } from "express";
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  logoutUser,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.post("/logout", protect, logoutUser);

export default router;