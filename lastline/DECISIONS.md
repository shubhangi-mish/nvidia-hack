# Decisions and open questions

## Confirmed from project discussion
- Name: LASTLINE.
- Unified scope: emergency backup failures, dialysis/treatment continuity, hospital-service closures, accessibility chains, pharmacy access.
- Autonomous discovery AND citizen reports enter the same pipeline.
- Public user can report issues via website; operations dashboard for authorized coordinators.
- Responsive **web application**; not native iOS/Android.
- Real sourced US data, no fabricated incidents represented as real.
- Nemotron NVIDIA open-source model via Nebius is central, not decorative.
- Best Apps and Agents is preferred track.
- Human approval for consequential outbound actions; autonomous investigation and internal planning.

## Provisional implementation decisions
- Next.js, FastAPI, Postgres/PostGIS, LangGraph, MapLibre, React Flow, SSE.
- Anonymous public reporting with secure tracking token; optional account for ongoing use.
- One US pilot region; choose after source audit.
- Nebius Serverless Jobs/Endpoints where supported; architecture should work without pretending unavailable features exist.

## Decisions requiring validation
1. Exact pilot region: NYC for transit accessibility vs hurricane-prone coastal region for disaster continuity.
2. Verified current Nebius endpoint/model ID and tool-calling support.
3. Which official transit outage feed has permitted reliable programmatic access.
4. Which public records demonstrate actual service changes vs historic compliance issues.
5. Available credits, deployment budget, deadline, team size.
6. Whether optional voice/image reporting is feasible within deadline.
7. Whether coordinator outreach is purely a draft in MVP or there is an authorized test organization.

## Change log
Update this file whenever a choice is confirmed; keep reason, date, and consequence.

### 2026-10-21 — Milestone 0 audit
- **Pilot: NYC.** It supports the later transit-accessibility journey and a dense set of CMS facilities. CMS dialysis directory and NWS Alerts are validated initial sources; the MTA elevator feed remains unapproved until its programmatic terms and endpoint are verified.
- **Nebius integration: Token Factory, configured model ID.** Its OpenAI-compatible API and `GET /v1/models` are verified, but its model catalog is key-scoped. No model ID is embedded in source; model smoke testing is blocked until a key and selected NVIDIA/Nemotron model are supplied.
- **Milestone 1 data strategy: fail closed.** The local report API has an in-memory development repository only until the PostGIS environment is provisioned. It must not be represented as durable production operation. Its schema migration is included for the durable deployment path.

### 2026-10-22 — Deployment and operations boundary
- **Demo deployment: Vercel + Render + Supabase.** This is a free-tier-friendly hackathon path with explicit sleeping/availability limitations.
- **Consequential operations: token-gated proposal and approval records only.** No service sends third-party messages, issues public urgent alerts, or performs bookings/transfers.
