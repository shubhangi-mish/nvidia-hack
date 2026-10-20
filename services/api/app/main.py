import hashlib
import os
import secrets
from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="LASTLINE API", version="0.1.0")

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

class StoredReport(BaseModel):
    id: UUID
    incident_id: UUID
    raw_event_id: UUID
    token_hash: str

_incidents: dict[UUID, PublicIncident] = {}
_reports: dict[UUID, StoredReport] = {}

def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def _public_summary(description: str) -> str:
    # Public text is intentionally not the reporter's verbatim allegation.
    return "A community report has been received and is awaiting verification."

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "lastline-api"}

@app.get("/readyz")
def readyz():
    configured = bool(os.getenv("DATABASE_URL"))
    return {"status": "ready" if configured else "configuration_required", "database_configured": configured}

@app.post("/v1/reports", response_model=Receipt, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, idempotency_key: Annotated[str | None, Header()] = None):
    if idempotency_key and len(idempotency_key) > 200:
        raise HTTPException(400, "Invalid idempotency key")
    incident_id, report_id, raw_event_id = uuid4(), uuid4(), uuid4()
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    incident = PublicIncident(
        id=incident_id, summary=_public_summary(payload.description), category=payload.category,
        verification_status=VerificationStatus.COMMUNITY_REPORTED, lifecycle_state="received",
        # Never expose a reporter-supplied precise or home location in a public response.
        first_seen=now, location_label="Location withheld pending verification",
    )
    _incidents[incident_id] = incident
    _reports[report_id] = StoredReport(id=report_id, incident_id=incident_id, raw_event_id=raw_event_id, token_hash=_token_hash(token))
    return Receipt(incident_id=incident_id, report_id=report_id, tracking_token=token,
                   verification_status=incident.verification_status, lifecycle_state=incident.lifecycle_state)

@app.get("/v1/incidents/{incident_id}", response_model=PublicIncident)
def get_incident(incident_id: UUID):
    incident = _incidents.get(incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")
    return incident

@app.get("/v1/reports/{report_id}", response_model=Receipt)
def get_private_report(report_id: UUID, tracking_token: Annotated[str | None, Header()] = None):
    report = _reports.get(report_id)
    if not report or not tracking_token or not secrets.compare_digest(report.token_hash, _token_hash(tracking_token)):
        raise HTTPException(404, "Report not found")
    incident = _incidents[report.incident_id]
    return Receipt(incident_id=report.incident_id, report_id=report.id, tracking_token="",
                   verification_status=incident.verification_status, lifecycle_state=incident.lifecycle_state)
