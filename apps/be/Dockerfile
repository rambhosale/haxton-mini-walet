FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV pnpm_config_store_dir="/pnpm/store"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy lockfile, workspace configs, and dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/be/package.json ./apps/be/package.json

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# --- Development Stage ---
FROM base AS development
COPY . .
ENV PORT=3001
EXPOSE 3001
ENV DATABASE_URL="file:./dev.db"
RUN pnpm --filter be exec prisma generate --schema=prisma/schema.prisma
CMD ["sh", "-c", "if [ ! -f apps/be/dev.db ]; then touch apps/be/dev.db && pnpm --filter be db:push; fi && pnpm --filter be dev"]

# --- Builder Stage ---
FROM base AS builder
COPY . .
ENV DATABASE_URL="file:./dev.db"
RUN pnpm --filter be exec prisma generate --schema=prisma/schema.prisma
RUN pnpm --filter be build

# --- Production Runner ---
FROM node:22-alpine AS production
ENV PNPM_HOME="/pnpm"
ENV pnpm_config_store_dir="/pnpm/store"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
ENV PORT=3001
EXPOSE 3001
ENV NODE_ENV=production

# Copy configurations, lockfile, packages, and build output
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/be/package.json ./apps/be/package.json
COPY --from=builder /app/apps/be/dist ./apps/be/dist

# Install production dependencies only
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

CMD ["node", "apps/be/dist/index.js"]
