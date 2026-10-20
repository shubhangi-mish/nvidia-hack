# LASTLINE — Codex Starter Pack

**Autonomous critical-service access intelligence and coordination platform**  
Target: Nebius × NVIDIA Global AI Hackathon — **Best Apps and Agents** track.

LASTLINE discovers and accepts reports of essential-service disruptions, verifies evidence, models cross-sector dependencies, calculates feasible alternatives, prepares interventions, obtains authorization for consequential actions, and monitors outcomes. **A citizen report and an autonomous discovery use the same canonical incident workflow.**

## Quick start for Codex
1. Extract this archive into an empty `lastline` folder and open it in VS Code.
2. Install and sign into the official Codex extension.
3. Read `AGENTS.md`, then `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `AGENT_WORKFLOWS.md`, `DATA_SOURCES.md`, `UI_UX.md`, `SECURITY_PRIVACY.md`, `EVALUATION.md`, and `IMPLEMENTATION_PLAN.md`.
4. Tell Codex: **"Read AGENTS.md and all project specifications. Create a plan with acceptance criteria, then implement Milestone 0 and Milestone 1. Don't silently substitute fake data, fake agent calls, or unverified claims. Stop and ask for missing credentials or high-stakes external action permissions."**
5. Follow `.env.example` for credential names; never commit actual credentials.

## Priorities
- Real US public data; test scenarios clearly labeled. No synthetic incidents masquerading as real events.
- End-to-end functioning demo over broad but shallow feature coverage.
- Nebius-hosted NVIDIA open-source model is **mandatory** for real AI inference.
- Accessible, friendly, mobile-first **web app** (PWA optional), not native apps.
- Public reporting may be anonymous; coordinator operations require authentication and roles.
- Patient-sensitive information private; public incident map must not reveal patient identity.
- Autonomous investigation, **human-approved consequential external actions**.

## Files
- `AGENTS.md`: coding-agent instructions and definition of done
- `PROJECT_SPEC.md`: full product, users, scope, requirements, acceptance criteria
- `ARCHITECTURE.md`: system design, database, APIs, event lifecycle, infrastructure
- `AGENT_WORKFLOWS.md`: orchestration, prompts, tool boundaries, autonomy
- `UI_UX.md`: routes, flows, visual language, accessibility, states
- `DATA_SOURCES.md`: data acquisition, provenance, limitations, source connectors
- `SECURITY_PRIVACY.md`: threats, moderation, approvals, privacy
- `EVALUATION.md`: quality, safety, testing, metrics, baselines
- `IMPLEMENTATION_PLAN.md`: milestones, tasks, demo, submission
- `HACKATHON_SUBMISSION.md`: judging alignment, script, checklist
- `DECISIONS.md`: confirmed choices, assumptions, open questions
- `.env.example`: environment variables

## Important caveat
This pack is a build specification, not a finished running app. Endpoint URLs, model IDs, pricing, availability, and individual data-source licensing must be verified against current documentation before integration.
