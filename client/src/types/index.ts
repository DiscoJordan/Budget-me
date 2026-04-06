// ─── Domain enums ─────────────────────────────────────────────────────────────

export type AccountType = "income" | "personal" | "expense" | "debt";

// ─── Debts feature settings ───────────────────────────────────────────────────

export interface DebtsSettings {
  enabled: boolean;
  includeInPersonalBalance: boolean;
}

export interface DebtsContextType {
  settings: DebtsSettings;
  setEnabled: (v: boolean) => Promise<void>;
  setIncludeInPersonalBalance: (v: boolean) => Promise<void>;
}

// ─── Subdocument shapes ───────────────────────────────────────────────────────

export interface AccountIcon {
  color: string;
  icon_value: string;
}

export interface Subcategory {
  _id?: string;
  /** Client-side uuid used before save */
  id?: string;
  subcategory: string;
}

// ─── Core domain objects (plain JS, returned from API) ───────────────────────

export interface User {
  _id?: string;
  /** id field decoded from JWT token (same as _id) */
  id?: string;
  username: string;
  email: string;
  currency: string;
}

export interface Account {
  _id: string;
  ownerId: string | User;
  icon: AccountIcon;
  type: AccountType;
  name: string;
  subcategories: Subcategory[];
  balance: number;
  initialBalance: number;
  currency: string;
  time?: string;
  archived?: boolean;
  isMultiAccount?: boolean;
  isMainSubAccount?: boolean;
  parentId?: string;
  budgets?: Record<string, number>;
  /** Used locally in Dashboard to render "New account" placeholders */
  title?: string;
}

export interface Transaction {
  _id: string;
  ownerId: string | User;
  senderId: string | Account;
  recipientId: string | Account;
  icon: AccountIcon;
  subcategory: string;
  amount: number;
  currency: string;
  time: string;
  rate: number;
  comment: string;
}

// ─── API response shape ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: unknown;
  token?: string;
  user?: User;
}

// ─── New account / transaction form data ─────────────────────────────────────

export interface AccountFormData {
  name: string;
  subcategories: Subcategory[];
  ownerId?: string;
  type: AccountType | string;
  icon: AccountIcon;
  _id?: string;
  balance?: number;
  currency?: string;
  isMultiAccount?: boolean;
  parentId?: string;
}

export interface TransactionFormData {
  ownerId?: string;
  senderId?: string;
  recipientId?: string;
  comment: string;
  subcategory: string;
  amount: number;
  time?: string;
}

// ─── Context value types ──────────────────────────────────────────────────────

export interface UsersContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  verify_token: () => Promise<void>;
}

export interface AccountsContextType {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  getAccountsOfUser: () => Promise<void>;
  loading: boolean;
  setActiveAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  activeAccount: Account | null;
  setBalance: (senderIdOverride?: string, recipientIdOverride?: string) => Promise<void>;
  deleteSubAccount: (subAccountId: string) => Promise<void>;
  setRecipientAccount: React.Dispatch<React.SetStateAction<Partial<Account>>>;
  recipientAccount: Partial<Account>;
  iconColors: string[];
  getRandomColor: () => void;
  randomColor: string;
  iconValues: string[];
  setAccountData: React.Dispatch<React.SetStateAction<AccountFormData>>;
  accountData: AccountFormData;
  setType: React.Dispatch<React.SetStateAction<string>>;
  type: string;
  createSubcatAlert: () => void;
  addSubcategoryToAccount: (
    accountId: string,
    subcatName: string,
  ) => Promise<void>;
  toggleArchiveAccount: (id: string, archived: boolean) => Promise<void>;
  deleteAllData: () => Promise<boolean>;
}

export interface TransactionsContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  getTransactionsOfUser: () => Promise<void>;
  loading: boolean;
  activeTransaction: Transaction | null;
  setActiveTransaction: React.Dispatch<
    React.SetStateAction<Transaction | null>
  >;
  updateTransaction: (
    id: string,
    fields: Partial<Transaction & { senderId: string; recipientId: string }>,
  ) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  deleteAllTransactions: () => Promise<boolean>;
}

export interface CurrencyContextType {
  currencies: string[];
  rates: Record<string, number>;
  mainCurrency: string;
  setMainCurrency: (currency: string) => Promise<void>;
  loading: boolean;
  lastFetchedAt: number | null;
  refreshCurrencies: () => void;
}
