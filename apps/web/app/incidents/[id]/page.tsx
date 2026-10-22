"use client";
import { useEffect, useState } from "react";
import { statusLabel } from "../../../lib/incident";
type Incident = { id: string; summary: string; category?: string; verification_status: string; lifecycle_state: string; first_seen: string; location_label: string };
export default function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    params
      .then(({ id }) => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/v1/incidents/${id}`))
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setIncident)
      .catch(() => setError("This public incident is unavailable."));
  }, [params]);
  if (error) return <main><p role="alert">{error}</p></main>;
  if (!incident) return <main aria-busy="true">Loading incident…</main>;
  return <main><nav><a href="/">LASTLINE</a></nav><p className="eyebrow">{statusLabel(incident.verification_status)}</p><h1>Report status</h1><p>{incident.summary}</p><dl><dt>Location</dt><dd>{incident.location_label}</dd><dt>Case state</dt><dd>{statusLabel(incident.lifecycle_state)}</dd><dt>Received</dt><dd>{new Date(incident.first_seen).toLocaleString()}</dd></dl><aside role="note">Information may change as evidence is reviewed. This page excludes reporter-identifying details.</aside></main>;
}
