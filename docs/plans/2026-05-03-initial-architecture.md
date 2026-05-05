# Amwali — Initial Architecture Plan

## Context

Amwali is a greenfield iOS-based Payment Initiation Service (PISP). The product
ships as a system-wide custom iOS keyboard, so users can send bank-to-bank
transfers from inside *any* chat app (WhatsApp, iMessage, Telegram, Signal,
Slack, etc.) without context-switching. Amwali never holds funds — money moves
directly between banks via open banking APIs (Lean in UAE, Flutterwave in
Ghana). Amwali is the UX and orchestration layer only.

Three components: iOS companion app (SwiftUI), iOS keyboard extension, and a
Node.js + TypeScript + Fastify + PostgreSQL backend. Phase 1 ships behind a
`MockPaymentProvider`; Lean and Flutterwave integrations are Phase 2.

This plan covers the directory layout, tooling, database schema, payment
provider abstraction, backend API surface, and iOS target structure. It is the
input to scaffolding, which happens after this plan is approved and we exit
plan mode. Once approved, the same content will be copied to
`docs/plans/2026-05-03-initial-architecture.md`.

---

## 1. Monorepo directory structure

```
/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml        # lint, typecheck, test, build backend
│       ├── ios-ci.yml            # xcodebuild test on macOS runner
│       └── shared-contract.yml   # validate OpenAPI, check generated types
├── .vscode/
│   └── settings.json
├── backend/
│   ├── src/
│   │   ├── server.ts             # Fastify bootstrap
│   │   ├── config/
│   │   │   ├── env.ts            # zod-validated env
│   │   │   └── logger.ts         # pino + redaction
│   │   ├── plugins/              # Fastify plugins
│   │   │   ├── auth.ts           # JWT verify
│   │   │   ├── idempotency.ts    # Idempotency-Key middleware
│   │   │   ├── audit.ts
│   │   │   └── error-handler.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── otp.ts
│   │   │   │   └── tokens.ts
│   │   │   ├── users/
│   │   │   ├── kyc/
│   │   │   ├── contacts/
│   │   │   ├── bank-links/
│   │   │   ├── transfers/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── service.ts
│   │   │   │   ├── state-machine.ts
│   │   │   │   └── reconciler.ts # polls pending transfers
│   │   │   └── webhooks/
│   │   ├── providers/
│   │   │   ├── PaymentProvider.ts        # interface
│   │   │   ├── MockPaymentProvider.ts
│   │   │   ├── LeanProvider.ts           # Phase 2 stub
│   │   │   ├── FlutterwaveProvider.ts    # Phase 2 stub
│   │   │   └── registry.ts               # routes by currency/country
│   │   ├── lib/
│   │   │   ├── redact.ts
│   │   │   ├── money.ts
│   │   │   └── ids.ts            # ULID/UUID helpers
│   │   └── db/
│   │       ├── client.ts         # Prisma client singleton
│   │       └── seed.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/          # against ephemeral postgres
│   │   └── fixtures/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   └── Dockerfile
├── ios/
│   ├── Amwali.xcworkspace/
│   ├── Amwali.xcodeproj/
│   ├── Amwali/                   # main app target
│   ├── AmwaliKeyboard/           # keyboard extension target
│   ├── AmwaliKit/                # shared framework target
│   ├── AmwaliKitTests/
│   ├── AmwaliUITests/
│   ├── Configs/
│   │   ├── Debug.xcconfig
│   │   ├── Release.xcconfig
│   │   └── Shared.xcconfig
│   ├── Scripts/
│   │   ├── generate-api-models.sh   # OpenAPI -> Swift types
│   │   └── swiftlint.sh
│   └── .swiftlint.yml
├── shared/
│   ├── openapi/
│   │   └── amwali.yaml           # source of truth for API contract
│   ├── ts/                       # generated TS types for backend
│   │   └── package.json
│   └── README.md
├── docs/
│   ├── plans/
│   │   └── 2026-05-03-initial-architecture.md  # this plan, copied at scaffold time
│   ├── adr/                      # architectural decision records
│   │   └── 0001-record-format.md
│   ├── runbooks/
│   └── api/                      # generated HTML from OpenAPI
├── infra/
│   ├── docker-compose.yml        # postgres + redis for local dev
│   └── env/
│       ├── .env.example
│       └── .env.test.example
├── .editorconfig
├── .gitignore
├── .gitattributes
├── .nvmrc
├── package.json                  # workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

Key files: `pnpm-workspace.yaml` (declares `backend`, `shared/ts`), root
`package.json` (workspace scripts, no app code), `shared/openapi/amwali.yaml`
(canonical API contract), `infra/docker-compose.yml` (Postgres 15 + Redis 7).

---

## 2. Package manager and tooling

| Choice | Pick | Why |
|---|---|---|
| JS package manager | **pnpm** | Strict workspace deps, fast install, content-addressable store, no phantom dependencies. Standard for TS monorepos in 2026. |
| Build orchestrator | **Plain pnpm workspaces (no Turborepo / Nx) for now** | Only one TS app (`backend`) plus one types package (`shared/ts`). Turborepo's caching value kicks in with multiple TS packages. Easy to add later — no Turborepo lock-in cost. |
| Node version | **20 LTS** | Brief specifies 20+. `.nvmrc` pins it. |
| TS config | strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` | Catch payment-critical mistakes at compile time. |
| Web framework | **Fastify** | Per brief. Schema-first, fast, first-class TS, plugin model maps cleanly to our module split. |
| ORM | **Prisma** | Per brief. Migrations, typed client. Caveat: we'll use raw SQL for the audit-log insert and idempotency upsert (Prisma's transactions are awkward for "insert and return"). |
| Validation | **Zod** | Runtime validation at API boundaries; `zod-to-openapi` to keep OpenAPI and code in sync. |
| Logging | **pino** with custom redaction paths | Structured JSON, fast, pino-pretty for dev. |
| Test | **Vitest** | Per brief. `@fastify/inject` for HTTP-level integration tests. |
| Lint/format | **ESLint flat config + Prettier** | ESLint 9 flat config; Prettier handles formatting. |
| Pre-commit | **Husky + lint-staged** | Format and typecheck on commit. |
| API contract | **OpenAPI 3.1 in `shared/openapi/`** | Single source of truth; generates TS types via `openapi-typescript` and Swift models via `swift-openapi-generator`. Keeps iOS and backend honest. |
| Container | Dockerfile per app, docker-compose for local Postgres+Redis | Standard. |
| iOS deps | **Swift Package Manager** | Native, no Ruby/CocoaPods toolchain. Add packages via Xcode. |
| iOS project gen | **Raw .xcodeproj checked in** for Phase 1 | Tuist is great for >3 targets / multiple environments but adds a learning curve. Raw xcodeproj is fine for our scope; can migrate to Tuist if target count grows. |
| iOS lint | **SwiftLint** via build phase + CI | Per brief. |

Workspace declares: `backend`, `shared/ts`. `ios/` is not a JS workspace — it's
adjacent in the monorepo and has its own toolchain.

---

## 3. PostgreSQL schema (Phase 1)

Conventions: `id UUID` primary keys (UUIDv7 generated app-side for time-sortable
ids), `TIMESTAMPTZ` everywhere, soft-delete via `deleted_at` only where the
business needs it, money stored as `BIGINT amount_minor` + `TEXT currency`
(never floats).

### `users`
```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY,
  email           CITEXT NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ,
  phone_e164      TEXT UNIQUE,
  phone_verified_at TIMESTAMPTZ,
  full_name       TEXT,
  country         TEXT NOT NULL CHECK (country IN ('AE','GH')),
  kyc_status      TEXT NOT NULL DEFAULT 'unverified'
                  CHECK (kyc_status IN ('unverified','pending','approved','rejected')),
  kyc_provider    TEXT,            -- 'mock' in Phase 1
  kyc_reference   TEXT,            -- vendor's applicant id
  kyc_decided_at  TIMESTAMPTZ,
  biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
```

### `otp_codes` (issued before sessions exist; supports signup + login)
```sql
CREATE TABLE otp_codes (
  id              UUID PRIMARY KEY,
  email           CITEXT NOT NULL,
  user_id         UUID REFERENCES users(id),    -- nullable during signup
  code_hash       TEXT NOT NULL,                -- HMAC, never plaintext
  purpose         TEXT NOT NULL CHECK (purpose IN ('signup','login','step_up')),
  attempts        INT NOT NULL DEFAULT 0,
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON otp_codes (email, purpose) WHERE consumed_at IS NULL;
```

### `sessions`
```sql
CREATE TABLE sessions (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,      -- SHA-256 of token
  parent_session_id UUID REFERENCES sessions(id), -- for rotation reuse-detection
  device_id       TEXT,                         -- iOS identifierForVendor
  device_name     TEXT,
  user_agent      TEXT,
  ip_address      INET,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  revoked_reason  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON sessions (user_id) WHERE revoked_at IS NULL;
```

### `contacts` (recipients saved by the user)
```sql
CREATE TABLE contacts (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name    TEXT NOT NULL,
  phone_e164      TEXT NOT NULL,
  country         TEXT NOT NULL CHECK (country IN ('AE','GH')),
  routing         JSONB NOT NULL,
  -- AE: { "type": "iban", "iban": "AE070331234567890123456" }
  -- GH: { "type": "bank_account", "bank_code": "GCB", "account_number": "1234567890" }
  is_favorite     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);
CREATE UNIQUE INDEX ON contacts (user_id, phone_e164) WHERE deleted_at IS NULL;
CREATE INDEX ON contacts (user_id, is_favorite DESC, display_name);
```

### `bank_links` (the user's own linked source accounts)
```sql
CREATE TABLE bank_links (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('mock','lean','flutterwave')),
  provider_link_ref TEXT NOT NULL,    -- provider's identifier
  institution_id  TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  display_name    TEXT,
  account_last4   TEXT,                -- last 4 only — full number never stored
  currency        TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('active','expired','revoked','error')),
  consent_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (provider, provider_link_ref)
);
CREATE INDEX ON bank_links (user_id) WHERE deleted_at IS NULL;
```

### `transfers`
```sql
CREATE TABLE transfers (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  bank_link_id    UUID NOT NULL REFERENCES bank_links(id),
  contact_id      UUID NOT NULL REFERENCES contacts(id),
  provider        TEXT NOT NULL,
  provider_payment_id TEXT,
  amount_minor    BIGINT NOT NULL CHECK (amount_minor > 0),
  currency        TEXT NOT NULL,
  state           TEXT NOT NULL DEFAULT 'pending'
                  CHECK (state IN ('pending','authorized','submitted','completed','failed','reversed')),
  failure_code    TEXT,
  failure_message TEXT,
  bank_reference  TEXT,
  reference       TEXT,                -- shown in bank statement
  initiated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  authorized_at   TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  reversed_at     TIMESTAMPTZ
);
CREATE INDEX ON transfers (user_id, initiated_at DESC);
CREATE INDEX ON transfers (state, initiated_at)
  WHERE state IN ('pending','authorized','submitted'); -- reconciler poll
CREATE UNIQUE INDEX ON transfers (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
```

### `transfer_events` (append-only audit log)
```sql
CREATE TABLE transfer_events (
  id              BIGSERIAL PRIMARY KEY,
  transfer_id     UUID NOT NULL REFERENCES transfers(id),
  from_state      TEXT,
  to_state        TEXT NOT NULL,
  reason          TEXT,
  actor           TEXT NOT NULL,       -- 'user:{id}' | 'system' | 'provider:{name}' | 'webhook:{name}'
  payload         JSONB,                -- redacted provider response/webhook body
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON transfer_events (transfer_id, occurred_at);
-- enforce append-only via REVOKE UPDATE, DELETE on app role
```

### `idempotency_keys`
```sql
CREATE TABLE idempotency_keys (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  endpoint        TEXT NOT NULL,        -- 'POST /v1/transfers'
  request_hash    TEXT NOT NULL,        -- SHA-256 of canonical body
  status          TEXT NOT NULL CHECK (status IN ('in_flight','completed')),
  response_status INT,
  response_body   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, key)
);
CREATE INDEX ON idempotency_keys (expires_at);
```

Behavior:
- Same key + same body → return cached response (replay safe).
- Same key + different body → 409 Conflict (`idempotency_key_mismatch`).
- Same key, prior request still `in_flight` → 409 Conflict (`idempotency_key_in_flight`).
- TTL: 24h.

### Trigger / role rules
- `audit_app` role has `INSERT`-only on `transfer_events`. App connects as
  `app` (DML on everything except UPDATE/DELETE on `transfer_events`) and
  switches role for audit inserts via `SET LOCAL ROLE`.
- `updated_at` trigger on each mutable table.

---

## 4. PaymentProvider TypeScript interface

Lives in `backend/src/providers/PaymentProvider.ts`. Designed so that
initiation returns immediately (often in a non-final state) and the truth about
status comes from webhooks plus a polling reconciler.

```typescript
// Money — always minor units; bigint serialized as string at HTTP boundary.
export interface Money {
  amountMinor: bigint;
  currency: 'AED' | 'GHS' | string;
}

export type TransferState =
  | 'pending'      // accepted by us, not yet sent to bank
  | 'authorized'   // user has authorized at their bank (SCA passed)
  | 'submitted'    // sent to bank rails
  | 'completed'    // bank confirmed credit
  | 'failed'
  | 'reversed';

export type Routing =
  | { type: 'iban'; iban: string }
  | { type: 'bank_account'; bankCode: string; accountNumber: string };

// ---------- Bank linking ----------

export interface BankLinkSession {
  providerSessionId: string;
  authorizationUrl: string;       // iOS opens in ASWebAuthenticationSession
  expiresAt: Date;
}

export interface BankLinkResult {
  providerLinkRef: string;
  institutionId: string;
  institutionName: string;
  accountLast4: string;
  currency: string;
  consentExpiresAt: Date | null;
}

// ---------- Initiation ----------

export interface InitiateTransferRequest {
  idempotencyKey: string;
  ourTransferId: string;          // we set; provider should round-trip if it can
  bankLinkRef: string;            // provider's link ref from BankLinkResult
  amount: Money;
  destination: Routing;
  reference: string;              // appears on bank statement; provider may truncate
  metadata?: Record<string, string>;
}

export interface InitiateTransferResult {
  providerPaymentId: string;
  state: TransferState;           // typically 'pending' or 'authorized'
  authorizationUrl?: string;      // SCA redirect, when required
  raw: unknown;                   // stored verbatim in transfer_events.payload (redacted)
}

// ---------- Status ----------

export interface TransferStatus {
  providerPaymentId: string;
  state: TransferState;
  failureCode?: string;
  failureMessage?: string;
  bankReference?: string;
  raw: unknown;
}

// ---------- Webhooks ----------

export interface ProviderWebhookEvent {
  providerPaymentId: string;
  state: TransferState;
  failureCode?: string;
  failureMessage?: string;
  bankReference?: string;
  occurredAt: Date;
  raw: unknown;
}

export class WebhookSignatureError extends Error {}

// ---------- Provider contract ----------

export interface PaymentProvider {
  readonly name: 'mock' | 'lean' | 'flutterwave';
  readonly supportedCountries: readonly string[];
  readonly supportedCurrencies: readonly string[];

  // Bank linking (open-banking consent flow)
  createBankLinkSession(params: {
    userId: string;
    country: string;
    redirectUri: string;
  }): Promise<BankLinkSession>;

  completeBankLink(params: {
    providerSessionId: string;
    callbackParams: Record<string, string>;
  }): Promise<BankLinkResult>;

  revokeBankLink(params: { providerLinkRef: string }): Promise<void>;

  // Payment initiation — fire and forget. State updates arrive via webhook
  // or are polled with getTransferStatus.
  initiateTransfer(req: InitiateTransferRequest): Promise<InitiateTransferResult>;

  // Polling fallback for the reconciler (every N minutes for non-terminal transfers)
  getTransferStatus(providerPaymentId: string): Promise<TransferStatus>;

  // Verify signature and parse webhook body. Throws WebhookSignatureError on bad sig.
  parseWebhook(params: {
    rawBody: Buffer;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<ProviderWebhookEvent>;
}
```

`MockPaymentProvider` for Phase 1:
- `createBankLinkSession` returns a fake auth URL pointing back to backend
  `/v1/dev/mock-bank/authorize?session=...` (only mounted in non-prod).
- `completeBankLink` returns one of three fake UAE banks.
- `initiateTransfer` branches on a configurable **SCA threshold** (per-currency
  env vars, defaults: `SCA_THRESHOLD_AED=500`, `SCA_THRESHOLD_GHS=1500` —
  roughly USD 100-equivalent each). Below the threshold it returns
  `state: 'authorized'` synchronously (low-value exemption, mirroring PSD2 /
  SAMA rules). At or above the threshold it returns `state: 'pending'` plus an
  `authorizationUrl` pointing at the dev-only `/v1/dev/mock-bank/authorize`
  endpoint; iOS opens that in `ASWebAuthenticationSession`, the user "approves"
  on a fake bank screen, and the callback drives `pending → authorized`.
- After authorization (either path), the mock schedules a delayed (5–15s,
  configurable) call to its own webhook endpoint to drive `authorized →
  submitted → completed`. Configurable failure injection via metadata
  (`__mock_fail: 'insufficient_funds' | 'rejected_by_bank' | 'timeout'`).
- `parseWebhook` validates an HMAC-SHA256 signature using a dev-only secret.

`LeanProvider` and `FlutterwaveProvider` are checked-in stubs that throw
`NotImplementedError` and exist purely so the registry compiles in Phase 2.

Provider registry (`providers/registry.ts`) chooses provider by
`(country, currency)` tuple and an env flag `PROVIDER_OVERRIDE` for tests.

---

## 5. Backend API surface

All endpoints under `/v1`. JSON request/response. `Content-Type: application/json`.

Auth header: `Authorization: Bearer <access-jwt>`. Access TTL 15 min.

Error envelope (every non-2xx):
```json
{ "error": { "code": "snake_case", "message": "...", "details": {} } }
```

Idempotency: required on `POST /v1/transfers` and any future state-mutating
money endpoint. Header `Idempotency-Key: <client-generated-uuid-v7>`.

Rate limits enforced per IP and per user; specific limits in the runbook.

### Auth (no auth required)
| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/v1/auth/signup` | `{ email, country }` | `202 { signup_id }` | Sends OTP. Email lowercased, validated. |
| POST | `/v1/auth/signup/verify` | `{ signup_id, code }` | `200 { user, access_token, refresh_token }` | Creates user, opens session. |
| POST | `/v1/auth/login/request` | `{ email }` | `202 {}` | Sends OTP. Always 202 even for unknown email (avoid enumeration). |
| POST | `/v1/auth/login/verify` | `{ email, code }` | `200 { user, access_token, refresh_token }` | Opens session. |
| POST | `/v1/auth/refresh` | `{ refresh_token }` | `200 { access_token, refresh_token }` | Rotates refresh; reuse triggers session revoke. |
| POST | `/v1/auth/logout` | `{ refresh_token }` | `204` | Revokes session. |

### User (auth required)
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/v1/me` | — | `200 { user }` |
| PATCH | `/v1/me` | `{ full_name?, phone_e164?, biometric_enabled? }` | `200 { user }` |
| POST | `/v1/me/phone/request` | `{ phone_e164 }` | `202 {}` (OTP) |
| POST | `/v1/me/phone/verify` | `{ code }` | `200 { user }` |
| DELETE | `/v1/me` | — | `204` (soft-delete; PII redacted, transfer history retained) |

### KYC (auth required) — mocked in Phase 1
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/v1/me/kyc/start` | — | `200 { kyc_session_id, redirect_url }` (mock returns synthetic URL) |
| POST | `/v1/me/kyc/complete` | `{ kyc_session_id }` | `200 { user }` (mock auto-approves) |

### Bank links (auth required)
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/v1/bank-links` | — | `200 { bank_links: [...] }` |
| POST | `/v1/bank-links/sessions` | `{ country }` | `200 { session_id, authorization_url, expires_at }` |
| POST | `/v1/bank-links/sessions/:id/complete` | `{ callback_params }` | `200 { bank_link }` |
| DELETE | `/v1/bank-links/:id` | — | `204` |

### Contacts (auth required)
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/v1/contacts?q=&favorite=&cursor=` | — | `200 { contacts, next_cursor }` |
| POST | `/v1/contacts` | `{ display_name, phone_e164, country, routing }` | `201 { contact }` |
| GET | `/v1/contacts/:id` | — | `200 { contact }` |
| PATCH | `/v1/contacts/:id` | partial | `200 { contact }` |
| DELETE | `/v1/contacts/:id` | — | `204` |

### Transfers (auth required)
| Method | Path | Body | Response | Idempotent |
|---|---|---|---|---|
| POST | `/v1/transfers` | `{ bank_link_id, contact_id, amount_minor, currency, reference }` | `201 { transfer, authorization_url? }` — `authorization_url` present only when amount ≥ SCA threshold for currency | **Yes** (header required) |
| POST | `/v1/transfers/:id/authorize/complete` | `{ callback_params }` | `200 { transfer }` | (idempotent by id) |
| POST | `/v1/transfers/:id/cancel` | — | `200 { transfer }` (only if `pending`/`authorized`) | |
| GET | `/v1/transfers/:id` | — | `200 { transfer }` | |
| GET | `/v1/transfers?state=&cursor=&from=&to=` | — | `200 { transfers, next_cursor }` | |

`transfer` shape:
```json
{
  "id": "uuid",
  "bank_link_id": "uuid",
  "contact": { "id": "uuid", "display_name": "...", "phone_e164": "..." },
  "amount_minor": "12345",
  "currency": "AED",
  "state": "submitted",
  "reference": "Coffee",
  "failure_code": null,
  "failure_message": null,
  "initiated_at": "2026-05-03T...",
  "authorized_at": "...",
  "submitted_at": "...",
  "completed_at": null
}
```
(`amount_minor` as string to avoid JS `Number` precision loss.)

### Webhooks (no user auth; signature-verified)
| Method | Path | Notes |
|---|---|---|
| POST | `/v1/webhooks/mock` | Phase 1. HMAC-SHA256 in `X-Amwali-Signature`. |
| POST | `/v1/webhooks/lean` | Phase 2 stub — validates and 501s. |
| POST | `/v1/webhooks/flutterwave` | Phase 2 stub. |

Webhook handlers: parse → look up transfer by `provider_payment_id` → run
state-machine transition → append `transfer_events` row → 200. Idempotent on
event id.

### Health
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness. Returns 200 if process up. |
| GET | `/health/ready` | DB + Redis ping. |

---

## 6. iOS project structure

### Targets

| Target | Bundle ID | Type | Purpose |
|---|---|---|---|
| Amwali | `com.amwali.app` | iOS App | Onboarding, KYC, bank linking, contacts, history, settings. |
| AmwaliKeyboard | `com.amwali.app.keyboard` | Custom Keyboard Extension | Numeric keypad, recipient picker, Face ID, send. |
| AmwaliKit | `com.amwali.shared` | Dynamic Framework (embedded in both) | API client, models, keychain helpers, design tokens. |
| AmwaliKitTests | — | Unit Test Bundle | XCTest. |
| AmwaliUITests | — | UI Test Bundle | E2E happy paths. |

### Shared identifiers (decide now, hard to change later)

- **App Group**: `group.com.amwali.shared`
- **Keychain access group**: `$(AppIdentifierPrefix)com.amwali.shared`
  (the `$(AppIdentifierPrefix)` is your 10-char Team ID + dot — Xcode resolves it)
- **Universal Link domain**: `app.amwali.com` (Phase 2; for password-less / OAuth callbacks)

### What goes in the App Group container

Both targets read/write:
- `UserDefaults(suiteName: "group.com.amwali.shared")` — non-sensitive flags:
  current user id, email, biometric_enabled, last_synced_contacts_at, default_bank_link_id.
- A read-only SQLite or JSON cache of favorite contacts so the keyboard can
  render the picker without a network call.

### What goes in the shared Keychain

- `refresh_token` — `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`,
  access group set to the shared keychain group.
- `access_token` — same accessibility; short-lived.
- Biometric-gated key for "confirm transfer" — `LAContext` + Secure Enclave-backed
  key, used to sign a per-transfer challenge from the backend.

The keyboard reads tokens from the shared keychain — but **only when Full
Access is enabled** (see below).

### Folder layout inside `/ios`

```
/ios
├── Amwali.xcworkspace/
├── Amwali.xcodeproj/
├── Amwali/
│   ├── App/
│   │   ├── AmwaliApp.swift              # @main
│   │   └── AppRouter.swift
│   ├── Features/
│   │   ├── Onboarding/                  # email + OTP screens
│   │   ├── KYC/                         # mock flow
│   │   ├── BankLinking/                 # ASWebAuthenticationSession host
│   │   ├── Contacts/
│   │   ├── History/
│   │   └── Settings/
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   └── Localizable.strings
│   ├── Info.plist
│   └── Amwali.entitlements
├── AmwaliKeyboard/
│   ├── KeyboardViewController.swift     # UIInputViewController subclass
│   ├── Views/
│   │   ├── NumericKeypadView.swift
│   │   ├── CurrencyToggle.swift
│   │   ├── RecipientPickerView.swift
│   │   ├── ConfirmSheet.swift           # Face ID prompt
│   │   └── NoFullAccessView.swift       # graceful degradation
│   ├── KeyboardSession.swift            # reads shared keychain + defaults
│   ├── Info.plist                       # NSExtension dict + RequestsOpenAccess=YES
│   └── AmwaliKeyboard.entitlements
├── AmwaliKit/
│   ├── API/
│   │   ├── APIClient.swift
│   │   ├── Endpoints.swift
│   │   └── Generated/                   # swift-openapi-generator output
│   ├── Auth/
│   │   ├── KeychainStore.swift          # uses shared access group
│   │   ├── TokenRefresher.swift         # actor-isolated
│   │   └── BiometricSigner.swift        # Secure Enclave
│   ├── Storage/
│   │   └── SharedDefaults.swift         # App Group UserDefaults wrapper
│   ├── Domain/
│   │   ├── Money.swift
│   │   ├── Contact.swift
│   │   ├── Transfer.swift
│   │   └── TransferState.swift
│   ├── DesignSystem/
│   │   ├── Tokens.swift
│   │   ├── Colors.swift
│   │   └── Typography.swift
│   └── Logging/
│       └── Logger.swift                 # OSLog with redaction
├── AmwaliKitTests/
├── AmwaliUITests/
├── Configs/
│   ├── Shared.xcconfig
│   ├── Debug.xcconfig
│   └── Release.xcconfig
└── Scripts/
    ├── generate-api-models.sh
    └── swiftlint.sh
```

### Entitlements (key flags explained)

**Amwali.entitlements (main app)**
```xml
<key>com.apple.security.application-groups</key>
<array><string>group.com.amwali.shared</string></array>

<key>keychain-access-groups</key>
<array><string>$(AppIdentifierPrefix)com.amwali.shared</string></array>

<key>com.apple.developer.associated-domains</key>
<array><string>applinks:app.amwali.com</string></array>   <!-- Phase 2 -->
```

**AmwaliKeyboard.entitlements (extension)**
```xml
<key>com.apple.security.application-groups</key>
<array><string>group.com.amwali.shared</string></array>

<key>keychain-access-groups</key>
<array><string>$(AppIdentifierPrefix)com.amwali.shared</string></array>
```

**AmwaliKeyboard/Info.plist (must contain)**
```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionAttributes</key>
  <dict>
    <key>IsASCIICapable</key><false/>
    <key>PrefersRightToLeft</key><false/>
    <key>PrimaryLanguage</key><string>en-US</string>
    <key>RequestsOpenAccess</key><true/>     <!-- needed for network + shared keychain -->
  </dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.keyboard-service</string>
  <key>NSExtensionPrincipalClass</key>
  <string>$(PRODUCT_MODULE_NAME).KeyboardViewController</string>
</dict>
```

### What "Full Access" means and how we handle it

iOS keyboards are sandboxed harder than apps. By default they have:
- No network access
- No shared App Group container
- No shared Keychain
- No location, no contacts, etc.

Setting `RequestsOpenAccess: true` in the extension's Info.plist lets the user
**grant** Full Access, but they have to do it manually:
**Settings → General → Keyboard → Keyboards → Amwali → Allow Full Access**.

Until they do, our keyboard is dead — it cannot read the refresh token or call
the backend. So:
- On launch, `KeyboardViewController` checks `hasFullAccess` (UIInputViewController property).
- If false, render `NoFullAccessView` with a "How to enable" walkthrough and a
  deep link into Settings (best-effort; iOS limits this).
- If true but no session in shared keychain (user hasn't logged in to main app
  yet), render a "Open Amwali to sign in" view.
- Only when both conditions hold, render the keypad.

### Memory budget

Keyboard extensions get killed at ~48 MB resident. Implications:
- AmwaliKit must stay slim. If it grows, split a `AmwaliKitCore` (used by
  keyboard) from `AmwaliKitFull` (used only by app).
- No image-heavy assets in keyboard. SF Symbols and small vectors only.
- Profile keyboard with Instruments before each TestFlight build.

### App Review notes (for our own awareness)

Apple reviews financial keyboards strictly. Reviewer will verify:
1. We disclose Full Access usage and what data leaves the device.
2. Keyboard never logs or transmits typed text.
3. The keyboard's purpose is clear from screenshots (numeric keypad, not a
   substitute system keyboard).
4. Privacy policy enumerates what we send to the backend.

We bake this in from the start via the redaction layer + a "no logging of host
app text" invariant in `KeyboardViewController`.

---

## Cross-cutting concerns

### Idempotency
- `Idempotency-Key` header required on `POST /v1/transfers`.
- Client generates UUIDv7 per logical user action (one per "tap Send").
- Server stores `(user_id, key)` row; second request with same key + same
  body returns the cached response. Different body → 409.
- Keys expire after 24h.

### Audit logging
- Two layers: `transfer_events` (money) and a future `audit_log` (general).
  Phase 1 implements `transfer_events` only; the brief calls it out explicitly.
  Add `audit_log` in Phase 2 when KYC and bank-link operations matter for
  compliance.
- Append-only enforced at the DB role level.

### Redaction
- pino redact paths configured for: `*.password`, `*.token`, `*.refresh_token`,
  `*.access_token`, `*.code`, `*.iban`, `*.account_number`, `*.cvv`,
  `headers.authorization`, `headers["x-amwali-signature"]`.
- Provider responses are passed through `redact()` before being persisted to
  `transfer_events.payload`.
- iOS `Logger` wraps OSLog with a `private` interpolation default so payment
  data never lands in unified logs.

### State machine
- Single source of truth in `backend/src/modules/transfers/state-machine.ts`.
  Pure function: `(currentState, event) -> nextState | error`.
- All transitions go through it; `transfer_events` insert is in the same
  transaction as the `transfers` update.

### SCA threshold (Strong Customer Authentication)
- Per-currency env vars: `SCA_THRESHOLD_AED`, `SCA_THRESHOLD_GHS` (minor
  units; default AED 500.00 = `50000`, GHS 1500.00 = `150000`).
- A small helper `requiresSca(money: Money): boolean` lives in `lib/sca.ts`.
- The transfer service calls `requiresSca` before invoking
  `provider.initiateTransfer`. The provider also re-evaluates internally
  (Phase 2: real providers will enforce SCA per their own rules — the
  threshold check is advisory at our layer but drives the iOS UX).
- For Phase 1 mock: below threshold → fast path, no redirect. At or above →
  redirect path. Both paths are covered by integration tests.
- Phase 2 note: real PSD2/SAMA SCA also has *cumulative* exemption rules
  (e.g., total of recent low-value transfers can't exceed a cap before SCA
  is forced). Out of scope for Phase 1 mock.

### Phone number enforcement
- `users.phone_e164` stays nullable in the schema.
- Business rule: a verified phone number is required to *initiate a transfer*
  (not to sign up, not to add a contact, not to link a bank). Enforced at the
  transfer service layer, returning `403 { code: "phone_verification_required" }`.
- Phone is collected and OTP-verified during the KYC mock flow. The flow is
  walkable without phone for read-only actions, which makes the demo cleaner.

---

## Decisions

### Resolved (this session)

1. **Mock authorization flow** — *Hybrid by amount.* Below the per-currency
   SCA threshold the mock auto-authorizes (fast path); at or above the
   threshold the mock returns an `authorization_url` and iOS opens
   `ASWebAuthenticationSession` (redirect path). Defaults
   `SCA_THRESHOLD_AED=50000` and `SCA_THRESHOLD_GHS=150000` (minor units,
   ≈ USD 100 each); both env-configurable.
2. **Phone collection timing** — *During the KYC mock flow.*
   `users.phone_e164` stays nullable in the schema; the "phone verified"
   requirement is enforced at the transfer service layer, not at signup.
3. **Contact routing** — *Manual entry.* User types IBAN (UAE) or
   `bank_code + account_number` (Ghana) when creating a contact. No
   directory lookup.
4. **KYC PII** — *Minimal.* Only `kyc_status`, `kyc_provider`,
   `kyc_reference`, `kyc_decided_at` plus `full_name` on `users`. Raw
   identity data lives at the vendor (Sumsub/Onfido in Phase 2).

### Recommendations applied (flag if you want to revisit)

5. **Refresh token rotation** — Rotating refresh tokens with reuse-detection
   via `sessions.parent_session_id`. Higher security; small added complexity.
6. **Multi-tenant prep** — Skipping `organization_id` for Phase 1; the brief
   doesn't suggest white-label is on the roadmap. Easy to add later via a
   migration. Flag if I'm wrong about the roadmap.
7. **JWT signing** — HS256 in Phase 1 with a single secret in env. Plan a
   key-rotation ADR (RS256 with JWKS) before any production launch.

### Minor open items (defaults proposed; tell me if any are wrong)

- **SCA threshold values**: AED 500 / GHS 1500. Anchor was your "$100 or
  another threshold" — round numbers per currency feel cleaner than a strict
  USD-equivalent calc. Override via env.
- **Access token TTL**: 15 min. Refresh TTL: 30 days.
- **OTP code length / TTL**: 6 digits, 10-minute expiry, 5 attempts then
  invalidated.
- **Idempotency-Key TTL**: 24h.
- **Reconciler poll interval**: 60s for non-terminal transfers in Phase 1.

---

## Verification plan

Once scaffolded, this plan is verified by:

1. `pnpm install` at repo root succeeds; `pnpm -r typecheck` passes.
2. `docker-compose up -d` starts Postgres + Redis; `pnpm --filter backend
   prisma migrate dev` applies the schema cleanly.
3. `pnpm --filter backend dev` boots the API; `curl localhost:3000/health`
   returns 200.
4. `pnpm --filter backend test` runs Vitest unit + integration suites; the
   state-machine and idempotency suites pass before any other code is
   written (TDD seed).
5. The OpenAPI in `shared/openapi/amwali.yaml` validates with
   `redocly lint`; `openapi-typescript` regenerates `shared/ts` without diff.
6. `xcodebuild -workspace ios/Amwali.xcworkspace -scheme Amwali test`
   builds and runs the AmwaliKit unit tests on iOS Simulator.
7. The keyboard extension launches in Simulator; with Full Access disabled it
   shows the `NoFullAccessView`; enabling it surfaces the keypad.
8. End-to-end: signup → mock bank link → create contact → initiate transfer
   from keyboard in Messages → see "✅ Sent X AED via Amwali" inserted into
   the chat → see the transfer in history with `state: completed` after the
   mock webhook fires.

---

## What happens at scaffold time (post-approval, post-plan-mode)

1. Copy this plan to `docs/plans/2026-05-03-initial-architecture.md`.
2. Initialize root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`,
   `.gitignore`, `.editorconfig`, `.nvmrc`, `README.md`.
3. Scaffold `backend/` with Fastify + Prisma + Vitest skeleton. Write the
   migration for the schema in section 3. Write the state machine and
   idempotency middleware with passing tests, no routes yet.
4. Scaffold `shared/openapi/amwali.yaml` from section 5; wire generators.
5. Implement `PaymentProvider` interface + `MockPaymentProvider` from
   section 4, with tests.
6. Implement routes module by module: auth → users → contacts → bank-links →
   transfers → webhooks. Each module ships with tests before merging.
7. Initialize the iOS Xcode project per section 6. Wire AmwaliKit, App Group,
   shared Keychain. Build the keyboard with no-network stub first; integrate
   with backend last.
8. CI pipelines for backend and iOS.

Estimated walltime to a working Phase 1 demo: 3–4 weeks of focused work,
gated on your answers to the open questions.
