# Amwali

Amwali is an iOS-based Payment Initiation Service (PISP). The product ships as
a system-wide custom iOS keyboard, letting users send bank-to-bank transfers
from inside any chat app (WhatsApp, iMessage, Telegram, etc.) without
context-switching. Amwali never holds funds — money moves directly between
banks via open banking APIs (Lean in UAE, Flutterwave in Ghana). Amwali is
the UX and orchestration layer only.

> **Status:** Phase 1 scaffold. All payment flows run against
> `MockPaymentProvider`. Real provider integrations (Lean, Flutterwave) and
> real KYC (Sumsub/Onfido) are Phase 2.

## Architecture at a glance

| Layer | Stack | Lives in |
|---|---|---|
| iOS companion app | Swift 5.9+, SwiftUI, iOS 17+ | `ios/Amwali/` |
| iOS keyboard extension | Swift, UIKit (UIInputViewController) | `ios/AmwaliKeyboard/` |
| iOS shared framework | Swift dynamic framework | `ios/AmwaliKit/` |
| Backend API | Node 20, TypeScript, Fastify, Prisma | `backend/` |
| Datastore | PostgreSQL 15, Redis 7 | `infra/docker-compose.yml` |
| API contract | OpenAPI 3.1 (single source of truth) | `shared/openapi/amwali.yaml` |

The full architecture is in [`docs/plans/2026-05-03-initial-architecture.md`](docs/plans/2026-05-03-initial-architecture.md).

## Repository layout

```
backend/    Fastify + Prisma + Vitest backend
ios/        Xcode workspace with main app, keyboard extension, shared framework
shared/     OpenAPI contract + generated TS types
infra/      docker-compose for local Postgres + Redis
docs/       Plans, ADRs, runbooks, generated API docs
.github/    CI workflows
```

## Prerequisites

- Node.js 20 (`nvm use` reads `.nvmrc`)
- pnpm 9+
- Docker (for Postgres/Redis)
- Xcode 15+ on macOS (for iOS work)

## Quickstart

```bash
# 1. Install JS deps
pnpm install

# 2. Boot Postgres + Redis
pnpm infra:up

# 3. Apply database schema
pnpm --filter @amwali/backend run db:migrate

# 4. Start the backend
pnpm --filter @amwali/backend run dev

# 5. Hit /health
curl http://localhost:3000/health
```

For iOS setup see [`ios/SETUP.md`](ios/SETUP.md).

## Non-negotiable design principles

1. **Idempotency** on every payment endpoint — `Idempotency-Key` header,
   replay returns the same result.
2. **Explicit transfer state machine**: `pending → authorized → submitted →
   completed | failed | reversed`. Every transition persisted to the
   append-only `transfer_events` audit table.
3. **Audit log every action that touches money or user data.**
4. **Never log sensitive data** — no credentials, no full account numbers,
   no tokens. Centralised redaction.
5. **Provider-agnostic banking layer** — `PaymentProvider` interface with
   `MockPaymentProvider` in Phase 1; Lean and Flutterwave plug in later.
6. **Keyboard extension stays thin** — Apple reviews financial keyboards
   strictly. All real logic lives in the main app or backend.
7. **Recipient is never auto-detected from chat content** (chat apps are E2E
   encrypted). Users pick recipients explicitly from Amwali contacts.

## Documentation

- [Architecture plan](docs/plans/2026-05-03-initial-architecture.md)
- [iOS setup guide](ios/SETUP.md)
- [Architectural Decision Records](docs/adr/)
- [Runbooks](docs/runbooks/)

## License

Proprietary. All rights reserved.
