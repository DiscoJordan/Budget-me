import express from "express";
import { getCurrencies } from "../controllers/currencies";
// import { verify_token } from "../middlewares/authMiddleware";

const router = express.Router();

// ─── OFFLINE-FIRST: currency rates are public data, no auth needed ───────────
router.get("/", getCurrencies);

export default router;
