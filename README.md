# Next.js + Node.js Monorepo Template

A production-ready monorepo template with **Next.js 15** frontend, **Express 5** API backend, **MongoDB**, and optional **Redis** caching — all managed with **Turborepo** and **pnpm workspaces**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4, TypeScript |
| Backend | Express 5, Zod validation, Pino logger, Helmet |
| Database | MongoDB (Mongoose ODM) |
| Cache | Redis (ioredis) — optional, graceful fallback |
| Monorepo | Turborepo, pnpm workspaces |
| Build | TypeScript 5, Turbopack (dev), Docker multi-stage |

## Project Structure

```
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   │   ├── page.tsx    # Home page
│   │   │   │   └── test/       # API test dashboard
│   │   │   ├── lib/            # API client utilities
│   │   │   └── styles/         # Global CSS + Tailwind
│   │   ├── next.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── api/                    # Express 5 backend
│       ├── src/
│       │   ├── config/         # env, database, redis, logger
│       │   ├── middleware/     # error-handler, validate, request-logger
│       │   ├── models/         # Mongoose models
│       │   ├── routes/         # API route handlers
│       │   ├── services/       # Cache service
│       │   ├── app.ts          # Express app setup
│       │   └── server.ts       # Server entry point
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types, constants, utils
│   ├── eslint-config/          # Shared ESLint configs (base/next/node)
│   └── typescript-config/      # Shared tsconfig presets
│
├── docker-compose.yml          # Full stack (MongoDB + Redis + API + Web)
├── docker-compose.dev.yml      # Dev services only (MongoDB + Redis)
├── turbo.json                  # Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- **Node.js** >= 20.0.0 ([install via nvm](https://github.com/nvm-sh/nvm))
- **pnpm** >= 9.0.0 (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **MongoDB** — local install, Docker, or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **Redis** *(optional)* — local install, Docker, or [Redis Cloud](https://redis.com/try-free/) (free tier)
- **Docker** *(optional)* — for containerized deployment

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/abhiupadhyay-Dev/nextjs-nodejs-monorepo-template.git
cd nextjs-nodejs-monorepo-template
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.env` with your database credentials:

```env
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379
CACHE_TTL=60
```

> **Note:** Redis is optional. If Redis is not available, the app runs normally without caching.

Edit `apps/web/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 4. Start databases (choose one)

**Option A — Using Docker:**

```bash
docker compose -f docker-compose.dev.yml up -d
```

**Option B — MongoDB Atlas (cloud):**

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Paste it in `apps/api/.env` as `MONGODB_URI`

**Option C — Local MongoDB + Redis:**

```bash
# macOS
brew install mongodb-community redis
brew services start mongodb-community
brew services start redis
```

### 5. Start development

```bash
pnpm dev
```

This starts both apps concurrently:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Test Dashboard**: http://localhost:3000/test

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check code formatting |
| `pnpm clean` | Remove build outputs |

### Run commands for specific apps

```bash
pnpm --filter @repo/api dev      # Start only the API
pnpm --filter @repo/web dev      # Start only the frontend
pnpm --filter @repo/api build    # Build only the API
pnpm --filter @repo/shared build # Build shared package
```

## API Endpoints

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check with MongoDB status |
| GET | `/api/v1/test/info` | Server info (Node version, memory, uptime) |
| POST | `/api/v1/test/echo` | Echo back request headers and body |
| GET | `/api/v1/test/delay/:ms` | Simulated delay (max 5s) |
| GET | `/api/v1/test/error/:code` | Simulated HTTP error |

### Users CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated: `?page=1&pageSize=20`) |
| GET | `/api/v1/users/:id` | Get user by ID (Redis cached if available) |
| POST | `/api/v1/users` | Create user (`{ name, email }`) |
| PATCH | `/api/v1/users/:id` | Update user (`{ name?, email? }`) |
| DELETE | `/api/v1/users/:id` | Delete user |

## Test Dashboard

Navigate to `http://localhost:3000/test` for an interactive test dashboard that lets you:

- Test all API endpoints with one click
- Create, read, update, and delete users
- See response times, status codes, and full JSON responses
- Two-column layout: controls on the left, auto-scrolling results on the right

## Docker Deployment

### Full stack with Docker Compose

```bash
docker compose up --build
```

This starts MongoDB, Redis, API, and Web — all connected.

### Build individual images

```bash
# API
docker build -f apps/api/Dockerfile -t monorepo-api .

# Web
docker build -f apps/web/Dockerfile -t monorepo-web .
```

## Shared Packages

### `@repo/shared`

Shared TypeScript types, constants, and utilities used by both frontend and backend:

- `User`, `ApiResponse`, `PaginatedResponse` types
- `HTTP_STATUS` constants
- `isValidEmail`, `clampPageSize` utilities

### `@repo/eslint-config`

Shared ESLint flat configs:
- `base` — TypeScript rules
- `next` — Next.js specific rules
- `node` — Node.js backend rules

### `@repo/typescript-config`

Shared `tsconfig` presets:
- `base.json` — strict TypeScript defaults
- `next.json` — Next.js optimized config
- `node.json` — Node.js backend config

## Adding New Features

### Add a new API route

1. Create route file in `apps/api/src/routes/`
2. Register it in `apps/api/src/app.ts`

### Add a new Mongoose model

1. Create model in `apps/api/src/models/`
2. Import and use in your route handlers

### Add shared types

1. Add types to `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`
3. Run `pnpm --filter @repo/shared build`
4. Use in any app: `import type { MyType } from '@repo/shared'`

## Architecture Decisions

- **Express 5** — native async error handling, modern routing
- **Zod** — runtime validation for request bodies and environment variables
- **Pino** — structured JSON logging, pretty output in development
- **Helmet + CORS** — security headers configured out of the box
- **Redis as optional** — cache layer that gracefully degrades; app works without it
- **Mongoose** — schema validation, timestamps, JSON transforms
- **Standalone Next.js output** — optimized for Docker containers
- **Turborepo** — build caching, parallel execution, dependency-aware task orchestration

## License

MIT
