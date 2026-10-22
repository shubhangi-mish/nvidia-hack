from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_anonymous_report_receipt_and_redacted_public_detail():
    response = client.post("/v1/reports", json={"description": "The station elevator may be unavailable.", "location_text": "34 St Herald Sq, New York, NY"})
    assert response.status_code == 201
    receipt = response.json()
    assert receipt["tracking_token"]
    public = client.get(f"/v1/incidents/{receipt['incident_id']}")
    assert public.status_code == 200
    assert "elevator" not in public.json()["summary"].lower()
    assert "Herald" not in public.json()["location_label"]
    assert public.json()["verification_status"] == "community_reported"
    private = client.get(f"/v1/reports/{receipt['report_id']}", headers={"tracking-token": receipt["tracking_token"]})
    assert private.status_code == 200
    assert private.json()["tracking_token"] == ""

def test_coordinate_pair_is_required():
    response = client.post("/v1/reports", json={"description": "A detailed report about an access problem.", "location_text": "New York", "latitude": 40.7})
    assert response.status_code == 422
