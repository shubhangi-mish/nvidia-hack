# Implementation roadmap — Codex execution plan

## Milestone 0: audit and bootstrap
- Confirm Nebius account/credits, actual NVIDIA open-source model endpoint and tool-calling capabilities; current hackathon deadline/rules.
- Audit candidate US sources, choose pilot geography based on actual available records.
- Initialize monorepo, Docker Compose, lint/format/typecheck, CI, `.env`, license, migration framework.
- Acceptance: health endpoints, PostGIS connectivity, model smoke test, dataset manifest with at least two verified sources.

## Milestone 1: vertical-slice public report
- Next.js homepage/report, place picker, report validation, anonymous secure receipt, API create/read, canonical event, state history.
- Acceptance: submit real location and plain text; receipt and public redacted incident detail; no forced login.

## Milestone 2: shared intake and discovery
- Official feed adapter, scheduled source diff, source metadata, dedup/merge, unified workflow entry.
- Acceptance: user and autonomous source events both produce same incident type and workflow; duplicate updates one case.

## Milestone 3: Nemotron investigator
- Nebius adapter, tool allowlist, LangGraph checkpoints, evidence extraction, official-source search, source citation validation, contradiction/unknown states, SSE progress.
- Acceptance: real model tool trace; no unsupported verification; bounded failure recovery.

## Milestone 4: dependency graph and access planning
- Facilities/services/assets/dependency schema, PostGIS queries, graph traversal, accessible route adapter, alternatives with unknowns.
- Acceptance: three documented/test scenarios; show causal pathway as possible unless independently verified; no fake stock/capacity.

## Milestone 5: coordinator and monitor
- RBAC, operations dashboard, evidence explorer, plan drafts, approval queue, audit trail, scheduled rechecks, source health.
- Acceptance: approved actions gated; incident reopened when new evidence conflicts; resilient job retry.

## Milestone 6: polish, validation, submission
- Accessibility audit, responsive refinements, user testing, source attribution, baseline evaluation, performance, deploy, video, open-source license, README, feedback.
- Acceptance: live public URL, <3-min video, repo license at root, setup docs, explicit Nebius/NVIDIA demonstration.

## Priority cut line
**P0**: public report, canonical incident, official ingestion, real Nebius/Nemotron investigation, evidence, graph, one alternative, coordinator approval, deployed demo.
**P1**: photo/voice, more sources, polished map/graph, follow-up subscriptions, multiple scenarios.
**P2**: multilingual, broader US coverage, PWA offline draft, complex insurer networks, full partner integrations.

## Six-day aggressive hackathon sprint
Day 1 bootstrap/data/model smoke test; Day 2 reporting + event schema; Day 3 investigation; Day 4 graph + routes; Day 5 coordination + monitoring; Day 6 evaluation/deploy/video. This is a stretch schedule, not a guarantee. Cut scope rather than faking integrations.

## Demo acceptance journeys
A. Citizen reports elevator outage → place verification → official transit lookup → access chain to medical service → route candidates → proposed action → timeline.
B. Discovery detects real facility notice → normalized same pipeline → facility/service dependency assessment → proposed response → monitoring.
C. New duplicate report merges into existing case and contributes evidence without changing verification automatically.

## Instructions to Codex at each phase
Write a short plan, implement small cohesive increments, run checks, report file changes and test outputs, update `DECISIONS.md`, then request only essential missing credentials/permissions. Never skip a test by pretending it passed.
