# HelpDesk Frontend

Standalone **React 19 + Vite + TypeScript** SPA for the HelpDesk system.

## Stack

- React 19, TypeScript, Vite 7
- Tailwind CSS v4, shadcn/ui
- Redux Toolkit, TanStack Query
- React Router v7, React Hook Form, Zod
- Axios (JWT + refresh-token interceptors)
- SignalR client (real-time notifications)

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

App runs at <http://localhost:5173>. It expects the ASP.NET Core API at the
URL in `VITE_API_BASE_URL` (default `https://localhost:5001/api`).

## Environment variables

| Variable             | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `VITE_API_MODE`      | `api` to call the real backend, `mock` for in-memory mode  |
| `VITE_API_BASE_URL`  | Base URL of the ASP.NET Core API (e.g. `https://localhost:5001/api`) |
| `VITE_SIGNALR_URL`   | URL of the SignalR notifications hub                       |

## Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – production build to `dist/`
- `npm run preview` – preview the production build

## Project layout

```
src/
├── components/      # UI + layout (shadcn/ui)
├── features/        # Auth gate
├── hooks/           # TanStack Query hooks (useApi.ts)
├── lib/api/         # Axios client, real/mock APIs, SignalR, token store
├── lib/auth/        # Permission helpers, <Can /> component
├── pages/           # Route pages (auth, tickets, admin, dashboard)
├── store/           # Redux Toolkit slices
├── types/           # Shared TypeScript types
└── main.tsx         # App entry (router + providers)
```

## Backend

See [../helpdesk-backend/README.md](../helpdesk-backend/README.md).
