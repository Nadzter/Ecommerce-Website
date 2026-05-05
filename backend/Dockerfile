FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm prisma generate

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S amwali && adduser -S amwali -u 1001 -G amwali
COPY --from=build --chown=amwali:amwali /app/dist ./dist
COPY --from=build --chown=amwali:amwali /app/node_modules ./node_modules
COPY --from=build --chown=amwali:amwali /app/prisma ./prisma
COPY --from=build --chown=amwali:amwali /app/package.json ./
USER amwali
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]
