# Team Task Tracker

REST API for a team-based task tracker with JWT authentication, role-based access control, Redis caching, PostgreSQL indexing, and Dockerized deployment. A small Next.js TypeScript frontend is included as an optional task board shell.

## Stack

- API: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis
- Web: Next.js, React, TypeScript
- Auth: JWT access tokens plus refresh token rotation
- Docs: OpenAPI served from the API

## Quick Start

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npx prisma migrate dev --schema apps/api/prisma/schema.prisma`.
4. Run `npm run dev:api`.

Docker path:

```bash
docker compose up --build
```

The API runs on `http://localhost:4000` and the web app runs on `http://localhost:3000`.

If you use hosted Supabase/Neon and Upstash, set `DATABASE_URL` and `REDIS_URL` in `.env`; Compose will use those values. If you want fully local Docker services, use the local URLs from `.env.example`.

## Core Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /tasks?page=1&limit=20&status=TODO&priority=HIGH&assigneeId=...`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `PATCH /tasks/:id/status`
- `DELETE /tasks/:id`
- `GET /health`

## Roles

- `ADMIN`: full access inside the organization, including user management.
- `MANAGER`: manage projects and tasks, assign members, cannot manage users.
- `MEMBER`: view assigned tasks and update assigned task status only.

RBAC is enforced through route middleware and task-access middleware rather than controller-only checks.

## Task Status Flow

Normal flow:

```txt
TODO -> IN_PROGRESS -> IN_REVIEW -> DONE
```

`BLOCKED` is reachable from active states: `TODO`, `IN_PROGRESS`, and `IN_REVIEW`. A blocked task can return to `IN_PROGRESS`.

Only the assignee, a manager, or an admin can advance task status.

## Database Design

Users and tasks are scoped by organization. Tasks belong to a project and can be assigned to a user from the same organization. This keeps multi-tenant access checks simple and prevents cross-organization leakage.

Indexes are added for frequently queried fields:

- `Task.status`
- `Task.assigneeId`
- `Task.dueDate`
- Composite `Task.organizationId, assigneeId`
- Composite `Task.organizationId, status`

The composite indexes match the common list queries where every request is already scoped to an organization.

## Caching Strategy

Task list responses are cached in Redis using a key derived from organization, assignee, pagination, and filters. Mutating task endpoints clear task-list keys for the organization. This is intentionally broad invalidation for correctness and simplicity; with more time it could invalidate only the affected assignee/filter windows.

## Tradeoffs

- The current cache invalidation is conservative.
- Project and user management endpoints can be expanded, but the schema and RBAC are ready for them.
- The frontend is intentionally basic because the assignment prioritizes backend correctness.
