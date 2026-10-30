CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, address TEXT NOT NULL,
  geom GEOMETRY(Point, 4326), source_id TEXT NOT NULL, verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX places_geom_gix ON places USING GIST(geom);
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), place_id UUID NOT NULL REFERENCES places(id),
  facility_type TEXT NOT NULL, official_id TEXT NOT NULL UNIQUE, source TEXT NOT NULL, last_checked TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), facility_id UUID NOT NULL REFERENCES facilities(id),
  capability TEXT NOT NULL, availability_status TEXT NOT NULL DEFAULT 'directory_listed', verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(facility_id, capability)
);
