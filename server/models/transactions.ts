import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../src/types";

const transactionSchema = new Schema<ITransaction>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  icon: {
    color: { type: String, required: false, unique: false, default: "gray" },
    icon_value: { type: String, required: false },
  },
  subcategory: { type: String, required: false, default: "" },
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, required: true, default: "USD" },
  time: { type: Date, default: Date.now },
  rate: { type: Number, required: true, default: 1 },
  comment: { type: String, required: false },
});

export default mongoose.model<ITransaction>("Transaction", transactionSchema);
