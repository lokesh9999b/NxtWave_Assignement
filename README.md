# Team Task Tracker

REST API for a team-based task tracker built for a SDE II assignment. It features JWT authentication with refresh token rotation, Role-Based Access Control (RBAC), multi-tenant isolation via Organizations, Redis caching, PostgreSQL indexing, and full Dockerized deployment. A small Next.js TypeScript frontend is included as an optional task board shell.

## Live Demo (Railway)

- **API:** [https://task-trackerapi-production.up.railway.app](https://task-trackerapi-production.up.railway.app)
- **API Docs (Swagger):** [https://task-trackerapi-production.up.railway.app/docs](https://task-trackerapi-production.up.railway.app/docs)
- **Web App (Task Board):** [https://task-trackerweb-production.up.railway.app](https://task-trackerweb-production.up.railway.app)

## Tech Stack

- **API:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Zod (validation)
- **Web:** Next.js 15, React 19, TypeScript
- **Auth:** JWT access tokens + Bcrypt-hashed refresh tokens
- **Docs:** OpenAPI 3.0 served via Swagger UI
- **Testing:** Vitest

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js v22+
- PostgreSQL database
- Redis server
- Docker (optional, for containerized run)

### 2. Environment Setup
Copy `.env.example` to `.env` and set up your variables:
```bash
# Example local configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/team_task_tracker?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="your-super-secret-access-key-min-16-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-16-chars"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL_DAYS="7"
PORT="4000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 3. Install & Database Setup
```bash
npm install
npx prisma migrate dev --schema apps/api/prisma/schema.prisma
npx prisma generate --schema apps/api/prisma/schema.prisma
```

### 4. Run Locally
```bash
npm run dev:api   # Runs the API on port 4000
npm run dev:web   # Runs the Web app on port 3000
```

### 5. Run via Docker Compose
```bash
docker compose up --build
```

---

## 🔒 Security & Architecture Decisions

### Multi-Tenant Isolation
Users, projects, and tasks are strongly scoped to an **Organization**. 
- The schema associates every user, project, and task with an `organizationId`. 
- Every query inherently filters by the user's `organizationId`.
- **Security by Obscurity:** Attempting to access a task from another organization returns `404 Not Found` rather than `403 Forbidden` to prevent leaking the existence of other tenants' data.

### Authentication & Token Rotation
- **Access Tokens:** Short-lived JWTs (default 15m).
- **Refresh Tokens:** Long-lived. Implements **Refresh Token Rotation**. When a refresh token is used, it is revoked and a new pair is issued.
- **Defense in Depth:** Refresh tokens are never stored in plain text. They are hashed using Bcrypt before being saved to the database.

### Role-Based Access Control (RBAC)
Layered access control enforced via route-level middleware and resource-level functions:
- `ADMIN`: Full access within the organization, including user management and all tasks/projects.
- `MANAGER`: Can manage projects and tasks, assign members. Cannot manage users.
- `MEMBER`: Can only view tasks explicitly assigned to them. Can only advance the status of their assigned tasks. Cannot edit task details or delete tasks.

### State Machine & Task Status Flow
Tasks follow a strict, test-driven state machine:
```txt
TODO -> IN_PROGRESS -> IN_REVIEW -> DONE
```
- `BLOCKED` is a lateral state reachable from any active state (`TODO`, `IN_PROGRESS`, `IN_REVIEW`).
- A blocked task can return to `IN_PROGRESS`.
- `DONE` is a terminal state. Setting a task to `DONE` automatically populates the `completedAt` timestamp.

---

## ⚡ Performance Optimization

### Database Indexing Strategy
Indexes are strategically placed on the most queried fields and combinations to support the primary listing queries:
- `[status]`, `[assigneeId]`, `[dueDate]`
- **Composite Indexes:** `[organizationId, assigneeId]` and `[organizationId, status]` perfectly match the multi-tenant listing query patterns.

### Caching Strategy (Redis)
- Task list responses (`GET /tasks`) are cached in Redis.
- **Cache Keys:** Keys are highly specific, derived from the organization, pagination parameters, and filters (e.g., `tasks:{orgId}:page:{p}:limit:{l}:status:{s}:priority:{p}:assignee:{a}`).
- **Invalidation:** Mutating task endpoints (Create, Update, Delete, Status Change) clear the task-list cache for that specific organization. This ensures eventual consistency while heavily reducing DB load for read-heavy operations.

---

## 📖 Core API Endpoints

The API features a root `/` route providing basic info, and a `/health` endpoint. Full interactive documentation is available via Swagger at `/docs`.

### Auth
- `POST /auth/register` - Create org & initial admin user
- `POST /auth/login` - Authenticate & get tokens
- `POST /auth/refresh` - Rotate refresh token
- `POST /auth/logout` - Revoke refresh token

### Projects
- `GET /projects` - List organization projects
- `POST /projects` - Create a new project (Admin/Manager)

### Tasks
- `GET /tasks` - List tasks (Paginated, Filtered, Cached, Auto-scoped for Members)
- `POST /tasks` - Create task (Admin/Manager)
- `GET /tasks/:id` - Read task
- `PATCH /tasks/:id` - Update task details (Admin/Manager)
- `PATCH /tasks/:id/status` - Advance task state machine (Assignee/Manager/Admin)
- `DELETE /tasks/:id` - Delete task (Admin/Manager)

## Testing
Core business logic (Access Rules and State Machine) is covered by Vitest tests.
```bash
npm run test
```

## Deployment Notes (Railway)
- The application is optimized for PaaS deployments (like Railway Nixpacks) and containerized environments.
- Standalone configurations have been simplified to ensure seamless builds.
- Ensure `NEXT_PUBLIC_API_URL` is set in the web service environment variables to point to the deployed API URL.
