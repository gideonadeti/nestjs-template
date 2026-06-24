# Authentication & Authorization

## Overview

Auth is built on [Clerk](https://clerk.com/) and uses a layered approach:

1. **Global Clerk middleware** — Parses session JWTs on every request
2. **`ClerkAuthGuard`** — Rejects unauthenticated requests at the controller level; auto-provisions local user records
3. **`@Public()` decorator** — Opts routes out of authentication
4. **`@Roles()` decorator + `RolesGuard`** — Restricts endpoints to specific user roles

---

## Layer 1 — Clerk middleware (global)

In `src/main.ts`, `clerkMiddleware()` from `@clerk/express` is applied globally:

```ts
app.use(clerkMiddleware());
```

This runs on every incoming request. It reads the session token from the `Authorization` header (or cookie), verifies it against Clerk, and attaches `auth` to the request object. If no valid token is present, `req.auth.userId` is `null`.

The middleware does **not** reject unauthenticated requests — it only parses whatever credentials are present. Rejection is handled by the guard layer.

---

## Layer 2 — `ClerkAuthGuard` (controller-level)

`ClerkAuthGuard` is applied to controllers (e.g. `@UseGuards(ClerkAuthGuard)` on `UsersController`).

### Guard logic (`src/clerk-auth/clerk-auth.guard.ts`)

```text
request → is @Public()? → yes → allow
       → no
       → get req.auth.userId from Clerk
       → userId is null? → deny (401)
       → user exists in local DB? → yes → allow
       → no → fetch user from Clerk API → create local User record → allow
```

**Auto-provisioning detail:** When a user authenticates for the first time, their Clerk user ID isn't in your database. The guard fetches the user from Clerk via `clerkClient.users.getUser(userId)`, extracts `fullName` (or `username`) and `primaryEmailAddress`, and creates a local `User` record with role `USER`. Subsequent requests hit the database directly.

An error is thrown if the Clerk user record is missing an email address.

---

## Layer 3 — `@Public()` decorator

Use `@Public()` to mark routes that should bypass authentication entirely:

```ts
@Get()
@Public()
findAll() {
  return this.usersService.findAll();
}
```

This sets metadata (`IS_PUBLIC_KEY = true`) that both `ClerkAuthGuard` and `RolesGuard` check before enforcing their rules.

---

## Layer 4 — Role-based access with `RolesGuard`

### The `@Roles()` decorator

Define required roles on a method:

```ts
@Delete(':id')
@Roles(UserRole.ADMIN)
remove(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

The `UserRole` enum is defined in `prisma/schema.prisma`:

```prisma
enum UserRole {
  USER
  ADMIN
}
```

### RolesGuard logic (`src/roles/roles.guard.ts`)

```text
request → is @Public()? → yes → allow
       → no
       → no roles required? → allow
       → get req.auth.userId
       → userId is null? → deny (403)
       → fetch user from DB
       → user not found? → deny (403)
       → user.role in required roles? → allow
       → deny (403)
```

The guard returns `403 Forbidden` rather than `401 Unauthorized` because the user is authenticated but lacks sufficient permissions.

---

## Usage guide

### On a new controller

```ts
import { Controller, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../clerk-auth/clerk-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Public } from '../public/public.decorator';
import { UserRole } from '../generated/prisma/enums';

@UseGuards(ClerkAuthGuard, RolesGuard)
@Controller('items')
export class ItemsController {
  @Get()
  @Public()
  findAll() {
    /* public */
  }

  @Post()
  create() {
    /* any authenticated user */
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove() {
    /* admin only */
  }
}
```

### Registration

Since `ClerkAuthGuard` is provided globally in `AppModule`, you only need to add Guards and Decorators to your controllers. There is no need to register them per-module.

---

## Guard order matters

When both guards are used together, apply `ClerkAuthGuard` first, then `RolesGuard`:

```ts
@UseGuards(ClerkAuthGuard, RolesGuard)
```

This ensures `RolesGuard` runs after authentication so it can rely on `req.auth.userId` being populated.
