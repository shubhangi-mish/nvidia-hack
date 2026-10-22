from app.sources import parse_nws_alert

def test_nws_alert_keeps_official_provenance_without_claiming_facility_failure():
    event = parse_nws_alert({"id": "urn:oid:2.49.0.1.840.0.example", "properties": {"id": "urn:oid:2.49.0.1.840.0.example", "web": "https://api.weather.gov/alerts/example", "event": "Flood Watch", "headline": "Flooding possible", "sent": "2026-10-22T12:00:00Z", "areaDesc": "New York"}})
    assert event.source_id == "nws_alerts"
    assert event.event_type == "weather_alert"
    assert "facility" not in event.description.lower()
