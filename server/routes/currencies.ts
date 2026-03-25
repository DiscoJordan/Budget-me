import express from "express";
import { getCurrencies } from "../controllers/currencies";
import { verify_token } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", verify_token, getCurrencies);

export default router;
