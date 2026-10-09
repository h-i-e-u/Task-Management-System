# Task Management Frontend

Vite + React 19 + TypeScript (strict) + Tailwind CSS v4 + axios + react-router-dom v7 + dnd-kit + lucide-react.

## Setup

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api
npm run dev            # http://localhost:5173
```

Backend phải đang chạy ở `VITE_API_URL` (xem `../backend/README.md`).

## Tài khoản

- Đăng nhập bằng SUPERADMIN đã seed ở backend (`admin@example.com`, đã prefill sẵn ở form login).
- Chỉ SUPERADMIN thấy menu **Admin Users** và form tạo project/member.

## Cấu trúc

- `src/lib/api.ts` — axios + access token trong RAM, refresh trong localStorage, tự refresh 1 lần khi 401.
- `src/auth/` — AuthContext (login/logout/me).
- `src/components/ui.tsx` — Button/Card/Input/StatusDot/PriorityBadge/Avatar/EmptyState/Skeleton…
- `src/pages/` — Login, Register, Forgot/ResetPassword, Account (đổi pass), Dashboard, Projects, ProjectBoard (`/projects/:id/board`), AdminUsers.
- `src/components/board/` — ProjectHeader/Tabs, KanbanTab (kéo thả dnd-kit), TaskListTab, MembersTab, ActivityTab, CreateTaskModal.
