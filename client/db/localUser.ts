import uuid from "react-native-uuid";
import { getDB } from "./database";
import { User } from "../src/types";

export async function getOrCreateLocalUser(): Promise<User> {
  const db = await getDB();
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
