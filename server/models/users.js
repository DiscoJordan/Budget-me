const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: false },
  currency:{ type: String, required: true, unique: false, default:'USD'}
});

module.exports = mongoose.model("User", userSchema);