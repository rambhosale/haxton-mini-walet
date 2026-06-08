FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV pnpm_config_store_dir="/pnpm/store"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy lockfile, workspace configs, and dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter web... --frozen-lockfile

# --- Development Stage ---
FROM base AS development
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["pnpm", "--filter", "web", "dev"]

# --- Builder Stage ---
FROM base AS builder
COPY . .
# Build the production app
RUN pnpm --filter web build

# --- Production Runner ---
FROM node:22-alpine AS production
ENV PNPM_HOME="/pnpm"
ENV pnpm_config_store_dir="/pnpm/store"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
ENV PORT=3000
EXPOSE 3000
ENV NODE_ENV=production

# Copy configurations, lockfile, packages, and build output
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/.output ./apps/web/.output

# Install production dependencies only
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --filter web... --prod --frozen-lockfile

CMD ["node", "apps/web/.output/server/index.mjs"]
