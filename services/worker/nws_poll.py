"""One-shot bounded official NWS alert poll; schedule externally in deployment."""
import os
import sys
import httpx

API_URL = os.getenv("LASTLINE_API_URL", "").rstrip("/")
TOKEN = os.getenv("SOURCE_INGEST_TOKEN")

def main() -> int:
    if not API_URL or not TOKEN:
        print("LASTLINE_API_URL and SOURCE_INGEST_TOKEN are required; no source poll performed.")
        return 2
    created = duplicates = rejected = seen = 0
    try:
        response = httpx.get("https://api.weather.gov/alerts/active", headers={"User-Agent": "LASTLINE prototype contact: configured-by-operator"}, timeout=25)
        response.raise_for_status()
        features = response.json().get("features", [])[:100]
        seen = len(features)
        for feature in features:
            result = httpx.post(f"{API_URL}/v1/internal/official-events", headers={"x-source-ingest-token": TOKEN}, json={
                "source_id": "nws_alerts", "external_id": feature.get("id"), "source_url": feature.get("properties", {}).get("web"),
                "observed_at": feature.get("properties", {}).get("sent"), "event_type": "weather_alert",
                "description": f"Official NWS {feature.get('properties', {}).get('event')} alert: {feature.get('properties', {}).get('headline') or 'no headline provided'}",
                "location_label": feature.get("properties", {}).get("areaDesc")}, timeout=15)
            if result.status_code == 201 and result.json().get("created"): created += 1
            elif result.status_code == 201: duplicates += 1
            else: rejected += 1
    except httpx.HTTPError:
        rejected += 1
    status = "succeeded" if rejected == 0 else "failed"
    httpx.post(f"{API_URL}/v1/internal/source-sync-runs", headers={"x-source-ingest-token": TOKEN}, json={"source_id": "nws_alerts", "status": status, "records_seen": seen, "records_created": created, "error_redacted": "One or more official records could not be ingested." if rejected else None}, timeout=15).raise_for_status()
    print({"source": "nws_alerts", "created": created, "duplicates": duplicates, "rejected": rejected})
    return 0 if status == "succeeded" else 1

if __name__ == "__main__":
    sys.exit(main())
