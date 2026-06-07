# ---- Backend NestJS ----
# Usamos node:20-slim (Debian) por compatibilidad con OpenSSL que Prisma requiere.
FROM node:20-slim AS builder
WORKDIR /app

# OpenSSL (requerido por Prisma schema engine)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 1) Instalar dependencias (incluyendo devDependencies para nest build y prisma)
COPY package*.json ./
RUN npm install

# 2) Generar cliente Prisma (necesita los tipos para que nest build compile)
COPY prisma ./prisma
RUN npx prisma generate

# 3) Copiar fuentes y compilar
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# 4) Verificar que el build produjo dist/main.js (falla ruidoso si no)
RUN ls -la dist/main.js || (echo "BUILD FAILED: dist/main.js no existe" && exit 1)

# ---- Etapa de produccion ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

# Copiar el build verificado
COPY --from=builder /app/dist ./dist

EXPOSE 4000
# Aplica migraciones pendientes y arranca; si no hay migraciones, crea las tablas con db push
CMD npx prisma migrate deploy && npx prisma db push --accept-data-loss --skip-generate && node dist/main
