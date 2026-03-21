import express from "express";
import {
  addTransaction,
  getAllTransactions,
  getTransaction,
  deleteTransaction,
  updateAccount,
} from "../controllers/transactions";
import { verify_token } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/addTransaction", verify_token, addTransaction);
router.get("/getall/:id", verify_token, getAllTransactions);
router.get("/get/:transactionId", verify_token, getTransaction);
router.post("/deleteTransaction", verify_token, deleteTransaction);
router.post("/updateTransaction", verify_token, updateAccount);

export default router;
