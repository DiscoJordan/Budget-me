import express from "express";
import {
  registerUser,
  updateUser,
  getUser,
  deleteUser,
  loginUser,
  verifyToken,
} from "../controllers/users";

const router = express.Router();

router.post("/reg", registerUser, loginUser);
router.post("/login", loginUser);
router.post("/verify_token", verifyToken);
router.post("/update", updateUser);
router.post("/delete", deleteUser);
router.get("/get/:id", getUser);

export default router;
