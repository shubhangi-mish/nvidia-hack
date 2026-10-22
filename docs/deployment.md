# Demo deployment

This configuration supports a **demonstration**, not a live emergency-operation claim.

1. Create a Supabase project, enable PostGIS, and apply SQL migrations in order.
2. Create a Render Web Service from this repository. Use `render.yaml` and populate its secret environment values. Set `CORS_ORIGINS` to the deployed Vercel URL.
3. Create a Vercel project with root directory `apps/web`; set `NEXT_PUBLIC_API_BASE_URL` to the Render API URL.
4. Add `NEBIUS_API_KEY`, `NEBIUS_BASE_URL`, and a model ID verified through that key's `/v1/models` catalog only when ready to activate investigator workflows.

Before showing a public URL, verify `/healthz`, `/readyz`, report creation, public redaction, source-attribution display, and the approval gate. Free services can sleep or expire; disclose that limitation in the demo.
