CREATE TABLE source_sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT NOT NULL,
  cursor TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  records_seen INTEGER NOT NULL DEFAULT 0,
  records_created INTEGER NOT NULL DEFAULT 0,
  error_redacted TEXT
);
CREATE INDEX source_sync_runs_source_idx ON source_sync_runs(source_id, started_at DESC);
ALTER TABLE raw_events ADD COLUMN source_id TEXT;
ALTER TABLE raw_events ADD COLUMN observed_at TIMESTAMPTZ;
ALTER TABLE raw_events ADD COLUMN source_url TEXT;
ALTER TABLE incidents ADD COLUMN source_event_key TEXT UNIQUE;
