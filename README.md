# LASTLINE

LASTLINE is a privacy-first critical-service access reporting platform. It is a hackathon MVP, not an emergency service or clinical decision tool.

## Milestones 0–1

- Anonymous reports enter immutable `raw_events` and a canonical `incidents` aggregate.
- Reports receive a private tracking token. Public details deliberately omit report text, contact information, and exact personal locations.
- The web app provides an accessible mobile-first report form and receipt view.
- The API exposes health checks, report creation, public incident detail, and token-protected report lookup.

## Run locally

1. Copy `lastline/.env.example` to `.env` and set `SESSION_SECRET` and `DATABASE_URL`.
2. Start PostGIS: `docker compose up -d db`.
3. Apply `infra/migrations/001_initial.sql` with your database client.
4. Create a Python environment, install `services/api` dependencies, and run `uvicorn app.main:app --reload --app-dir services/api`.
5. Install web dependencies in `apps/web`, then run `npm run dev`.

`GET /healthz` requires no database. `GET /readyz` confirms database access. Nebius smoke testing requires all three `NEBIUS_*` settings and validates the configured model against the account catalog; it never picks a hard-coded model.

The local development API uses a non-durable in-memory repository until the PostGIS repository wiring is completed; restart clears local reports. Do not deploy that mode.

## Data and safety

See [docs/dataset-manifest.md](docs/dataset-manifest.md) for the audited sources. Directory entries are not live availability. Community reports are always unverified on creation. Never use LASTLINE instead of local emergency services.

## Tests

- API: `pytest services/api/tests`
- Web: `npm test` (from `apps/web`)
- Web lint/typecheck: `npm run lint && npm run typecheck`

## Current integration state

PostGIS, a Nebius Token Factory key, and a verified NVIDIA model ID are deployment credentials not included in this repository. The inference integration remains deliberately unavailable until supplied.

Official source ingestion is protected by `SOURCE_INGEST_TOKEN`. Milestone 2 currently includes the provenance-preserving NWS alert parser and an authenticated official-event intake endpoint; scheduling real source polls is the next increment.

`services/worker/nws_poll.py` is the bounded one-shot NWS polling entry point. Run it only from an approved scheduler after setting its API URL and ingestion token; it reads the official NWS active-alert feed and sends the source record through the same intake endpoint.

See [deployment instructions](docs/deployment.md) for the Vercel-only demo path. The coordinator endpoints require `OPERATIONS_TOKEN`; they create proposals and approval records only, never send external communications.
