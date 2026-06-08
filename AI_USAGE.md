# AI-Assisted Development Guide

This guide documents the architecture, environment setups, and workflow patterns of this monorepo to help human developers and future AI coding assistants collaborate and build on this application effectively.

---

## 1. Monorepo Architecture

This project is a TypeScript monorepo managed with **pnpm Workspaces** and **Turborepo**.

```
my-app/
├── apps/
│   ├── be/             # Express.js backend (with Prisma & SQLite)
│   └── web/            # React + TanStack Start frontend (Vite & Vinxi)
├── packages/
│   └── shared-types/   # Shared TypeScript definitions (linked across workspaces)
├── docker-compose.yml   # Multi-container local orchestration
├── pnpm-workspace.yaml  # Workspace mapping definition
└── .npmrc              # Custom package manager settings
```

---

## 2. Environment Configurations & Fallbacks

Both the backend and frontend are configured with a cascading `.env` loader pattern.

### Loading Order
1. **`.env`** (Primary configuration)
2. **`.env.local`** (Fallback configuration, loaded for any variables not defined in `.env`)

### Port Configuration
Ports are fully configurable using environment variables, which propagate automatically to the Docker Compose host mapping:
- **`WEB_PORT`** (defaults to `3000`): Controls the frontend dev server and exposes it to the host.
- **`BE_PORT`** (defaults to `3001`): Controls the Express API server port, exposes it to the host, and instructs the client-side API client where to send requests.

#### Example Root `.env.local`
To change local dev ports globally, create/edit `.env.local` at the root of the workspace:
```env
WEB_PORT=3000
BE_PORT=3001
```

---

## 3. Database Initialization (Prisma & SQLite)

The backend uses SQLite with the database file located at `apps/be/dev.db`.

### Automatic Startup Initialization
Under Docker Compose, the backend container automatically detects if the database file exists. If it is missing, it will automatically:
1. Touch/create the empty `apps/be/dev.db` file.
2. Execute the Prisma database sync step (`pnpm --filter be db:push`) before launching the TypeScript watch server.

### Manual Synchronization Commands
If you need to manually force a schema sync or update the database client:

* **Local Machine**:
  ```bash
  # Generate Prisma client
  pnpm --filter be db:generate
  
  # Push schema updates
  pnpm --filter be db:push
  ```

* **Running Container (Docker Compose)**:
  ```bash
  docker compose exec be pnpm --filter be db:push
  ```

---

## 4. Docker Build & Dependency Isolation

A key challenge in monorepo development under Docker is preventing native compilation errors (e.g. backend's SQLite binary building inside the frontend Alpine container).

### Mitigation Strategies Implemented:
1. **Strict Filters**: The `apps/web/Dockerfile` uses `pnpm install --filter web...` during the build stage. This ensures only the frontend and its dependencies (like `@repo/shared-types`) are installed, completely isolating it from the backend's Prisma/SQLite packages.
2. **Skipping Dependency Checks**: In containerized environments, pnpm's default behavior is to run a workspace-wide dependency status validation on startup. Because `docker-compose` mounts the host workspace directory (`.:/app`), this check will notice backend files and try to install backend dependencies. 
   - This check is disabled by the root `.npmrc` setting:
     ```ini
     verify-deps-before-run=false
     ```
3. **Lockfile Updates**: When adding a new dependency, the host's `node_modules` directory might have file locks owned by the container root user, causing local `pnpm install` commands to fail. 
   - Update the lockfile without touching host directories using:
     ```bash
     pnpm install --lockfile-only
     ```

---

## 5. Summary of Key Services & Health checks

| Service | Container Name | Host URL | Config File |
|---|---|---|---|
| **Web Frontend** | `my-app-web` | `http://localhost:<WEB_PORT>` | `apps/web/vite.config.ts` |
| **Express Backend** | `my-app-be` | `http://localhost:<BE_PORT>` | `apps/be/src/index.ts` |
