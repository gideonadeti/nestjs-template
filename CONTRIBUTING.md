# Contributing

Thanks for your interest in contributing to the NestJS template.

## Prerequisites

- Node 24+, pnpm 11.2.2, Docker (for local PostgreSQL)
- A [Clerk](https://clerk.com) application

## Setup

```bash
pnpm install
cp .env.local.example .env.local
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestjs-template"' > .env
docker compose up -d
pnpm prisma migrate dev
pnpm start:dev
```

## Commands

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `pnpm start:dev`    | Dev server on port 3000               |
| `pnpm build`        | Compile to `dist/`                    |
| `pnpm lint`         | ESLint (typescript-eslint + prettier) |
| `pnpm format`       | Prettier write                        |
| `pnpm format:check` | Prettier check                        |
| `pnpm typecheck`    | `tsc --noEmit`                        |
| `pnpm test`         | Jest unit tests (`*.spec.ts`)         |
| `pnpm test:e2e`     | Supertest e2e tests                   |

Run `pnpm typecheck && pnpm lint && pnpm test` before submitting changes.

## Pull request guidelines

- Branch: `feat/`, `fix/`, `chore/`, `docs/` prefix
- Keep changes focused to a single concern
- For schema changes, include the generated Prisma migration
- If adding an env var, update `.env.local.example` and document it in the README

See [docs/](docs/) for detailed guides on auth, testing, Prisma, webhooks, deployment, and adding new resources.
