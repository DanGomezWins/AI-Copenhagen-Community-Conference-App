# AIC Info

Mobile PWA for **AI Meetup Copenhagen Community Conference #1** —
Thursday 10 September 2026, twoday København (Sundkaj 125, Nordhavn).

Three tabs: **Feed** (live organiser updates) · **Program** (Main stage / Demos /
Open sessions) · **Networking** (attendee directory).

See [PLAN.md](PLAN.md) for the full build plan, data model, and timeline.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router, TypeScript, Tailwind v4) |
| Data / auth / storage | Supabase (EU West, Ireland) |
| Hosting | Railway (EU West) |
| AI | `claude-opus-5` — vision OCR for the Open Sessions schedule |

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build + typecheck |
| `npm run start` | Serve the production build (binds `$PORT`) |
| `npm run typecheck` | Types only, no build |

## Environment

Copy `.env.example` to `.env.local`. **Never commit `.env.local`** — it is gitignored.
The same variables go into Railway → Variables for production.

`GET /api/health` reports which variables are present without ever printing their values —
useful for confirming a deploy is configured correctly.

## Deployment

Railway builds from `main` via Railpack (auto-detects Node) and serves `npm run start`.
Config lives in `railway.json`; healthcheck is `/api/health`.
