# FitStudio

Multi-tenant SaaS booking platform for boutique fitness studios across Spain,
the UAE and Lebanon.

| Layer        | Stack                                                  |
|--------------|--------------------------------------------------------|
| Framework    | Next.js 14 (App Router) + TypeScript                   |
| UI           | Tailwind CSS + shadcn/ui (Radix primitives)            |
| Auth         | Clerk (3 roles: OWNER / STAFF / MEMBER)                |
| Database     | PostgreSQL (Neon) + Prisma ORM                         |
| Multi-tenant | Subdomain routing (`{slug}.fitstudio.app`)             |
| Package mgr  | pnpm                                                   |

## Project structure

```
apps/fitstudio/
├── app/
│   ├── (dashboard)/         Studio owner dashboard (auth + role-gated)
│   │   ├── dashboard/       Overview metrics
│   │   ├── classes/         Schedule view
│   │   ├── members/         Member roster
│   │   ├── payments/        Billing (owners only)
│   │   ├── settings/        Studio profile (owners only)
│   │   └── layout.tsx       Sidebar shell + role check
│   ├── (member)/            Public booking portal
│   │   ├── layout.tsx       Branded header / footer
│   │   └── page.tsx         Upcoming classes + member bookings
│   ├── api/webhooks/clerk/  Clerk → Prisma user sync
│   ├── sign-in/, sign-up/   Clerk catch-all pages
│   ├── layout.tsx           Root layout with ClerkProvider
│   ├── globals.css          Tailwind base + shadcn tokens
│   └── not-found.tsx        Fallback for unknown tenants
├── components/
│   ├── ui/                  shadcn primitives (button, card, sheet, ...)
│   ├── dashboard/           Sidebar, mobile drawer, top bar
│   └── member/              Studio header, class card
├── lib/
│   ├── prisma.ts            Prisma singleton
│   ├── tenant.ts            Subdomain resolution + caching
│   ├── auth.ts              Role helpers (requireOwner / Staff / Member)
│   ├── currency.ts          Locale-aware money formatting
│   ├── nav.ts               Dashboard nav config
│   └── utils.ts             `cn`, `slugify`, `formatDateTime`
├── prisma/
│   ├── schema.prisma        Full multi-tenant schema
│   └── seed.ts              Idempotent demo seed
├── public/                  Static assets
├── middleware.ts            Tenant + Clerk middleware
├── tailwind.config.ts
├── next.config.mjs
├── components.json          shadcn config
├── tsconfig.json
├── package.json
└── .env.example
```

## Multi-tenancy

Each studio gets its own subdomain (`acme.fitstudio.app`,
`dunes.fitstudio.app`). On every request `middleware.ts` extracts the
slug from the `Host` header and stamps it onto the request as the
`x-fitstudio-tenant` header. Server Components read it back via
`lib/tenant.ts`, which loads and memoises the `Studio` row for the
remainder of the render.

Local development cannot reliably use subdomains on `localhost`, so the
middleware also accepts a `?studio=<slug>` query parameter. Example:

```
http://localhost:3001/?studio=acme            → member portal for "acme"
http://localhost:3001/dashboard?studio=acme   → dashboard for "acme"
```

Every Prisma query is scoped by `studioId`, which is a non-null FK on every
domain model. Cross-tenant access is impossible at the data layer.

## Prerequisites

- Node 20 (`nvm use` reads the repo-root `.nvmrc`)
- pnpm 9+
- A Postgres database — [Neon](https://neon.tech) free tier works well
- A Clerk application (https://dashboard.clerk.com)

## Setup

```bash
# From the monorepo root
pnpm install

# Copy env template and fill in DATABASE_URL + Clerk keys
cp apps/fitstudio/.env.example apps/fitstudio/.env

# Generate Prisma client and create tables
pnpm --filter @fitstudio/web run db:generate
pnpm --filter @fitstudio/web run db:push

# Optional: seed two demo studios
pnpm --filter @fitstudio/web run db:seed

# Start the dev server on http://localhost:3001
pnpm --filter @fitstudio/web run dev
```

Open `http://localhost:3001/?studio=acme` to see the member portal for the
seeded `Acme Pilates Madrid` tenant.

## Clerk webhook

The endpoint at `/api/webhooks/clerk` keeps the local `User` table in sync
with Clerk. Register it in the Clerk dashboard with the
`user.created`, `user.updated` and `user.deleted` events, then add the
signing secret to `CLERK_WEBHOOK_SECRET` in `.env`.

Each user must carry `publicMetadata.studioId` (or `studioSlug`) plus an
optional `role` (`OWNER` / `STAFF` / `MEMBER`). The webhook resolves the
studio, persists the user and forwards the role. Studio owners populate
this metadata when inviting teammates or members via Clerk's admin API.

## Roles

| Role     | Access                                                   |
|----------|----------------------------------------------------------|
| `OWNER`  | Full dashboard, settings, billing, member management.    |
| `STAFF`  | Schedule + member roster. Cannot see Payments / Settings.|
| `MEMBER` | Member portal only (book classes, view own bookings).    |

Role enforcement lives in `lib/auth.ts` (`requireOwner`, `requireStaff`,
`requireMember`) and is consumed by every dashboard page/layout.

## Environment variables

See `.env.example`. The four required keys are:

- `DATABASE_URL` — Postgres (Neon) connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

## Scripts

| Command                  | Purpose                                        |
|--------------------------|------------------------------------------------|
| `pnpm dev`               | Start Next.js dev server on port 3001          |
| `pnpm build`             | Generate Prisma client + production build      |
| `pnpm start`             | Run the production build                       |
| `pnpm typecheck`         | TypeScript no-emit check                       |
| `pnpm lint`              | Next.js ESLint                                 |
| `pnpm db:generate`       | Regenerate Prisma client                       |
| `pnpm db:push`           | Sync schema to the database without migrations |
| `pnpm db:migrate`        | Create + apply a migration                     |
| `pnpm db:studio`         | Open Prisma Studio                             |
| `pnpm db:seed`           | Insert two demo tenants                        |

## License

Proprietary. All rights reserved.
