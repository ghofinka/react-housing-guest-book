# Digital Guest Book — Web UI

Web interface for a housing-complex digital guest book. Guards record visitors in and out at the
gate (on a tablet), house owners see the visitors of their own house, and admins manage houses,
users, data retention and the audit log. The UI is in Indonesian and all times are shown in WIB.

Built with [Ant Design](https://ant.design/) on Vite, React and TypeScript. It talks to a REST API
served under `/v1`.

## Tech stack

| Purpose | Library |
|---|---|
| Build & dev server | Vite 8, TypeScript 6 |
| UI | React 19, Ant Design 6, `@ant-design/icons` |
| Routing | React Router 8 |
| Data fetching & cache | TanStack Query 5 |
| Dates | dayjs (`Asia/Jakarta`, `id` locale) |
| Test & lint | Vitest, Testing Library, oxlint |

## Features by role

| Role | Screens |
|---|---|
| Guard | Check in a visitor, Guests inside (check-out), Visit history |
| House owner | My house's visitors (own house only) |
| Admin | Visit history, Houses, Users, Data retention, Audit log, Privacy notice |
| Public | `/login`, `/privasi` (privacy notice, target of the QR poster at the gate) |

Menu items tagged **Segera** ("coming soon": pre-registration, notifications, guest search,
export, statistics, watchlist, shift notes) are placeholders; the API has no endpoints for them yet.

Highlights:

- **Fast check-in on a tablet:** large category buttons, no name needed for couriers and ride-hailing
  drivers, license plates upper-cased automatically, and a vehicle photo required whenever a plate
  is entered.
- **Photos:** the camera opens straight from the form and images are compressed (max 1600 px, JPEG)
  before upload to save mobile data.
- **No duplicate visits:** every form carries a `client_request_id`, so resubmitting after a dropped
  connection doesn't create a second visit.
- **Sessions:** tokens are kept in `localStorage` and renewed automatically before they expire.
- **Privacy:** photos are fetched with an authenticated request and only loaded in the detail panel;
  every view is recorded in the audit log.

## Getting started

Requirements: Node.js and a running instance of the API.

```sh
npm install
npm run dev
```

Open http://localhost:5173 and sign in.

The dev server proxies `/v1` and `/privacy` to the API, so no CORS setup is needed locally. The
target address is printed when the server starts; override it with `API_PROXY_TARGET` in
`.env.local` (default `http://localhost:8080`). In DevTools, requests still appear to go to
`localhost:5173/v1/...`; that is expected, Vite forwards them. The dev server also listens on the
local network (`host: true`), so a tablet can open `http://<your-pc-ip>:5173`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with API proxy |
| `npm run build` | Type-check and production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit/component tests (Vitest + Testing Library) |
| `npm run lint` | oxlint |

### Environment variables

See `.env.example`.

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | API origin at build time. Leave empty to use the same origin (dev proxy or reverse proxy). |
| `API_PROXY_TARGET` | Where the dev server proxies API calls. Development only. |

## Production

Serve the contents of `dist/` and the API from the same origin (reverse-proxy `/v1` and `/privacy`
to the API), or set `VITE_API_BASE_URL` to the API origin at build time and configure the API's
CORS to allow this app's origin. Every client-side route must fall back to `index.html`.

## Project structure

```
src/
  api/          fetch client (Bearer token, single-flight refresh, ApiError), endpoint functions, types
  auth/         session hook (tokens in localStorage) and route guards
  hooks/        TanStack Query hooks, mutations, API error → antd form mapping
  components/   PhotoCapture, AuthImage, VisitDetailDrawer, tags
  layouts/      AppLayout (role-based menu, mobile drawer), "coming soon" menu config
  pages/        guard/ (check-in, inside), admin/ (houses, users, retention, audit, privacy), shared pages
  utils/        date/WIB formatting, labels, UUID, image compression
changelog/      one file per change, named ddmmyyyyhhmm.md
```

## Developer notes

- **Access control is enforced by the API.** Route guards only hide screens a role can't use. Owners
  are scoped to their house on the server; opening another house's visit returns 404.
- **Refresh tokens rotate.** Reusing an old one revokes the whole session, so `api/client.ts` allows
  only one refresh at a time (a shared promise plus a Web Lock across tabs). Don't call
  `/v1/auth/refresh` from anywhere else.
- **API errors** are already in Indonesian. 422 `details` are mapped onto form fields by name, so
  form field names must match the API's JSON field names.
- **Privacy notice caching:** the API marks `/v1/privacy-notice` as cacheable for 5 minutes; the app
  requests it with `cache: 'no-cache'` so an admin's edits show up immediately.
