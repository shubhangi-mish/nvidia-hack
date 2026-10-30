import json

from fastapi.testclient import TestClient

from app import main
from app.nebius import NebiusNotConfigured

client = TestClient(main.app)
BODY = {"source": "NWS", "event": "Flood Warning", "severity": "Severe", "area": "Test County",
        "dialysis_facilities": 3, "dialysis_stations": 40, "hospitals": 1, "sample_facilities": ["A Dialysis"], "nearest_alternatives": []}


def _reset():
    main._brief_calls.clear()
    main._brief_global.clear()


def test_brief_returns_structured_draft_and_takes_no_action(monkeypatch):
    _reset()
    content = json.dumps({"summary": "s", "priority_actions": ["a", "b", "c", "d"], "caveat": "c"})
    monkeypatch.setattr(main, "brief", lambda ctx: {"model_id": "m", "response_id": "r", "content": content})
    response = client.post("/v1/demo/brief", json=BODY)
    assert response.status_code == 200
    assert response.json()["external_action_executed"] is False
    assert response.json()["draft"]["priority_actions"] == ["a", "b", "c"]


def test_brief_rejects_oversized_input():
    _reset()
    assert client.post("/v1/demo/brief", json={**BODY, "event": "x" * 500}).status_code == 422


def test_brief_is_rate_limited(monkeypatch):
    _reset()
    monkeypatch.setenv("BRIEF_LIMIT_PER_10_MIN", "2")
    monkeypatch.setattr(main, "brief", lambda ctx: {"model_id": "m", "response_id": "r", "content": json.dumps({"summary": "s", "priority_actions": [], "caveat": "c"})})
    codes = [client.post("/v1/demo/brief", json=BODY, headers={"x-forwarded-for": "1.2.3.4"}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_brief_fails_closed_when_model_unconfigured(monkeypatch):
    _reset()
    def boom(ctx):
        raise NebiusNotConfigured("no key")
    monkeypatch.setattr(main, "brief", boom)
    assert client.post("/v1/demo/brief", json=BODY).status_code == 503
