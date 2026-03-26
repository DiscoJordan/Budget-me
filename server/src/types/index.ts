import { Document, Types } from "mongoose";
import { Request } from "express";

// ─── Domain enums ────────────────────────────────────────────────────────────

export type AccountType = "income" | "personal" | "expense";

// ─── Subdocument shapes ───────────────────────────────────────────────────────

export interface AccountIcon {
  color: string;
  icon_value: string;
}

export interface Subcategory {
  _id?: Types.ObjectId;
  /** Client-side uuid used before save */
  id?: string;
  subcategory: string;
}

// ─── Mongoose document interfaces ────────────────────────────────────────────

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  currency: string;
}

export interface IAccount extends Document {
  ownerId: Types.ObjectId;
  icon: AccountIcon;
  type: AccountType;
  name: string;
  subcategories: Subcategory[];
  balance: number;
  initialBalance: number;
  currency: string;
  time: Date;
  archived?: boolean;
  isMultiAccount?: boolean;
  isMainSubAccount?: boolean;
  parentId?: Types.ObjectId;
}

export interface ITransaction extends Document {
  ownerId: Types.ObjectId;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  icon: AccountIcon;
  subcategory: string;
  amount: number;
  currency: string;
  time: Date;
  rate: number;
  comment: string;
}

// ─── API response shape ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: unknown;
}

// ─── Augmented Express Request ────────────────────────────────────────────────
// The auth middleware attaches _id, username, token to the request object.

export interface AuthRequest extends Request {
  _id?: string;
  username?: string;
  token?: string;
}
