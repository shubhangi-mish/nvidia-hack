# Real-world data acquisition and provenance

## Rules
Use official sources first. Store raw source reference, publication time, retrieval time, geometry accuracy, licensing/terms, and extraction method. Keep separate source records from agent interpretations. Do not scrape prohibited sites or claim live operational status from historic records. Verify URLs, access and fields before coding; links below are starting points, not guaranteed API contracts.

## Candidate US sources
- **CMS Provider Data**: https://data.cms.gov/provider-data/ — hospitals, dialysis facilities, nursing homes, quality and inspection records. Verify each dataset's schema and refresh cycle.
- **CMS Dialysis facilities**: https://data.cms.gov/provider-data/topics/dialysis-facilities — facility location/service information, not live capacity.
- **CMS nursing-home inspection/deficiency data**: available via CMS Provider Data; deficiency citations historical, not proof of current failure.
- **National Weather Service API**: https://www.weather.gov/documentation/services-web-api — official alerts and forecast information.
- **FEMA OpenFEMA**: https://www.fema.gov/about/openfema/data-sets — disaster/hazard-related datasets; do not interpret broad risk layers as current facility failure.
- **NYC MTA**: https://www.mta.info/ — investigate official elevator/escalator status and GTFS/GTFS-RT endpoints and terms for a NYC accessibility pilot.
- **OpenStreetMap**: https://www.openstreetmap.org/ — routing/geospatial reference; verify ODbL attribution and coverage; wheelchair accessibility may be incomplete.
- **US DOT / local GTFS feeds**: transit networks, agency-specific availability and licenses.
- **State pharmacy licensing boards / CMS or other registries**: licensed pharmacy directories; not live inventory or insurance participation.
- **Official hospital/facility websites and press releases**: service closure notices; use source extraction with date verification.
- **Tavily** (optional prize alignment): discover recent official notices; results must be checked against primary sources.

## Recommended pilot strategy
Prefer a single geography with accessible official transit feeds and dense facility data, e.g., NYC for mobility + medical access. For nursing-home disaster power, use a separately scoped documented facility example if geographic constraints require it; clearly explain scope and don't pretend one region proves national coverage. Alternative: a coastal pilot for hurricane/dialysis with accessible road-routing evidence, but transit elevator feed may be weaker. Decide by data audit, not branding.

## Ingestion adapter contract
`SourceAdapter {source_id, fetch(cursor), parse(raw), normalize(record), dedupe_key(record), freshness_policy, license, attribution, source_health}`. Incremental cursor or content hash, bounded retries, timestamp, raw archive where lawful. Mark missing/expired fields as unknown.

## Place and incident matching
Normalize official IDs; geocode address with confidence and source; avoid approximate matching across facilities with same name. Dedup requires compatible type, place, and overlapping time; independent evidence sources remain separate. Keep original report text and edited canonical summary.

## Verification rubric
`officially_confirmed`: directly relevant dated official operational notice, or equivalent authorized evidence; `community_reported`: uncorroborated user report; `under_investigation`: evidence retrieval underway; `disputed`: credible contradictory evidence; `resolved`: confirmed restoration or approved closure workflow. Historical inspection deficiencies are evidence of past compliance issues, not current power failure.

## Freshness examples (tunable)
Weather/transit: frequent polling within source rate limits. Facility directory: periodic dataset refresh. Historic inspections: on dataset update. Website notices: event-driven or scheduled modest cadence. Display last checked and publication timestamps, never simply "live" unless verified.

## Dataset audit checklist
Record endpoint, auth, fields, update frequency, license, pagination, row counts, geometry precision, official status fields, missingness, test query, data steward. Select only validated sources for MVP. Store dataset manifest in repo with retrieved versions and hashes.
