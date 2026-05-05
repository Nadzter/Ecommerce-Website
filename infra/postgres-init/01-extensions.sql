-- Enable extensions used by the Amwali schema.
-- Runs on first container start only (mounted to /docker-entrypoint-initdb.d).

CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
