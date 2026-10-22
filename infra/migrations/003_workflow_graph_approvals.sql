CREATE TABLE dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upstream_entity UUID NOT NULL, downstream_entity UUID NOT NULL,
  dependency_type TEXT NOT NULL, evidence_id UUID, valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ, confidence_label TEXT NOT NULL DEFAULT 'unknown'
);
CREATE INDEX dependencies_upstream_idx ON dependencies(upstream_entity);
CREATE INDEX dependencies_downstream_idx ON dependencies(downstream_entity);
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES incidents(id),
  workflow_version TEXT NOT NULL, model_id TEXT, state TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ,
  error_redacted TEXT
);
CREATE TABLE agent_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), run_id UUID NOT NULL REFERENCES agent_runs(id),
  tool TEXT NOT NULL, input_redacted JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_ref TEXT, duration_ms INTEGER, status TEXT NOT NULL
);
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), incident_id UUID NOT NULL REFERENCES incidents(id),
  action_type TEXT NOT NULL, proposed_payload JSONB NOT NULL,
  approval_state TEXT NOT NULL CHECK (approval_state IN ('proposed', 'approved', 'rejected')),
  idempotency_key TEXT NOT NULL UNIQUE, approved_at TIMESTAMPTZ, decision_reason TEXT
);
