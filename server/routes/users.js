const express = require("express");
const router = express.Router();
const {
  registerUser,
  updateUser,
  getUser,
  deleteUser,
  loginUser,
  verifyToken,
} = require("../controllers/users");

// const { verify_token } = require("../middlewares/authMiddleware");

router.post("/reg", registerUser,loginUser); 
router.post("/login", loginUser);
router.post("/verify_token", verifyToken);
router.post("/update", /*verify_token,*/ updateUser);
router.post("/delete", /*verify_token,*/ deleteUser);
router.get("/get/:id", /*verify_token,*/ getUser);

module.exports = router;
