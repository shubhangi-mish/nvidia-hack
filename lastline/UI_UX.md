# Web UI/UX specification

## Product design principles
Friendly, trustworthy, calm, accessibility-first, action-oriented. Public users should never need to understand graph theory or AI agent names. Distinguish verified facts from community reports. No alarming red everywhere; color never sole status indicator. Clear typography, large controls, mobile-first layouts; desktop coordinator experience.

## Public web routes
`/` home: concise mission, location selector, large "Report a problem" CTA, map/list of relevant incidents, filter chips, how it works.
`/report` guided report: description (free text), photo optional, voice optional, location map/manual search, category optional, privacy notice, review/submit. Progressive disclosure; don't require login.
`/report/success` receipt: ID, share-safe public incident link, private tracking token, current state and expected next step.
`/explore` map + list switch, filters for hospital/dialysis/nursing home/transit/pharmacy, status legend, source freshness.
`/incidents/[id]` plain-language incident summary, reported vs verified status, timeline, evidence, "who may be affected" as cautious wording, alternatives, updates, report correction button.
`/my-reports` secure private tracking using receipt token or optional account; follow-up questions and subscriptions.
`/access` private "Can I reach this service?" form with mobility and care constraints, privacy reminder, candidate routes and unknowns.
`/about`, `/methodology`, `/privacy`, `/accessibility`.

## Coordinator routes
`/operations` KPI cards (investigating, awaiting approval, stale, resolved), incident table, map, activity stream.
`/operations/incidents/[id]` split view: map and graph, source evidence and contradictions, agent trace, intervention editor, approval controls, audit history.
`/operations/approvals` proposed outbound actions, approve/reject, reason.
`/operations/sources` connectors, last sync, errors, freshness.
`/operations/evaluations` test metrics and failed cases.

## Report UX
Example user: "The elevator at this station is broken; my father uses a wheelchair and needs dialysis." UI: (1) ask which station only if ambiguous, (2) confirm whether user wants private access help, (3) submit report, (4) immediately show 'Report received — not yet verified', (5) stream investigation milestones, (6) show alternatives only with verified constraints and explicit unknowns, (7) invite additional evidence and corrections.

## Agent progress copy
- "Checking official service updates" (not "AI has confirmed" prematurely)
- "Looking for connected services that may be affected"
- "Comparing possible alternatives"
- "Awaiting coordinator review" / "More information needed"
- "Rechecking this report"
Each item has timestamp and source, and no false ETA.

## Design system
Suggested visual tone: neutral backgrounds, deep navy/charcoal text, muted teal for progress, amber for unverified, red reserved for truly critical verified status; accessible contrast. Cards with generous spacing; rounded 10–14px; restrained animation. Fonts: system/Inter-like sans (do not ship proprietary font files). Desktop left nav, mobile bottom nav. Map must have keyboard-accessible list alternative.

## Essential components
`ReportComposer`, `PlacePicker`, `EvidenceUploader`, `StatusPill`, `SourceCitation`, `IncidentCard`, `IncidentTimeline`, `IncidentMap`, `FacilityDetail`, `DependencyGraph`, `AlternativeRouteCard`, `AgentProgress`, `ActionProposal`, `ApprovalQueue`, `SourceHealth`, `PrivacyNotice`, `EmptyState`, `ErrorState`, `Skeleton`.

## Accessibility and resilience
WCAG 2.2 AA target; semantic headings, focus trap in dialogs, keyboard map/list, screen reader status announcements (polite live regions), reduced motion, no auto-playing video, high contrast, text resize, clear validation errors, touch targets. Progressive enhancement for voice/geolocation. Allow manual location; no mandatory precise geolocation. Photos stripped of EXIF before public handling. Network failure retains unsent draft locally only with user consent; PWA install optional. Internationalization-ready strings (English MVP; multilingual later).

## Responsive breakpoints
<640px one-column reporting, map/list tabs; 640–1024px tablet split optional; >1024px operations multi-panel. Avoid giant charts on mobile; show concise dependency explanation first, expandable graph.

## States to design
Loading, no incidents, source stale, unverified report, disputed report, agent running, waiting for information, awaiting human approval, service unknown, no safe alternative found, API unavailable, consent denied, rate limited, resolved/reopened. No fake 'nearby incidents' populated by dummy events in production.
