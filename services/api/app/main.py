import hashlib
import os
import secrets
from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import psycopg
from psycopg.rows import dict_row
from .sources import OfficialEvent
from .nebius import NebiusNotConfigured, smoke_test

app = FastAPI(title="LASTLINE API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=[value for value in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if value], allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Idempotency-Key", "tracking-token", "x-source-ingest-token", "x-operations-token"])

class VerificationStatus(StrEnum):
    COMMUNITY_REPORTED = "community_reported"
    UNDER_INVESTIGATION = "under_investigation"

class ReportCreate(BaseModel):
    description: str = Field(min_length=10, max_length=4000)
    location_text: str = Field(min_length=3, max_length=300)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    category: str | None = Field(default=None, max_length=80)
    contact: str | None = Field(default=None, max_length=320)

    @field_validator("description", "location_text")
    @classmethod
    def reject_controls(cls, value: str) -> str:
        if any(ord(character) < 32 and character not in "\n\t" for character in value):
            raise ValueError("contains unsupported control characters")
        return value.strip()

    @field_validator("longitude")
    @classmethod
    def location_pair(cls, longitude: float | None, info):
        if (longitude is None) != (info.data.get("latitude") is None):
            raise ValueError("latitude and longitude must be supplied together")
        return longitude

class Receipt(BaseModel):
    incident_id: UUID
    report_id: UUID
    tracking_token: str
    verification_status: VerificationStatus
    lifecycle_state: str

class PublicIncident(BaseModel):
    id: UUID
    summary: str
    category: str | None
    verification_status: VerificationStatus
    lifecycle_state: str
    first_seen: datetime
    location_label: str

class InterventionCreate(BaseModel):
    action_type: str = Field(min_length=3, max_length=100)
    proposed_payload: dict
    idempotency_key: str = Field(min_length=8, max_length=200)

def _require_operations_token(token: str | None) -> None:
    expected = os.getenv("OPERATIONS_TOKEN")
    if not expected:
        raise HTTPException(503, "Coordinator operations are not configured")
    if not token or not secrets.compare_digest(expected, token):
        raise HTTPException(403, "Coordinator authorization required")

class StoredReport(BaseModel):
    id: UUID
    incident_id: UUID
    raw_event_id: UUID
    token_hash: str

def _database_url() -> str:
    value = os.getenv("DATABASE_URL")
    if not value:
        raise HTTPException(503, "Database configuration is required")
    return value.replace("postgresql+asyncpg://", "postgresql://", 1)

def _connection():
    return psycopg.connect(_database_url(), row_factory=dict_row)

def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def _public_summary(description: str) -> str:
    # Public text is intentionally not the reporter's verbatim allegation.
    return "A community report has been received and is awaiting verification."

def ingest_official_event(event: OfficialEvent) -> tuple[UUID, bool]:
    """Create one canonical case per official external record, idempotently."""
    incident_id, raw_event_id = uuid4(), uuid4()
    now = datetime.now(timezone.utc)
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id FROM incidents WHERE source_event_key = %s", (event.dedupe_key,))
        existing = cursor.fetchone()
        if existing:
            return existing["id"], False
        payload = event.model_dump(mode="json")
        cursor.execute("INSERT INTO raw_events (id, source_kind, source_id, source_url, observed_at, payload_json, received_at, idempotency_key) VALUES (%s, 'official_api', %s, %s, %s, %s::jsonb, %s, %s)", (raw_event_id, event.source_id, str(event.source_url), event.observed_at, __import__('json').dumps(payload), now, event.dedupe_key))
        cursor.execute("INSERT INTO incidents (id, type, summary, verification_status, lifecycle_state, first_seen, updated_at, public_visibility, source_event_key) VALUES (%s, %s, %s, 'officially_confirmed', 'received', %s, %s, true, %s)", (incident_id, event.event_type, event.description, now, now, event.dedupe_key))
        cursor.execute("INSERT INTO case_events (incident_id, actor, event_type, timestamp, payload_redacted) VALUES (%s, %s, 'official_event_received', %s, '{}'::jsonb)", (incident_id, event.source_id, now))
    return incident_id, True

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "lastline-api"}

@app.get("/readyz")
def readyz():
    try:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return {"status": "ready", "database_configured": True}
    except Exception:
        return {"status": "unavailable", "database_configured": bool(os.getenv("DATABASE_URL"))}

@app.post("/v1/reports", response_model=Receipt, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, idempotency_key: Annotated[str | None, Header()] = None):
    if idempotency_key and len(idempotency_key) > 200:
        raise HTTPException(400, "Invalid idempotency key")
    incident_id, report_id, raw_event_id = uuid4(), uuid4(), uuid4()
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    event_payload = payload.model_dump(exclude={"contact"})
    event_payload["received_at"] = now.isoformat()
    try:
        with _connection() as connection, connection.cursor() as cursor:
            cursor.execute("INSERT INTO raw_events (id, source_kind, payload_json, received_at, idempotency_key) VALUES (%s, 'citizen', %s::jsonb, %s, %s)", (raw_event_id, __import__("json").dumps(event_payload), now, idempotency_key or str(raw_event_id)))
            cursor.execute("INSERT INTO incidents (id, type, summary, verification_status, lifecycle_state, first_seen, updated_at, public_visibility) VALUES (%s, %s, %s, 'community_reported', 'received', %s, %s, true)", (incident_id, payload.category or "access_barrier", _public_summary(payload.description), now, now))
            cursor.execute("INSERT INTO incident_reports (id, incident_id, raw_event_id, report_time, tracking_token_hash) VALUES (%s, %s, %s, %s, %s)", (report_id, incident_id, raw_event_id, now, _token_hash(token)))
            cursor.execute("INSERT INTO case_events (incident_id, actor, event_type, timestamp, payload_redacted) VALUES (%s, 'citizen', 'report_received', %s, '{}'::jsonb)", (incident_id, now))
        return Receipt(incident_id=incident_id, report_id=report_id, tracking_token=token, verification_status=VerificationStatus.COMMUNITY_REPORTED, lifecycle_state="received")
    except psycopg.Error as exc:
        raise HTTPException(503, "Report storage is temporarily unavailable") from exc

@app.post("/v1/internal/official-events", status_code=status.HTTP_201_CREATED)
def create_official_event(event: OfficialEvent, x_source_ingest_token: Annotated[str | None, Header()] = None):
    configured_token = os.getenv("SOURCE_INGEST_TOKEN")
    if not configured_token:
        raise HTTPException(503, "Official source ingestion is not configured")
    if not x_source_ingest_token or not secrets.compare_digest(configured_token, x_source_ingest_token):
        raise HTTPException(403, "Invalid source ingestion credentials")
    try:
        incident_id, created = ingest_official_event(event)
        return {"incident_id": incident_id, "created": created, "source_id": event.source_id}
    except psycopg.Error as exc:
        raise HTTPException(503, "Official event storage is temporarily unavailable") from exc

@app.get("/v1/incidents/{incident_id}/dependencies")
def get_dependencies(incident_id: UUID):
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT upstream_entity, downstream_entity, dependency_type, confidence_label FROM dependencies WHERE upstream_entity = %s OR downstream_entity = %s", (incident_id, incident_id))
        edges = cursor.fetchall()
    return {"incident_id": incident_id, "edges": edges, "effect_label": "possible unless independently verified"}

@app.get("/v1/incidents/{incident_id}/alternatives")
def get_alternatives(incident_id: UUID):
    return {"incident_id": incident_id, "alternatives": [], "caveat": "No verified alternative capacity, stock, booking, insurance, or accessibility availability is currently available."}

@app.post("/v1/operations/incidents/{incident_id}/interventions", status_code=201)
def propose_intervention(incident_id: UUID, proposal: InterventionCreate, x_operations_token: Annotated[str | None, Header()] = None):
    _require_operations_token(x_operations_token)
    intervention_id = uuid4()
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("INSERT INTO interventions (id, incident_id, action_type, proposed_payload, approval_state, idempotency_key) VALUES (%s, %s, %s, %s::jsonb, 'proposed', %s) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id", (intervention_id, incident_id, proposal.action_type, __import__('json').dumps(proposal.proposed_payload), proposal.idempotency_key))
        row = cursor.fetchone()
    return {"intervention_id": row["id"] if row else intervention_id, "approval_state": "proposed", "external_action_permitted": False}

@app.post("/v1/operations/interventions/{intervention_id}/{decision}")
def decide_intervention(intervention_id: UUID, decision: str, x_operations_token: Annotated[str | None, Header()] = None):
    _require_operations_token(x_operations_token)
    if decision not in {"approve", "reject"}: raise HTTPException(404, "Unknown operation")
    state = "approved" if decision == "approve" else "rejected"
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("UPDATE interventions SET approval_state = %s, approved_at = now() WHERE id = %s RETURNING id", (state, intervention_id))
        if not cursor.fetchone(): raise HTTPException(404, "Intervention not found")
    return {"intervention_id": intervention_id, "approval_state": state, "external_action_executed": False}

@app.post("/v1/operations/nebius/smoke-test")
def nebius_smoke(x_operations_token: Annotated[str | None, Header()] = None):
    _require_operations_token(x_operations_token)
    try: return smoke_test()
    except NebiusNotConfigured as exc: raise HTTPException(503, str(exc)) from exc
    except Exception as exc: raise HTTPException(502, "Nebius smoke test failed") from exc

@app.get("/v1/incidents/{incident_id}", response_model=PublicIncident)
def get_incident(incident_id: UUID):
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id, summary, type AS category, verification_status, lifecycle_state, first_seen FROM incidents WHERE id = %s AND public_visibility = true", (incident_id,))
        row = cursor.fetchone()
    if not row:
        raise HTTPException(404, "Incident not found")
    return PublicIncident(**row, location_label="Location withheld pending verification")

@app.get("/v1/incidents", response_model=list[PublicIncident])
def list_incidents(limit: int = 30):
    limit = max(1, min(limit, 100))
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id, summary, type AS category, verification_status, lifecycle_state, first_seen FROM incidents WHERE public_visibility = true ORDER BY updated_at DESC LIMIT %s", (limit,))
        rows = cursor.fetchall()
    return [PublicIncident(**row, location_label="Location withheld pending verification") for row in rows]

@app.get("/v1/incidents/{incident_id}/events")
def incident_events(incident_id: UUID):
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT actor, event_type, timestamp FROM case_events WHERE incident_id = %s ORDER BY timestamp", (incident_id,))
        return {"incident_id": incident_id, "events": cursor.fetchall(), "streaming": "SSE is not configured; poll this redacted timeline."}

@app.get("/v1/incidents/{incident_id}/evidence")
def incident_evidence(incident_id: UUID):
    return {"incident_id": incident_id, "evidence": [], "status": "No source-linked evidence has been collected yet."}

@app.get("/v1/reports/{report_id}", response_model=Receipt)
def get_private_report(report_id: UUID, tracking_token: Annotated[str | None, Header()] = None):
    if not tracking_token:
        raise HTTPException(404, "Report not found")
    with _connection() as connection, connection.cursor() as cursor:
        cursor.execute("SELECT r.id, r.incident_id, r.tracking_token_hash, i.verification_status, i.lifecycle_state FROM incident_reports r JOIN incidents i ON i.id = r.incident_id WHERE r.id = %s", (report_id,))
        row = cursor.fetchone()
    if not row or not secrets.compare_digest(row["tracking_token_hash"], _token_hash(tracking_token)):
        raise HTTPException(404, "Report not found")
    return Receipt(incident_id=row["incident_id"], report_id=row["id"], tracking_token="", verification_status=row["verification_status"], lifecycle_state=row["lifecycle_state"])
