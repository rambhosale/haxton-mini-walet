# Mini Wallet Application

A transactional ledger system featuring a frontend dashboard built with **TanStack Start** and an Express backend using **Prisma ORM** with **SQLite**. The system is built inside a monorepo managed by **pnpm workspaces** and **Turbo**.

## 🚀 Key Features
- **Ledger Architecture**: Ensures atomic, consistent transaction recording using credit and debit entries.
- **Strict Idempotency**: Guarantees that duplicate requests do not lead to duplicate charges or transfers using UUID transaction keys.
- **Search-Enabled Selectors**: Searchable dropdowns for wallet accounts to prevent errors.
- **Modern Responsive Dashboard**: Clean UI with state transitions, active sync, and live details refresh.

---

## 🛠️ Tech Stack
- **Frontend Framework**: [TanStack Start](https://tanstack.com/start) (React 19, Vite, TanStack Router)
- **Backend Framework**: [Express](https://expressjs.com/)
- **ORM / Database**: [Prisma](https://www.prisma.io/) with [SQLite](https://www.sqlite.org/) (via `better-sqlite3`)
- **Monorepo Manager**: [pnpm Workspaces](https://pnpm.io/workspaces) & [Turborepo](https://turbo.build/)
- **Linter & Formatter**: [Biome](https://biomejs.dev/)

---

## 📋 Prerequisites
Ensure you have the following installed on your local machine:
- **Node.js** (v22 or later recommended)
- **pnpm** (v11 or later)
- **Docker** & **Docker Compose** (optional, for running via containers)

---

## ⚙️ Local Development Setup

Follow these steps to run the application locally outside of Docker.

### 1. Install Dependencies
Run this in the root directory to install all monorepo packages:
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy or create the environment files for both apps if they are not already set.

#### Backend (`apps/be/.env.local`):
```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="a35a4ed0661c8f7897d3ddc9ee40a5f992a1cbabefad8eadb7ad6d5620cc61ec"
BETTER_AUTH_URL="http://localhost:3001"
PORT=3001
```

#### Frontend (`apps/web/.env.local`):
```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="a35a4ed0661c8f7897d3ddc9ee40a5f992a1cbabefad8eadb7ad6d5620cc61ec"
```

### 3. Initialize the Database
Generate the Prisma Client and sync the schema to create/initialize the SQLite database:

**For local development:**
```bash
# Generate the Prisma client
pnpm --filter be db:generate

# Sync the database schema (this automatically creates apps/be/dev.db if it doesn't exist)
pnpm --filter be db:push
```

**For Docker Compose development:**
```bash
# Sync the database schema directly inside the running backend container
docker compose exec be pnpm --filter be db:push
```

> [!IMPORTANT]
> The SQLite database file must be created and schema-synchronized at `apps/be/dev.db` for the application to function. If the database does not exist or has not been initialized with `pnpm --filter be db:push` (or `docker compose exec be pnpm --filter be db:push` when running in Docker), the frontend dashboard will display a descriptive error message explaining the issue and instructing you on how to resolve it.

### 4. Start Development Servers
Start both the backend and frontend development servers concurrently using Turborepo:
```bash
pnpm turbo dev
```
Alternatively, you can run them individually in separate terminals:
```bash
# Start backend only (runs on http://localhost:3001)
pnpm --filter be dev

# Start frontend only (runs on http://localhost:3000)
pnpm --filter web dev
```

Once started, open [http://localhost:3000](http://localhost:3000) in your browser to access the dashboard.

---

## 🐳 Running with Docker Compose

To run the entire stack in containers:

1. Make sure Docker is running on your machine.
2. Build and start the containers using:
   ```bash
   docker compose up --build
   ```
3. Access the services at:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)

> [!NOTE]
> Local workspace directories are mounted inside the Docker containers to enable hot-reloading (HMR) for both the backend and frontend.

---

## 💡 Using the Application

Here is a guide on how to interact with the Mini Wallet Dashboard:

### 1. Register a Wallet Account
- In the **Create Account** card (bottom left):
  - Enter a unique **Account ID** (e.g. `user_alice` or `acc_123`).
  - Specify an optional **Initial Deposit** amount.
  - Click **Register Account**.
- The new wallet will immediately populate in the dropdown lists.

### 2. View Wallet Details & Ledger History
- In the **Select Wallet** card (top left):
  - Choose your active wallet from the search-enabled dropdown.
- Once selected:
  - The **Available Funds** card will display the current synchronized balance.
  - The **Ledger Entries** table will list all transactions (debit/credit) associated with this account.
  - You can manually refresh these details at any time using the sync button in the balance card.

### 3. Transfer Funds
- Make sure you have selected a source wallet (under **Select Wallet**).
- Under the **Transfer Funds** panel:
  - Select a **Destination Account** from the dropdown (this list automatically filters out the source wallet).
  - Enter the transfer **Amount**.
  - Click **Execute Transfer**.
- Once completed successfully, the ledger entries and available balance will auto-update.

### 4. Verification of Idempotency
- When you initiate a transfer, a unique transaction UUID is generated on the client.
- If the exact same request payload is sent again (due to double-clicks or network retries), the backend identifies the idempotency key, returns the cached transaction success state, and prevents multiple deductions.

---

## 🔍 Codebase Structure
```
├── apps/
│   ├── be/                # Express backend
│   │   ├── prisma/        # Database schema
│   │   └── src/           # Controllers, routes, and services
│   └── web/               # TanStack Start frontend
│       └── src/           # Dashboard components, pages, and API clients
├── packages/
│   ├── shared-types/      # TypeScript interfaces shared between frontend & backend
│   ├── eslint-config/     # Shared lint rules
│   └── tsconfig/          # Shared typescript configurations
├── docker-compose.yml     # Docker configuration for local environment setup
└── turbo.json             # Turborepo task pipeline configuration
```

---

## 🔌 API Documentation

All backend endpoints are prefixed with `/api`.

### 1. Register Wallet
* **Endpoint**: `POST /api/wallets`
* **Request Body**:
  ```json
  {
    "accountId": "string (required, unique)",
    "initialBalance": "number (optional, defaults to 0)"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": "uuid-string",
    "accountId": "user_alice",
    "balance": 100,
    "createdAt": "2026-06-08T06:20:00.000Z"
  }
  ```

### 2. List All Wallets
* **Endpoint**: `GET /api/wallets`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid-string",
      "accountId": "user_alice",
      "balance": 100,
      "createdAt": "2026-06-08T06:20:00.000Z"
    }
  ]
  ```

### 3. Get Account Balance
* **Endpoint**: `GET /api/wallets/:accountId/balance`
* **Success Response (200 OK)**:
  ```json
  {
    "accountId": "user_alice",
    "balance": 100
  }
  ```

### 4. Get Ledger History
* **Endpoint**: `GET /api/wallets/:accountId/history`
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid-string",
      "transactionId": "uuid-string",
      "accountId": "user_alice",
      "counterpartyId": "user_bob",
      "type": "DEBIT",
      "amount": 50,
      "createdAt": "2026-06-08T06:30:00.000Z"
    }
  ]
  ```

### 5. Transfer Funds (Idempotent)
* **Endpoint**: `POST /api/wallets/transfer`
* **Request Body**:
  ```json
  {
    "transactionId": "uuid-string (required, unique per transaction)",
    "fromAccountId": "string (required)",
    "toAccountId": "string (required)",
    "amount": "number (required, positive)"
  }
  ```
* **Success Response (200 OK / 201 Created)**:
  ```json
  {
    "success": true,
    "transactionId": "uuid-string"
  }
  ```

---

## 🧠 Design Decisions

- **Monorepo Architecture (pnpm Workspaces)**: The project is structured as a monorepo where the frontend (`apps/web`), backend (`apps/be`), and shared libraries (`packages/*`) reside in a single codebase. By using `pnpm workspaces`, we achieve:
  - **Shared Types**: The `@repo/shared-types` package serves as a single source of truth for interfaces (e.g., `WalletAccount`, `LedgerHistoryItem`), linked directly into both apps to prevent schema drift and enable compile-time type-safety across client-server boundaries.
  - **Efficient Dependency Management**: Deduplicates common dependencies (like TypeScript, Biome, etc.) across the monorepo, speeding up installations and keeping the codebase lightweight.
- **Turborepo Build Pipeline**: We integrated **Turborepo** (`turbo.json`) to manage task executions and build pipelines.
  - **Separate Frontend & Backend Builds**: Turborepo allows building components in isolation (e.g., `turbo build --filter=web`) while automatically ensuring that internal workspace dependencies (like `@repo/shared-types`) are compiled first.
  - **Concurrency & Caching**: Speeds up local development and CI runs by executing dev, lint, and build tasks concurrently and caching unchanged workspace outputs.
- **Strict Workspace Dependency Separation (pnpm --filter)**: Frontend and backend Docker containers are built separately. By leveraging `pnpm install --filter <workspace>`, each container only fetches its respective required dependencies. This prevents frontend builds from pulling in native backend modules (like `better-sqlite3` or `@prisma/engines`), ensuring slim and reliable container builds.
- **Transactional Ledger System**: Instead of simple in-place updates to account records, every fund transfer is structured as a dual-ledger entry (a `DEBIT` entry for the sender and a `CREDIT` entry for the receiver). Balances are updated inside atomic Prisma transactions (`$transaction`), guaranteeing auditability and balance integrity.
- **Idempotency Keys**: Network failures or user impatience can lead to duplicate requests. The frontend generates a unique UUID `transactionId` for each transfer and transmits it as an idempotency key. The backend records and maps these keys to prevent duplicate deductions.
- **Cascading Environment Variable Loader**: Both systems attempt to load `.env` first, falling back to `.env.local` to enable granular local overrides while supporting default, zero-configuration docker compose environments.

---

## ⚖️ Trade-offs Made

- **SQLite Database**:
  - *Trade-off*: Selected for simplicity and ease of local development (zero host dependencies).
  - *Consequence*: SQLite enforces file-level write locking which restricts concurrent write operations, making it unsuitable for large-scale, high-concurrency production ledger setups.
- **Docker Mount for HMR**:
  - *Trade-off*: The local workspace directory is mounted directly into the running development containers.
  - *Consequence*: Speeds up frontend and backend development with instant hot-reloading (HMR), but introduces directory/package ownership discrepancies on the host (e.g. Node files built as `root` in the container), occasionally requiring `--lockfile-only` dependency updates.
- **Vite Build-time Define for Ports**:
  - *Trade-off*: Custom port configurations are injected into the frontend using Vite's compile-time `define` mapping.
  - *Consequence*: Bypasses the need for complex runtime frontend environment injections, but requires rebuilding the container if port assignments are modified.
