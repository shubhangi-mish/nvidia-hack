# LASTLINE — Complete product requirements

## Thesis
A service can exist and still be unreachable. The last mile between a person's need and a functioning service can break because of power, water, transportation, accessibility, capacity, closure, insurance, or other dependencies. LASTLINE detects these failures, reasons across sectors, and coordinates recovery.

## Unified coverage — all five original concepts
1. **LastLine / emergency infrastructure**: nursing homes, generators, power, flood/weather exposures, care-continuity risks.
2. **Lifeline / treatment continuity**: dialysis, oxygen/medical equipment dependencies, essential appointments; do not practice medicine.
3. **CareCollapse / hospital-service access**: hospital or specific department closure, rural maternity/emergency access, service capability rather than proximity alone.
4. **AccessChain / end-to-end disability access**: elevator outages, accessible paths, transit/road/entrance dependencies, appointment reachability.
5. **RxDesert / medication access**: pharmacy closure, network/transport barriers, medication access; live stock or insurance coverage only if verified by authorized sources.

## Audiences and permissions
- Public visitor: explore confirmed and clearly labeled reported incidents; no login required.
- Citizen reporter: submit description, location, optional image/voice, optional contact for follow-up; retrieve via private claim token or optional account.
- Individual seeking access: optionally supply accessibility constraints and appointment details privately; receive informational candidate alternatives.
- Coordinator (authorized): evidence review, case assignment, approve outbound messages, monitor incidents.
- Organization admin: configure source/organization permissions, roles, alert subscriptions.
- Agent runtime: bounded read/search/analysis/drafting, scoped to approved tools.

## Essential flows
A. **Citizen-initiated**: text/voice/photo → identify place and problem → ask one or two essential clarifications → submit → canonical event → investigate → trace dependencies → candidate alternatives → proposed coordination → monitor → close/reopen.
B. **Agent-initiated**: scheduled feed scan or source change → evidence diff → event → same canonical workflow.
C. **Official webhook**: validated webhook → canonical event → same workflow.
D. **Duplicate citizen report**: match same place, issue, overlapping time; attach report and evidence to existing incident without treating volume as independent proof.
E. **Personal access**: user describes essential need and constraints; compute feasible path with explicit unknowns; keep sensitive profile private.
F. **Resolution**: authoritative source or verified coordinator update → recheck → publish bounded update → allow dispute/reopen.

## Functional requirements
FR-01 Public responsive homepage with report CTA, explore map, issue search and status.
FR-02 Text report, optional photo, optional voice capture/transcription (browser support permitting), precise place picker/manual address.
FR-03 Place disambiguation; do not assume vague "Main Street" is unique.
FR-04 Privacy-preserving report tracking, anonymous submission with rate limits and secure private receipt.
FR-05 Source adapters: CMS facility listings/deficiencies, NWS alerts, FEMA hazards, chosen transit elevator feeds, official closure notices; support incremental import and update.
FR-06 Canonical incident, individual reports, claims/evidence, source credibility metadata, verification status, incident lifecycle.
FR-07 Autonomous agent investigation with tool calls, citations, source timestamps, uncertainty and no unsupported facts.
FR-08 Typed cross-sector dependency graph; propagate possible effects without claiming verified outages.
FR-09 Candidate accessible routes and facilities with explicit service compatibility and capacity unknowns.
FR-10 Coordinator interventions: proposals, approval/decline, task owner, status, audit trail; no unapproved external communication.
FR-11 SSE case timeline and notifications (email optional after explicit opt-in).
FR-12 Reassessment jobs with freshness policy, rate limits, failure recovery.
FR-13 Map with incident status legend, filters, accessible list alternative, non-identifying location display.
FR-14 Evidence viewer, claim-to-source mapping, contradictions, stale/unknown indicators.
FR-15 Organization RBAC, moderation, appeals/disputes, user deletion/contact consent controls.
FR-16 Operations dashboard: incident triage, agent run details, approvals, backlog, source health, error monitoring.
FR-17 Admin configurable discovery cadence, tool budgets, source enable/disable.
FR-18 Evaluation dashboard showing actual test outcomes and limitations.

## Nonfunctional requirements
- Accessibility target WCAG 2.2 AA; keyboard/screen reader, focus order, contrast, reduced motion, multilingual architecture, low-bandwidth mode.
- Reliability: idempotent processing, resumable jobs, no duplicate third-party actions, bounded latency for initial report receipt.
- Security: authenticated coordinator RBAC, input sanitization, uploads scanned, prompt-injection resistance, audit events, secret management.
- Privacy: data minimization, coarse public location for personal reports, consented contact, configurable retention.
- Observability: request/correlation IDs, tool run trace, costs, source latency, errors, incident status changes.
- Performance: map clustering, paginated results, asynchronous heavy graph/LLM processing.

## MVP scope (do not confuse with long-term ambition)
One US pilot area and three demonstrable cross-domain scenarios: (1) nursing-home/critical power inspection evidence, (2) dialysis continuity under clearly labeled outage scenario or documented outage, (3) accessible transit failure affecting access to pharmacy/medical service. Real facilities and evidence; simulations conspicuously labeled. Other domains present in shared schema and roadmap.

## Out of scope for hackathon
Nationwide real-time guarantee; EHR integration; live pharmacy stock without partner; autonomous patient dispatch; emergency 911 replacement; clinical triage; public naming-and-shaming; autonomous outbound calls to institutions; unverified capacity claims.

## Product success
User receives useful and grounded status; coordinator receives evidence-backed action plan; the system does not confuse rumor with fact; repeated sources merge; two distinct input modes produce identical downstream capabilities; incident can be monitored and reopened.
