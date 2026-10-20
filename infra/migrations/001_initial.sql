CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE source_kind AS ENUM ('citizen', 'official_api', 'official_notice', 'agent_discovery', 'partner_webhook');
CREATE TYPE verification_status AS ENUM ('community_reported', 'under_investigation', 'officially_confirmed', 'disputed', 'resolved', 'unknown');
CREATE TYPE lifecycle_state AS ENUM ('received', 'normalized', 'investigating', 'impact_assessed', 'plan_ready', 'action_in_progress', 'monitoring', 'resolved', 'needs_information', 'unverified', 'awaiting_approval', 'blocked', 'disputed', 'reopened');

CREATE TABLE raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), source_kind source_kind NOT NULL,
  payload_json JSONB NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT NOT NULL UNIQUE, schema_version TEXT NOT NULL DEFAULT '1.0'
);
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), type TEXT NOT NULL, summary TEXT NOT NULL,
  verification_status verification_status NOT NULL DEFAULT 'community_reported',
  lifecycle_state lifecycle_state NOT NULL DEFAULT 'received',
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  public_visibility BOOLEAN NOT NULL DEFAULT true, public_location GEOMETRY(Point, 4326)
);
CREATE INDEX incidents_public_location_gix ON incidents USING GIST(public_location);
CREATE INDEX incidents_updated_idx ON incidents(updated_at DESC);
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES incidents(id),
  raw_event_id UUID NOT NULL UNIQUE REFERENCES raw_events(id), report_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  tracking_token_hash TEXT NOT NULL UNIQUE, reporter_contact_encrypted BYTEA
);
CREATE TABLE case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES incidents(id),
  actor TEXT NOT NULL, event_type TEXT NOT NULL, timestamp TIMESTAMPTZ NOT NULL DEFAULT now(), payload_redacted JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX case_events_incident_idx ON case_events(incident_id, timestamp);
