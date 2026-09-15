import { Router } from "express";
import {
  getHealth,
  getDatabaseHealth,
} from "../controllers/healthController.js";

const router = Router();

router.get("/", getHealth);
router.get("/db", getDatabaseHealth);

export default router;