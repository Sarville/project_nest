# Stage 1: Build frontend
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ .
RUN npm run build

# Stage 2: Build backend and produce final image
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://x:x@x:5432/x" npx prisma generate

COPY . .
RUN npm run build

# Copy built frontend into the image
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
