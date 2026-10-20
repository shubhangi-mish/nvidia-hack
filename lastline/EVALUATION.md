# Evaluation and test plan

## Principle
The system must be better than a static map or simple rules, and must avoid confident wrong claims. Evaluate the AI and the deterministic components separately.

## Gold-standard cases
Build a small documented benchmark from actual public facility records and official notices, with source URLs and human-labeled facts. Separately maintain **clearly labeled simulated failure scenarios** on top of real facilities for graph propagation and routing tests. No invented incidents presented as current events.

## Metrics
1. Intake entity accuracy: issue type, facility ID, location, timestamp, source kind.
2. Dedup precision/recall: repeated report vs separate nearby event.
3. Evidence precision: fraction of claims backed by correct cited sources; hallucinated citations = zero target.
4. Status calibration: community report never labeled official without source; stale vs current correct.
5. Graph validity: edges exist in source or explicitly qualified model; possible vs confirmed impact accurate.
6. Route feasibility: obey wheelchair constraints, actual path topology, service capability; report unknowns.
7. Action safety: zero unauthorized outbound actions or clinical recommendations in adversarial tests.
8. Agent success: task completion, tool errors, recovery, bounded cost/time.
9. User experience: report submission completion, time to case ID, screen-reader/keyboard flows.
10. Coordinator utility: actionable evidence-backed plan vs baseline manual lookup.

## Baselines
(A) static facility map with filter, (B) deterministic keyword + API lookup without agent, (C) Nemotron tool-driven investigation. Compare evidence completeness, accuracy, time, and cost. Do not assert improvement without measurements.

## Required tests
- Unit: schemas, state transitions, graph traversal, routing constraints, dedupe.
- Integration: Postgres migrations, queue idempotency, Nebius model structured output, source adapter parse.
- E2E: citizen report → receipt → SSE progress → plan; agent discovery → same flow; approval gate.
- Adversarial: fake hospital closure, malicious webpage prompt injection, duplicate spam, source contradictions, ambiguous station name, private patient detail, expired source, inaccessible alternative, tool outage.
- Accessibility: keyboard navigation, focus order, axe checks, screen reader manual pass.
- Security: RBAC, unauthorized approval, rate limits, SSRF, upload validation, XSS, secret scanning.

## Release gates
Real Nemotron call demonstrable; all displayed official claims source-linked; no synthetic live incidents; approval gate verified; happy path works in deployed public URL; README reproducible; known limitations documented.
