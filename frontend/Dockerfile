# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* встраиваются в JS-бандл при сборке — передаются как build args.
# Серверные переменные (BACKEND_URL, TS_API_KEY и т.д.) передаются в runtime через env.
ARG NEXT_PUBLIC_OFFER_ID
ARG NEXT_PUBLIC_REF_TTL_DAYS=7
ARG NEXT_PUBLIC_CP_PUBLIC_ID
ARG NEXT_PUBLIC_PAYMENT_BACK_URL
# SEO: канонический домен и коды вебмастеров. Из домена собираются canonical,
# og:url, sitemap.xml и robots.txt, поэтому он обязан быть известен на сборке.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_YANDEX_VERIFICATION
ARG NEXT_PUBLIC_GOOGLE_VERIFICATION

ENV NEXT_PUBLIC_OFFER_ID=$NEXT_PUBLIC_OFFER_ID
ENV NEXT_PUBLIC_REF_TTL_DAYS=$NEXT_PUBLIC_REF_TTL_DAYS
ENV NEXT_PUBLIC_CP_PUBLIC_ID=$NEXT_PUBLIC_CP_PUBLIC_ID
ENV NEXT_PUBLIC_PAYMENT_BACK_URL=$NEXT_PUBLIC_PAYMENT_BACK_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_YANDEX_VERIFICATION=$NEXT_PUBLIC_YANDEX_VERIFICATION
ENV NEXT_PUBLIC_GOOGLE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_VERIFICATION

RUN npm run build

# ─── Stage 3: Production runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# standalone output — только необходимые файлы, без node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
