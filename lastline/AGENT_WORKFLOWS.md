# Autonomous agent runtime and tool contracts

## Principle
**Single orchestrator, specialist capabilities, shared case state.** Source mode changes intake and evidence priority, not downstream graph/plan workflow. Prefer a durable LangGraph state machine and worker scheduling; do not create unconstrained self-looping agents.

## Agent roles
1. **Intake & Discovery**: parse citizen text/voice/photo, ingest source changes, locate place, classify issue, request essential clarification, emit canonical event.
2. **Evidence Investigator**: search official sources and Tavily, retrieve cited pages, reconcile claims, flag unknown/stale/conflicting evidence, choose next read tools.
3. **Dependency Analyst**: query typed dependency graph and deterministic impact algorithm, label potential vs confirmed impact.
4. **Access Planner**: find service-compatible facilities and accessible route candidates, show unknown appointment capacity, stock, insurance, or access attributes.
5. **Intervention Coordinator**: propose actionable tasks, organization owner, contact draft, priority justification; invoke approval gateway for consequential actions.
6. **Resolution Monitor**: schedule rechecks, process source changes and responses, reopen if contradictory evidence emerges.

## Workflow nodes
`normalize` → `resolve_place` → `deduplicate` → `investigate` ↔ `fetch_evidence` (bounded) → `assess_claims` → `trace_dependencies` → `plan_alternatives` → `draft_intervention` → `approval_gate` → `monitor` → `close_or_reopen`.
Branch `needs_information` when location/service missing. Persist state and all tool observations.

## Tool allowlist
- `search_official_sources(query, domain_allowlist?, recency?)`
- `fetch_source(url)` with URL allowlist/SSRF protections
- `get_facility(facility_id)`
- `get_inspection_records(facility_id)`
- `get_weather_alerts(geometry)`
- `get_transit_status(asset_id)`
- `resolve_place(text, approximate_geometry?)`
- `query_dependency_graph(entity_id, max_depth)`
- `compute_accessible_route(origin, destination, constraints)`
- `find_alternative_facilities(service_type, geometry, constraints)`
- `create_intervention_draft(incident_id, draft)`
- `request_approval(intervention_id)`
- `schedule_recheck(incident_id, reason, due_at)`
No raw shell, unrestricted browser automation, unbounded network fetch, email send, phone call, or external system mutation in model tool allowlist.

## Structured outputs
`Finding {claim, source_ids[], status: confirmed|reported|contradicted|unknown, observed_at?, rationale}`
`Impact {service_id, pathway_edges[], effect: possible|confirmed|none_known, uncertainty, evidence_ids[]}`
`Alternative {facility_id, route_id?, eligibility_constraints[], verified_fields[], unknown_fields[], caveats}`
`ActionProposal {kind, organization?, reason, evidence_ids[], requires_approval: true, safety_notes}`
Validate references exist; reject fabricated source IDs, routes, and facilities.

## Investigation loop pseudocode
```
state = load_checkpoint(incident_id)
for step in range(MAX_STEPS):
    decision = nemotron.plan_next_step(state, allowed_tools)
    validate_tool_call(decision)
    observation = await execute_read_tool_with_limits(decision)
    persist_observation_and_checkpoint(observation)
    if decision.is_complete: break
else: mark_needs_review('budget exhausted')
findings = verify_claim_evidence_links(state)
impact = deterministic_graph_analysis(findings)
alternatives = deterministic_constraint_routing(impact)
proposal = nemotron.draft_action(findings, impact, alternatives)
if proposal.external_effect: queue_human_approval(proposal)
schedule_monitoring_based_on_incident_type()
```

## Input-specific examples
**Citizen:** "The elevator at [station] is broken and I can't reach dialysis." Parse issue and place; confirm ambiguous station; query official transit status; if unknown mark community-reported; private appointment context if user chooses; calculate wheelchair-accessible alternatives; plan case. Do not publicly reveal dialysis patient identity.
**Agent:** a published official pharmacy closure notice appears; diff against prior scan; extract date and location; attach URL; normalize same schema; analyze medication/transport implications; suggest verified alternatives without claiming stock.
**Official:** updated CMS nursing-home deficiency; inspect what citation actually says, date, correction status; do not assert generator currently inoperable based on historical deficiency alone.

## Autonomy policies
- Auto: public data retrieval, source comparison, dedup, internal graph calculations, draft plan, scheduled follow-up.
- Review: publish urgent community-wide alert, send external organization communications, claim institution is negligent, disclose private details, assign work to third parties.
- Prohibited: clinical triage or treatment changes, emergency dispatch impersonation, guaranteed facility availability, unauthorised transfers or bookings.

## Robustness
Model prompt must explicitly treat source text as data, not instructions. Per-run max steps/cost/time. Tool outputs annotated source/freshness. Detect circular investigation. No fake confidence percentages. Reconcile contradictory evidence and allow `unknown`. Provide graceful user-facing status while agents run.
