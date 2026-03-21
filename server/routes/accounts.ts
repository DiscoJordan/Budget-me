import express from "express";
import {
  addAccount,
  getAllAccounts,
  setBalance,
  updateAccount,
  deleteAccount,
} from "../controllers/accounts";
import { verify_token } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/addaccount", verify_token, addAccount);
router.post("/updateaccount", verify_token, updateAccount);
router.post("/setBalance", verify_token, setBalance);
router.post("/deleteaccount", verify_token, deleteAccount);
router.get("/getall/:id", verify_token, getAllAccounts);

export default router;
