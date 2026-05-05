-- Constraints, partial indexes, and role policy that Prisma cannot express.
-- Run after `prisma migrate dev` (which creates the tables).
-- TODO: convert to a proper Prisma migration once the schema stabilises.
--
--   psql "$DATABASE_URL" -f prisma/migrations/manual/01-constraints.sql

-- ─── CHECK constraints ──────────────────────────────────────────────────────
ALTER TABLE users
  ADD CONSTRAINT users_country_chk CHECK (country IN ('AE','GH')),
  ADD CONSTRAINT users_kyc_status_chk
    CHECK (kyc_status IN ('unverified','pending','approved','rejected'));

ALTER TABLE otp_codes
  ADD CONSTRAINT otp_codes_purpose_chk
    CHECK (purpose IN ('signup','login','step_up'));

ALTER TABLE contacts
  ADD CONSTRAINT contacts_country_chk CHECK (country IN ('AE','GH'));

ALTER TABLE bank_links
  ADD CONSTRAINT bank_links_provider_chk
    CHECK (provider IN ('mock','lean','flutterwave')),
  ADD CONSTRAINT bank_links_status_chk
    CHECK (status IN ('active','expired','revoked','error'));

ALTER TABLE transfers
  ADD CONSTRAINT transfers_amount_chk CHECK (amount_minor > 0),
  ADD CONSTRAINT transfers_state_chk
    CHECK (state IN ('pending','authorized','submitted','completed','failed','reversed'));

ALTER TABLE idempotency_keys
  ADD CONSTRAINT idempotency_status_chk
    CHECK (status IN ('in_flight','completed'));

-- ─── Partial / conditional indexes ──────────────────────────────────────────
CREATE UNIQUE INDEX contacts_user_phone_active_uq
  ON contacts (user_id, phone_e164)
  WHERE deleted_at IS NULL;

CREATE INDEX otp_codes_active_idx
  ON otp_codes (email, purpose)
  WHERE consumed_at IS NULL;

CREATE INDEX sessions_active_user_idx
  ON sessions (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX bank_links_active_idx
  ON bank_links (user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX transfers_pending_idx
  ON transfers (state, initiated_at)
  WHERE state IN ('pending','authorized','submitted');

CREATE UNIQUE INDEX transfers_provider_payment_id_uq
  ON transfers (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

-- ─── Append-only audit log ──────────────────────────────────────────────────
-- The application connects as `amwali_app`. Only `amwali_audit` may insert
-- into transfer_events; nobody may update or delete. The application switches
-- role for the audit insert via SET LOCAL ROLE amwali_audit.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'amwali_app') THEN
    CREATE ROLE amwali_app NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'amwali_audit') THEN
    CREATE ROLE amwali_audit NOINHERIT;
  END IF;
END $$;

REVOKE ALL ON transfer_events FROM PUBLIC;
GRANT SELECT, INSERT ON transfer_events TO amwali_audit;
GRANT SELECT ON transfer_events TO amwali_app;
GRANT USAGE, SELECT ON SEQUENCE transfer_events_id_seq TO amwali_audit;

-- The migrating user (the connection running this script) needs to be allowed
-- to assume amwali_audit. In dev that's the docker-compose superuser; in
-- production grant it to whichever role the app connects as.
GRANT amwali_audit TO CURRENT_USER;
