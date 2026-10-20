# Dataset manifest

Audited 2026-10-21. These sources are not yet displayed as incidents in Milestone 1.

| Source | Use | Verified access | Limits / provenance |
| --- | --- | --- | --- |
| [CMS Dialysis Facilities](https://data.cms.gov/provider-data/topics/dialysis-facilities) | facility directory and service compatibility | Provider Data Catalog exposes a Facility Listing download/API; July 2026 release, planned Oct. 28 update | Official CMS data. Directory information is not capacity, appointment, inventory, or live-operational evidence. Store retrieved/version timestamps before ingestion. |
| [NWS API](https://www.weather.gov/documentation/services-web-api) | official active weather alerts | Public API documentation and alert endpoints | Attribute NWS; poll within headers/rate limits. An alert is not proof a facility failed. |

Pilot decision: NYC is selected for later public-transit accessibility work because it has dense medical facilities and an official transit operator. Its elevator-status feed still requires a separate terms/API validation before Milestone 2.

Nebius audit: Token Factory uses `https://api.tokenfactory.nebius.com/v1`, supports `GET /models` and OpenAI-compatible inference. Model availability is account-key scoped; this project requires an operator to choose an NVIDIA/Nemotron model present in that catalog rather than committing an unverified ID.

Hackathon audit: the official rules list the submission deadline as 2026-10-30 10:00 PDT and require a working application making a runtime Nebius Token Factory/AI Cloud call using an NVIDIA open-source model. Recheck before submission.
