# NestJS Template

A production-ready [NestJS](https://nestjs.com/) 11 backend template with Clerk authentication, Prisma ORM, role-based access control, and pre-commit lint-staged hooks.

## Features

- **Authentication** — Clerk-powered via `@clerk/express` with global middleware, configurable guards, and auto-provisioning of local user records on first sign-in
- **Authorization** — Role-based access control with `@Roles()` decorator and `RolesGuard` (`USER` / `ADMIN` roles)
- **Database** — Prisma v7 with PostgreSQL via `@prisma/adapter-pg`, auto-generated typed client, migration workflow
- **REST API** — Global `/api/v1` prefix, full CRUD scaffold for users, `ValidationPipe` with whitelist/transform
- **Webhooks** — Clerk webhook handler for `user.created` / `user.updated` / `user.deleted` events with signature verification
- **Rate Limiting** — `@nestjs/throttler`, 100 requests/min per user
- **Logging** — Request/response logging middleware with duration, request ID, client IP, user agent
- **Documentation** — Swagger UI at `/api/v1/documentation` (dev only), auto-generated from decorators and JSDoc
- **Testing** — Jest unit tests (with mocked Prisma) and Supertest e2e tests
- **Git hooks** — Husky + lint-staged pre-commit hook (auto-installed on `pnpm install`)
- **Tooling** — ESLint flat config (typescript-eslint + prettier), Docker Compose for local PostgreSQL

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- [pnpm](https://pnpm.io/) 11.2.2 (`npm install -g pnpm@11.2.2`)
- [Docker](https://www.docker.com/) (for local PostgreSQL)
- A [Clerk](https://clerk.com/) application (for authentication)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Clerk keys from https://dashboard.clerk.com

# 3. Start PostgreSQL via Docker
docker compose up -d

# 4. Create .env with DATABASE_URL
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestjs-template"' > .env

# 5. Run database migrations
pnpm prisma migrate dev

# 6. Start the development server
pnpm start:dev
```

The API is now available at `http://localhost:3000/api/v1`. Swagger docs at `http://localhost:3000/api/v1/documentation`.

## Project structure

```text
nestjs-template/
├── compose.yaml                    # Docker Compose (PostgreSQL 18)
├── prisma.config.ts                # Prisma config (dotenv + defineConfig)
├── prisma/
│   ├── schema.prisma               # Database schema (User model, UserRole enum)
│   └── migrations/                 # Migration history
├── src/
│   ├── main.ts                     # Entry point (global prefix, Clerk, CORS, Swagger, ValidationPipe)
│   ├── app.module.ts               # Root module (imports all features)
│   ├── app.controller.ts           # Root controller (GET /api/v1)
│   ├── app.service.ts              # Root service
│   ├── clerk-auth/
│   │   └── clerk-auth.guard.ts     # Clerk authentication guard
│   ├── public/
│   │   └── public.decorator.ts     # @Public() — bypass auth on routes
│   ├── roles/
│   │   ├── roles.decorator.ts      # @Roles() — require specific roles
│   │   └── roles.guard.ts          # Roles authorization guard
│   ├── logging/
│   │   └── logging.middleware.ts   # Request/response logging
│   ├── prisma/
│   │   ├── prisma.module.ts        # Global Prisma module
│   │   └── prisma.service.ts       # PrismaClient with adapter-pg
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts     # CRUD: /api/v1/users
│   │   ├── users.service.ts
│   │   └── dtos/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   └── webhooks/
│       ├── webhooks.module.ts
│       ├── webhooks.controller.ts  # POST /api/v1/webhooks/clerk
│       └── webhooks.service.ts     # Clerk webhook event handlers
├── test/
│   ├── jest-e2e.json               # E2E Jest config
│   └── app.e2e-spec.ts
├── .husky/                         # Git hooks (created on pnpm install)
└── secrets/                        # Docker secrets (gitignored)
```

## Configuration

The template uses two env files loaded in order: `.env.local` (local overrides, gitignored) then `.env` (shared defaults, gitignored). Copy the example file to get started:

| Variable                | Required | Default                 | Description                                                                                         |
| ----------------------- | -------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Yes      | —                       | PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/nestjs-template`) |
| `CLERK_PUBLISHABLE_KEY` | Yes      | —                       | Clerk publishable API key                                                                           |
| `CLERK_SECRET_KEY`      | Yes      | —                       | Clerk secret API key                                                                                |
| `CLERK_WEBHOOK_SECRET`  | No       | —                       | Clerk webhook signing secret (required for webhook verification)                                    |
| `FRONTEND_BASE_URL`     | No       | `http://localhost:3001` | Allowed CORS origin                                                                                 |
| `PORT`                  | No       | `3000`                  | Application port                                                                                    |

## Scripts

| Command                   | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `pnpm install`            | Install all dependencies                             |
| `pnpm start:dev`          | Start dev server with file watching                  |
| `pnpm start:debug`        | Start dev server in debug mode                       |
| `pnpm start:prod`         | Run compiled production build (`node dist/src/main`) |
| `pnpm build`              | Compile to `dist/` (`deleteOutDir: true`)            |
| `pnpm lint`               | Run ESLint on source and test files                  |
| `pnpm format`             | Format source files with Prettier                    |
| `pnpm format:check`       | Check formatting (CI use)                            |
| `pnpm typecheck`          | Run `tsc --noEmit` for type errors                   |
| `pnpm test`               | Run unit tests (Jest, `*.spec.ts`)                   |
| `pnpm test:e2e`           | Run e2e tests (Jest, `*.e2e-spec.ts`)                |
| `pnpm test:cov`           | Run unit tests with coverage                         |
| `pnpm prisma generate`    | Regenerate Prisma client after schema changes        |
| `pnpm prisma migrate dev` | Create and apply a new migration                     |

## API overview

All endpoints are prefixed with `/api/v1`.

| Method   | Path              | Auth                   | Description          |
| -------- | ----------------- | ---------------------- | -------------------- |
| `GET`    | `/`               | Public                 | Health check         |
| `GET`    | `/users`          | Public                 | List all users       |
| `GET`    | `/users/:id`      | Public                 | Get user by ID       |
| `POST`   | `/users`          | Authenticated          | Create a user        |
| `PATCH`  | `/users/:id`      | Authenticated          | Update a user        |
| `DELETE` | `/users/:id`      | Admin only             | Delete a user        |
| `POST`   | `/webhooks/clerk` | Public (skip throttle) | Clerk webhook events |

## Auth model

The template implements a layered auth strategy:

1. **Global middleware** — `clerkMiddleware()` from `@clerk/express` runs on every request, parsing the session JWT and attaching user identity to `req.auth`
2. **Guard layer** — `ClerkAuthGuard` on controllers rejects unauthenticated requests. It also **auto-provisions** a local `User` record on first sign-in: if the Clerk user ID isn't in your database, it fetches the user from the Clerk API and inserts them
3. **Bypass** — `@Public()` decorator skips the guard for public routes
4. **RBAC** — `@Roles(UserRole.ADMIN)` decorator combined with `RolesGuard` restricts endpoints to specific roles. `RolesGuard` checks `@Public()` first, then verifies the user's role from the local database

See [docs/auth.md](docs/auth.md) for a detailed walkthrough.

## Development

- **Add a new resource** — See [docs/new-resource.md](docs/new-resource.md) for a step-by-step guide
- **Database changes** — Edit `prisma/schema.prisma`, run `pnpm prisma migrate dev`, then `pnpm prisma generate`
- **Testing** — See [docs/testing.md](docs/testing.md) for patterns and conventions

## Deployment

1. Set `NODE_ENV=production`
2. Ensure all required environment variables are set
3. Run `pnpm build` to compile to `dist/`
4. Start with `pnpm start:prod`

See [docs/deployment.md](docs/deployment.md) for a full checklist.

## License

[MIT](LICENSE)
