import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("budgetme.db");
  }
  return db;
}

export async function initDB(): Promise<void> {
  const database = await getDB();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_user (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL DEFAULT 'Local User',
      currency TEXT NOT NULL DEFAULT 'USD'
    );

    CREATE TABLE IF NOT EXISTS accounts (
      _id TEXT PRIMARY KEY,
      ownerId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      initialBalance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      icon_color TEXT NOT NULL DEFAULT '#717171',
      icon_value TEXT NOT NULL DEFAULT 'credit-card-outline',
      subcategories TEXT NOT NULL DEFAULT '[]',
      archived INTEGER NOT NULL DEFAULT 0,
      isMultiAccount INTEGER NOT NULL DEFAULT 0,
      isMainSubAccount INTEGER NOT NULL DEFAULT 0,
      parentId TEXT,
      budgets TEXT,
      time TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      _id TEXT PRIMARY KEY,
      ownerId TEXT NOT NULL,
      senderId TEXT NOT NULL,
      recipientId TEXT NOT NULL,
      icon_color TEXT NOT NULL DEFAULT '#717171',
      icon_value TEXT NOT NULL DEFAULT 'credit-card-outline',
      subcategory TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      time TEXT NOT NULL,
      rate REAL NOT NULL DEFAULT 1,
      comment TEXT NOT NULL DEFAULT ''
    );
  `);
}
