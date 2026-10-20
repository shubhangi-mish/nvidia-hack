# Technical architecture

## Stack
Monorepo: `apps/web` Next.js App Router/TypeScript/Tailwind/shadcn, MapLibre, React Flow; `services/api` FastAPI/Pydantic; `services/worker` Python/LangGraph; PostgreSQL + PostGIS; Redis or durable queue; object storage for uploads; Nebius Token Factory/AI Cloud NVIDIA open-source model; Tavily optional; source-specific ingestion adapters; SSE for progress.

## Logical flow
Citizen web / source connector / agent scan → API intake → `raw_events` → canonical normalize/geocode/dedup → `incidents` + `incident_reports` → durable workflow queue → Nemotron investigator → evidence store → dependency graph queries → route/service planner → intervention proposal → human approval gateway → monitor/recheck → public/private timeline.

## Suggested repo tree
```
apps/web/{app,components,features,lib,public}
services/api/app/{api,auth,models,schemas,services,db}
services/worker/app/{agents,tools,workflows,connectors,jobs}
packages/contracts/{openapi,types}
packages/evaluation/{cases,scorers}
infra/{docker,nebius,migrations}
tests/{integration,e2e,security}
```

## Canonical event schema
`event_id UUID`, `source_kind enum(citizen,official_api,official_notice,agent_discovery,partner_webhook)`, `source_id`, `observed_at?`, `received_at`, `description`, `event_type`, `service_category`, `geometry?`, `place_resolution_state`, `attachments[]`, `evidence_refs[]`, `source_trust_metadata`, `privacy_class`, `idempotency_key`, `schema_version`. Events are immutable inputs; canonical incidents are mutable aggregates with append-only history.

## Core relational schema
- `places(id, name, type, address, geom, source_id, verified_at)`
- `facilities(id, place_id, facility_type, official_id, source, last_checked)`
- `services(id, facility_id, capability, availability_status, status_evidence_id, verified_at)`
- `infrastructure_assets(id, place_id, asset_type, external_ref)`
- `dependencies(id, upstream_entity, downstream_entity, dependency_type, evidence_id, valid_from, valid_to, confidence_label)`
- `raw_events(id, source_kind, payload_json, received_at, dedupe_key)`
- `incidents(id, type, place_id, summary, verification_status, lifecycle_state, first_seen, updated_at, public_visibility)`
- `incident_reports(id, incident_id, raw_event_id, reporter_private_id?, report_time, evidence_refs)`
- `claims(id, incident_id, subject, predicate, object, polarity, status)`
- `evidence(id, claim_id?, source_url?, source_org, source_kind, fetched_at, published_at?, excerpt, hash, reliability_notes)`
- `affected_services(id, incident_id, service_id, impact_type, impact_state, explanation, graph_version)`
- `alternatives(id, incident_id, service_id, route_json, constraints_json, feasibility_state, last_checked)`
- `agent_runs(id, incident_id, workflow_version, model_id, state, started_at, finished_at, token_cost?, error)`
- `agent_tool_calls(id, run_id, tool, input_redacted, output_ref, duration, status)`
- `interventions(id, incident_id, action_type, proposed_payload, approval_state, assigned_org?, idempotency_key)`
- `case_events(id, incident_id, actor, event_type, timestamp, payload_redacted)`
- `subscriptions(id, incident_id?, user_id?, consent, channel, verified_contact_ref)`
- `private_access_requests(id, encrypted_user_ref, need_type, constraints, expiry)`
- `organizations`, `users`, `memberships`, `roles`, `moderation_flags`, `source_sync_runs`.
All geo fields indexed with GiST; unique external IDs and idempotency keys; incident temporal/spatial indexes; migrations required.

## Incident lifecycle
`received → normalized → investigating → impact_assessed → plan_ready → action_in_progress → monitoring → resolved` with side states `needs_information`, `unverified`, `awaiting_approval`, `blocked`, `disputed`, `reopened`. Verification status is orthogonal to workflow state. Never use a single boolean "verified".

## API contract (initial)
- `POST /v1/reports` multipart/text + location; returns incident/report ID and secure tracking token
- `GET /v1/incidents?bbox=&status=&type=` public redacted list
- `GET /v1/incidents/{id}` public safe incident details
- `GET /v1/incidents/{id}/events` SSE, public redacted timeline
- `GET /v1/incidents/{id}/evidence` sourced claims, redacted
- `GET /v1/incidents/{id}/dependencies` graph nodes/edges with provenance
- `GET /v1/incidents/{id}/alternatives` qualified options
- `POST /v1/access/plan` private constraint-aware route request
- `GET /v1/reports/mine` requires tracking token or account
- `POST /v1/operations/incidents/{id}/interventions` authorized proposal
- `POST /v1/operations/interventions/{id}/approve|reject` RBAC + audit
- `POST /v1/webhooks/{source}` verified source signature
- `GET /v1/operations/agent-runs/{id}` tool trace, coordinator only
- `GET /healthz`, `GET /readyz`, `GET /metrics` secured as appropriate.

## Event reliability
Transactional outbox when writing incident and enqueue intent; workers use idempotent job IDs; per-incident locking; exponential backoff with jitter; capped retries/dead letter; resume from checkpoints; source cursor/watermark; periodic reconciliation; human-review fallback for unrecoverable errors.

## Graph engine
Represent `REQUIRES`, `PROVIDES`, `LOCATED_AT`, `REACHABLE_VIA`, `ALTERNATIVE_TO`, `AFFECTED_BY`, `OPERATED_BY` edges. Distinguish hard vs conditional dependencies. BFS/graph traversal and constraint checks produce *possible* downstream impact. Route calculation uses accessible topology; don't infer wheelchair accessibility from absence of data. Version graph and preserve explanation path.

## Nebius inference adapter
Configuration: base URL, API key, model ID, timeout, max tokens, temperature, retries. Verify current Nebius API and NVIDIA open-model IDs. Implement structured outputs/tool calling only where supported; validate Pydantic output; log model version. No fallback to non-NVIDIA model for judged path. Test live call and screenshot provider usage for submission.

## Deployment
Containerized web/API/worker + managed Postgres/PostGIS + durable queue + object storage; inference on Nebius. Nebius Serverless Endpoints/Jobs optional as supported. TLS, secrets, migrations, health checks, telemetry. Provide local docker-compose for infra and development; external credentials optional until integration test.
