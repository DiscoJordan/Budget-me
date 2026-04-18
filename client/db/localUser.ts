import uuid from "react-native-uuid";
import { getDB } from "./database";
import { User } from "../src/types";
import { upsertAccount } from "./accountsDb";

const DEFAULT_EXPENSE_ACCOUNTS = [
  { name: "Clothes",       icon: { icon_value: "hanger",              color: "#DE36B7" } },
  { name: "Food",          icon: { icon_value: "food",                color: "#FF8824" } },
  { name: "Taxes",         icon: { icon_value: "bank-outline",        color: "#00438F" } },
  { name: "Vehicle",       icon: { icon_value: "car",                 color: "#717171" } },
  { name: "Health",        icon: { icon_value: "heart",               color: "#FF7070" } },
  { name: "Groceries",     icon: { icon_value: "cart",                color: "#58D41E" } },
  { name: "Beauty",        icon: { icon_value: "flower-outline",      color: "#B46DFF" } },
  { name: "Entertainment", icon: { icon_value: "movie-open-play",     color: "#FFBD24" } },
  { name: "Travelling",    icon: { icon_value: "airplane",            color: "#0077FF" } },
  { name: "Transport",     icon: { icon_value: "bus",                 color: "#2CBDAB" } },
];

const DEFAULT_PERSONAL_ACCOUNTS = [
  { name: "Cash", icon: { icon_value: "cash",        color: "#58D41E" } },
  { name: "Card", icon: { icon_value: "credit-card", color: "#0077FF" } },
];

const DEFAULT_INCOME_ACCOUNTS = [
  { name: "Salary", icon: { icon_value: "briefcase", color: "#FFBD24" } },
];

export async function getOrCreateLocalUser(): Promise<User> {
  const db = await getDB();
  // DEV ONLY: reset local user to re-trigger default account seeding — remove after testing
  await db.runAsync("DELETE FROM local_user");
  await db.runAsync("DELETE FROM accounts");
  // END DEV ONLY
  const rows = await db.getAllAsync<{ id: string; username: string; currency: string }>(
    "SELECT * FROM local_user LIMIT 1"
  );

  if (rows.length > 0) {
    const row = rows[0];
    return { id: row.id, _id: row.id, username: row.username, email: "", currency: row.currency };
  }

  const newId = uuid.v4() as string;
  await db.runAsync(
    "INSERT INTO local_user (id, username, currency) VALUES (?, ?, ?)",
    [newId, "Local User", "USD"]
  );
  await Promise.all([
    ...DEFAULT_EXPENSE_ACCOUNTS.map((acc) =>
      upsertAccount({
        _id: uuid.v4() as string,
        ownerId: newId,
        type: "expense",
        name: acc.name,
        icon: acc.icon,
        subcategories: [],
        balance: 0,
        initialBalance: 0,
        currency: "USD",
        archived: false,
        isMultiAccount: false,
        isMainSubAccount: false,
      })
    ),
    ...DEFAULT_PERSONAL_ACCOUNTS.map((acc) =>
      upsertAccount({
        _id: uuid.v4() as string,
        ownerId: newId,
        type: "personal",
        name: acc.name,
        icon: acc.icon,
        subcategories: [],
        balance: 0,
        initialBalance: 0,
        currency: "USD",
        archived: false,
        isMultiAccount: false,
        isMainSubAccount: false,
      })
    ),
    ...DEFAULT_INCOME_ACCOUNTS.map((acc) =>
      upsertAccount({
        _id: uuid.v4() as string,
        ownerId: newId,
        type: "income",
        name: acc.name,
        icon: acc.icon,
        subcategories: [],
        balance: 0,
        initialBalance: 0,
        currency: "USD",
        archived: false,
        isMultiAccount: false,
        isMainSubAccount: false,
      })
    ),
  ]);
  return { id: newId, _id: newId, username: "Local User", email: "", currency: "USD" };
}

export async function updateLocalUser(fields: Partial<Pick<User, "username" | "currency">>): Promise<void> {
  const db = await getDB();
  const user = await getOrCreateLocalUser();
  const username = fields.username ?? user.username;
  const currency = fields.currency ?? user.currency;
  await db.runAsync(
    "UPDATE local_user SET username = ?, currency = ? WHERE id = ?",
    [username, currency, user.id!]
  );
}
