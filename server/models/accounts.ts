import mongoose, { Schema } from "mongoose";
import { IAccount } from "../src/types";

const accountSchema = new Schema<IAccount>({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  icon: {
    color: { type: String, required: false, unique: false, default: "gray" },
    icon_value: { type: String, required: true, default: "wallet-outline" },
  },
  type: { type: String, required: true, unique: false },
  name: { type: String, required: true, unique: false },
  subcategories: [
    {
      subcategory: { type: String, required: false, default: "No subcategory" },
    },
  ],
  balance: { type: Number, required: true, default: 0 },
  initialBalance: { type: Number, required: true, default: 0 },
  currency: { type: String, required: true, default: "USD" },
  budgets: { type: Map, of: Number, default: {} },
  time: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false },
  isMultiAccount: { type: Boolean, default: false },
  isMainSubAccount: { type: Boolean, default: false },
  parentId: { type: Schema.Types.ObjectId, ref: "Account", required: false, default: null },
});

export default mongoose.model<IAccount>("Account", accountSchema);
