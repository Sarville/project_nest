# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server (watch mode)
npm run build        # Production build
npm run start        # Start server (compiles + runs)
npm run lint         # ESLint

# Database
docker compose up -d               # Start PostgreSQL (wishlist_db on port 5432)
npm run prisma:generate            # Regenerate Prisma client after schema changes
npx prisma migrate deploy          # Apply migrations (use this — NOT migrate dev, which fails in non-TTY)
```

**Important**: `prisma migrate dev` is blocked in non-interactive environments. Always write migration SQL manually in `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql` and apply with `prisma migrate deploy`.

After any schema change: run `prisma migrate deploy` → `npm run prisma:generate` → `npm run build`.

## Architecture

**Stack**: NestJS 11 + TypeScript + PostgreSQL 16 + Prisma 7

### Critical version-specific behaviors

- **Prisma 7**: The `datasource` block in `schema.prisma` has NO `url` field — the connection string lives in `prisma.config.ts` via `defineConfig({ datasource: { url: env("DATABASE_URL") } })`. PrismaClient requires the `@prisma/adapter-pg` driver adapter (see `src/prisma/prisma.service.ts`). Run with `DATABASE_URL` set in env before `prisma generate`.
- **NestJS**: Uses `@Global()` PrismaModule so PrismaService is available everywhere without re-importing. Validation via `class-validator` + global `ValidationPipe` in `main.ts`.

### Request logging (middleware)

`src/middleware/logging.middleware.ts` intercepts every HTTP request. Logs `[timestamp] METHOD URL` to console and fire-and-forgets a write to `request_logs`. Applied to all routes except `request-logs` (to avoid infinite loop) in `AppModule.configure()`.

### Database models (`prisma/schema.prisma`)

| Model | Table | Purpose |
|---|---|---|
| `Wish` | `wishes` | Core entity — title (≤50), optional description |
| `WishLog` | `wish_logs` | Audit log for CRUD on wishes (oldValues/newValues as JSON) |
| `RequestLog` | `request_logs` | Every HTTP request — method, url, body, timestamp |

### API routes

| Route | Methods | Notes |
|---|---|---|
| `/wishes` | GET, POST | Paginated list with ILIKE search; POST creates + writes WishLog, returns 201 |
| `/wishes/:id` | GET, PATCH, DELETE | UUID validated via ParseUUIDPipe; DELETE returns 204 |
| `/wish-logs` | GET | Paginated wish audit log — filter by action, search by title, sortDir |
| `/request-logs` | GET | Paginated HTTP request log — filter by method, search by URL, sortDir |
| `/artsearch/*path` | ALL | Reverse proxy — forwards to artsearch.io with API key header; returns 418 on upstream error |

### Module structure (`src/`)

```
main.ts                    # Bootstrap, global ValidationPipe, PORT from env
app.module.ts              # Root module, registers LoggingMiddleware
prisma/                    # Global PrismaModule + PrismaService (extends PrismaClient)
middleware/                # LoggingMiddleware
wishes/                    # WishesModule — controller, service, DTOs
wish-logs/                 # WishLogsModule — controller, service, DTOs
request-logs/              # RequestLogsModule — controller, service, DTOs
artsearch/                 # ArtsearchModule — HttpModule proxy via ArtsearchService
```
