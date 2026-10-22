"""Bounded, provenance-preserving official-source adapters."""
from datetime import datetime
from hashlib import sha256
from typing import Any

from pydantic import BaseModel, HttpUrl

class OfficialEvent(BaseModel):
    source_id: str
    external_id: str
    source_url: HttpUrl
    observed_at: datetime | None
    event_type: str
    description: str
    location_label: str | None = None

    @property
    def dedupe_key(self) -> str:
        return sha256(f"{self.source_id}:{self.external_id}".encode()).hexdigest()

def parse_nws_alert(feature: dict[str, Any]) -> OfficialEvent:
    """Parse NWS GeoJSON; an alert is never interpreted as a facility failure."""
    properties = feature.get("properties") or {}
    identifier = properties.get("id") or feature.get("id")
    sent = properties.get("sent")
    if not identifier or not properties.get("web") or not properties.get("event"):
        raise ValueError("NWS feature is missing required provenance fields")
    return OfficialEvent(
        source_id="nws_alerts",
        external_id=str(identifier),
        source_url=properties["web"],
        observed_at=datetime.fromisoformat(sent.replace("Z", "+00:00")) if sent else None,
        event_type="weather_alert",
        description=f"Official NWS {properties['event']} alert: {properties.get('headline') or 'no headline provided'}",
        location_label=properties.get("areaDesc"),
    )
