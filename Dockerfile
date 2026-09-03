# Node 22: apps/api depends on jose@6, which is ESM-only. Node >=22.12 can
# require() ESM, which is what makes the CommonJS build work at all. Do not
# downgrade the base image below 22.12 without first fixing that.
FROM node:22-slim

WORKDIR /app

# pnpm workspace: the API imports @anuprerna/types via workspace:*, so the
# whole workspace has to be present before install.
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json tsconfig.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @anuprerna/api build

# NODE_ENV only after the build — @nestjs/cli is a devDependency, and setting
# it before install makes pnpm skip devDeps, so `nest build` goes missing.
ENV NODE_ENV=production

# App Runner health-checks and routes to this port; main.ts reads PORT.
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/api
CMD ["node", "dist/main.js"]
