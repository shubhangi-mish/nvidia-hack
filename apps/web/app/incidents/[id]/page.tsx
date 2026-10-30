"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE, type Incident } from "../../../lib/api";
import { statusLabel } from "../../../lib/incident";
import { StatusBadge } from "../../../components/StatusBadge";

export default function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    params
      .then(({ id }) => fetch(`${API_BASE}/v1/incidents/${id}`))
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(setIncident)
      .catch(() => setError("This public incident is unavailable."));
  }, [params]);

  if (error) return <main className="container page"><p className="notice" role="alert">{error}</p><p><Link href="/explore">Back to all incidents</Link></p></main>;
  if (!incident) return <main className="container page" aria-busy="true">Loading incident…</main>;

  return (
    <main className="container page narrow-page">
      <StatusBadge status={incident.verification_status} />
      <h1 className="h1-small">Report status</h1>
      <p className="lede">{incident.summary}</p>
      <dl className="facts">
        <div><dt>Location</dt><dd>{incident.location_label}</dd></div>
        <div><dt>Case state</dt><dd>{statusLabel(incident.lifecycle_state ?? "unknown")}</dd></div>
        <div><dt>Received</dt><dd>{new Date(incident.first_seen).toLocaleString()}</dd></div>
      </dl>
      <aside className="note" role="note">
        Information may change as evidence is reviewed. This page excludes reporter-identifying details.
      </aside>
      <p><Link href="/explore">← All incidents</Link></p>
    </main>
  );
}
