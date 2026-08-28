FROM node:24-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
COPY packages/shared packages/shared
RUN pnpm --filter @aerothai/shared build && pnpm --filter @aerothai/api prisma:generate && pnpm --filter @aerothai/api build

FROM node:24-alpine
RUN corepack enable && apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/shared ./packages/shared
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
USER node
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
