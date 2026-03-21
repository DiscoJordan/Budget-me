import mongoose, { Schema } from "mongoose";
import { IUser } from "../src/types";

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: false },
  currency: { type: String, required: true, unique: false, default: "USD" },
});

export default mongoose.model<IUser>("User", userSchema);
