# Task Management Backend

Node 22 + Express 5 + TypeScript (strict) + Prisma v6 + PostgreSQL + Zod + Swagger UI.

## Setup

```bash
npm install
cp .env.example .env   # then fill secrets
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

- API: http://localhost:3000/api (`/health`)
- Swagger: http://localhost:3000/api-docs (JSON at `/api-docs.json`)

## Scripts

| Script            | Command                |
| ----------------- | ---------------------- |
| `npm run dev`     | `tsx watch src/server.ts` |
| `npm run build`   | `tsc`                  |
| `npm start`       | `node dist/server.js`  |
| `npm run prisma:generate` | `prisma generate` |
| `npm run prisma:migrate`  | `prisma migrate dev` |
| `npm run prisma:seed`     | `tsx prisma/seed.ts` |
| `npm run prisma:drop`     | `tsx prisma/drop.ts` (xóa sạch data, giữ migration) |
| `npm run prisma:studio`   | `prisma studio` |

## Auth

- `POST /api/auth/login` → `{ accessToken (1h), refreshToken (7d), user }`
- `POST /api/auth/refresh` → rotates pair (old token → 401)
- `POST /api/auth/logout` → always 200
- `GET /api/auth/me` → bearer required
- Locked accounts → 403 even with valid token.
- Legacy `POST /api/users` → `410 Gone`, use `POST /api/admin/users` (SUPERADMIN).

## Notes

- Refresh tokens are stored as SHA-256 hex (never bcrypt — bcrypt truncates at 72 bytes).
- `GET /api/projects/mine` is registered before `GET /api/projects/:id`.
- Task detail includes `statusLogs` asc + `changedBy`; list does not.
- Dashboard: SUPERADMIN → `GLOBAL` (+ users + byProject); others → `PROJECTS` + `PERSONAL`.
