# Budget-me — Project Plan

## Overview

Full-stack personal finance app (React Native + Expo / Express.js / MongoDB).
Target feature parity with "БюджетОК" by Timofei Voropaev.

## Architecture

```
client/   — React Native (Expo)
server/   — Express.js + Mongoose
```

### Account Types
- **income** — salary, passive income sources (money flows OUT of these into personal)
- **personal** — wallets, bank cards (money moves between these and expense accounts)
- **expense** — car, flat, grocery (money flows INTO these from personal)

### Transaction Logic
- income → personal (receiving salary)
- personal → expense (spending money)
- personal → personal (transfer between wallets)
- Balance is recalculated from all transactions + initialBalance on every create/delete

---

## Principles

- **SOLID** — single responsibility per module, depend on abstractions
- **KISS** — simplest solution that works
- **DRY** — shared types, utilities, validation schemas reused across client/server
- **TDD** — write tests first, then implementation

---

## Tech Stack (target)

| Layer | Current | Target |
|---|---|---|
| Client language | JS | TypeScript |
| Server language | JS | TypeScript |
| Client state | React Context | React Context + custom hooks (typed) |
| Server framework | Express.js | Express.js + typed controllers |
| Validation | none | Zod (shared schemas) |
| Testing (server) | none | Jest + Supertest |
| Testing (client) | none | Jest + React Native Testing Library |
| Auth | JWT (basic) | JWT + refresh tokens |

---

## Known Bugs (current state)

### Server
1. **`setBalance` bug** — `recipientAccount.balance` uses `senderAccount.initialBalance` instead of `recipientAccount.initialBalance` (`accounts.js:148`)
2. **Exposed DB credentials** — MongoDB connection string with password hardcoded in `server/index.js:14` — must move to `.env`
3. **`getTransaction` populate syntax** — `populate("ownerId",'senderId','recipientId')` is wrong; should be `populate(["ownerId","senderId","recipientId"])` (`transactions.js:104`)
4. **`deleteTransaction` does not recalculate balances** — after deleting a transaction, affected account balances are never updated
5. **`updateTransaction`/`deleteTransaction` not exported** — defined in controller but not in `module.exports` (`transactions.js:136`)
6. **No auth middleware** on accounts/transactions routes — any user can read/modify any other user's data
7. **`rate` field type mismatch** — defined as `String` but default is number `1` in transaction model

### Client
1. **`Number.prototype.format` defined inside components** — defined twice (Dashboard.js, NewOperation.js), pollutes global prototype, should be a standalone utility
2. **`Alert.prompt` iOS-only** — `createSubcatAlert` uses `Alert.prompt` which doesn't exist on Android
3. **`activeAccount` initialized as array `[]`** — should be `{}` or `null` (`AccountsContext.js:13`)
4. **`randomColor` not reactive** — computed outside component state, does not trigger re-renders consistently
5. **`getRandomColor` references `accountData` before it is declared** — state initialization order issue in `AccountsContext.js`
6. **`justifyContent: "start"`** — invalid React Native value in `Dashboard.js:172`, should be `"flex-start"`
7. **Transaction `icon` not set on create** — `NewOperation.handleSubmit` never sends `icon` field
8. **`recipientAccount.balance` displayed without `.format()`** in `NewOperation.js:221`
9. **Missing navigation routes** — `Account`, `Add new account`, `NewOperation` screens referenced but navigation structure needs audit
10. **`modalVisible` state declared but never used** in `NewOperation.js`

---

## Roadmap

### Phase 1 — Bug Fixes (before TS migration)
- [x] Fix `setBalance` balance calculation bug
- [x] Move DB credentials to `.env`, add `.env.example`
- [x] Fix `getTransaction` populate call
- [x] Add balance recalculation after `deleteTransaction`
- [x] Export missing transaction controller functions
- [x] Add auth middleware to all protected routes
- [x] Fix `rate` field type in transaction model
- [x] Extract `Number.format` to shared utility
- [ ] Replace `Alert.prompt` with cross-platform custom modal
- [x] Fix `activeAccount` initial state to `null`
- [x] Fix `justifyContent: "start"` → `"flex-start"`
- [x] Send `icon` in transaction create
- [x] Fix `recipientAccount.balance` formatting
- [ ] Audit and fix navigation stack

### Phase 2 — TypeScript Migration
- [x] Add `tsconfig.json` to both `client/` and `server/`
- [x] Migrate server models → typed interfaces
- [x] Migrate server controllers one by one (accounts, transactions, users)
- [x] Migrate client contexts (UsersContext, AccountsContext, TransactionsContext)
- [x] Migrate screens one by one
- [ ] Add Zod schemas for all API request/response bodies (shared types)

### Phase 3 — TDD & Test Coverage
- [ ] Set up Jest + Supertest for server
- [ ] Unit tests for `updateBalance` logic
- [ ] Integration tests for all API endpoints (accounts CRUD, transactions CRUD)
- [ ] Set up Jest + RNTL for client
- [ ] Unit tests for context hooks
- [ ] Component tests for critical screens (Dashboard, NewOperation)

### Phase 4 — Feature Completion (БюджетОК parity)

#### Transactions
- [ ] Transaction history screen (grouped by date)
- [ ] Edit transaction
- [ ] Delete transaction (with balance recalculation)
- [ ] Transaction icon auto-select (sender icon if income, recipient icon if personal sender)
- [ ] Currency rate support for cross-currency transactions

#### Accounts
- [ ] Account detail screen — show transaction list for account
- [ ] Edit account (name, icon, color, subcategories)
- [ ] Delete account (cascade delete transactions + recalculate)
- [ ] Initial balance set on creation

#### Reports
- [ ] Monthly summary: income vs expense
- [ ] Pie chart by expense category
- [ ] Bar chart by month
- [ ] Filter by date range

#### Settings
- [ ] Change default currency
- [ ] Change username / password
- [ ] Logout
- [ ] Delete account (user)

#### Auth
- [ ] JWT refresh tokens
- [ ] Persistent login (AsyncStorage token)
- [ ] Auto-logout on token expiry

### Phase 5 — Agent Team Setup
Specialized Claude agents for parallel work:
- **BackendAgent** — Express/Mongoose, controllers, routes, tests
- **FrontendAgent** — React Native screens, navigation, styling
- **TypesAgent** — shared Zod schemas, TypeScript interfaces
- **TestAgent** — writes tests before implementation (TDD lead)
- **ReviewAgent** — code review, SOLID/KISS/DRY compliance checks

---

## File Structure (target)

```
client/
  src/
    components/       # reusable UI components
    screens/          # screen components
    context/          # React contexts + hooks
    navigation/       # navigation configuration
    utils/            # formatNumber, etc.
    types/            # TypeScript types (shared with server via symlink or package)
    api/              # axios calls per domain (accounts.api.ts, etc.)
  App.tsx

server/
  src/
    controllers/      # request handlers
    models/           # Mongoose schemas + interfaces
    routes/           # Express routers
    middlewares/      # auth, error handling, validation
    services/         # business logic (balance calculation, etc.)
    utils/
    types/
  index.ts
```

---

## Agent Instructions

When starting a task:
1. Read the relevant section of this file first
2. Check the bug list — fix bugs in Phase 1 before adding features
3. Write tests before implementation (TDD)
4. Follow SOLID: one responsibility per file, no god objects
5. Follow DRY: if logic exists, reuse it; check `utils/` and `services/` first
6. Follow KISS: simplest correct solution, no speculative abstraction
7. After completing a task, update the checklist in this file
