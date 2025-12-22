# =========================
# Base image
# =========================
FROM node:22-alpine AS base
WORKDIR /app

# =========================
# Install dependencies
# =========================
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# =========================
# Build app
# =========================
FROM deps AS builder
COPY . .
RUN npx prisma generate
RUN npm run build

# =========================
# Production runtime
# =========================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]