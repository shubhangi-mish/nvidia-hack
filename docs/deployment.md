# Demo deployment (Vercel only)

This configuration supports a **demonstration**, not a live emergency-operation claim.

Two Vercel projects, both in the same team:

| Project | Root directory | Live URL |
| --- | --- | --- |
| `lastline-web` | `apps/web` (Next.js) | https://lastline-web.vercel.app |
| `lastline-api` | `services/api` (FastAPI on Vercel Python) | https://lastline-api.vercel.app |

## Deploy

```powershell
cd services/api; vercel deploy --prod
cd apps/web;     vercel deploy --prod --build-env NEXT_PUBLIC_API_BASE_URL=https://lastline-api.vercel.app
```

## Required environment (project `lastline-api`)

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres with PostGIS (Vercel Marketplace Neon or Supabase). Apply `infra/migrations/*.sql` in order first. |
| `CORS_ORIGINS` | The web URL, e.g. `https://lastline-web.vercel.app` |
| `SOURCE_INGEST_TOKEN`, `OPERATIONS_TOKEN` | Long random secrets protecting ingestion and coordinator endpoints. |
| `NEBIUS_API_KEY`, `NEBIUS_BASE_URL`, `NEBIUS_NVIDIA_MODEL_ID` | Only when activating investigator workflows. The model ID must come from that key's `/v1/models` catalog. |

Redeploy `lastline-api` after changing variables.

Before showing a public URL, verify `/healthz`, `/readyz` (needs the database), report creation, public redaction, source-attribution display, and the approval gate.
