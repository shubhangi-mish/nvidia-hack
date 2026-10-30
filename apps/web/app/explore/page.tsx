"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchIncidents, type Incident } from "../../lib/api";
import { StatusBadge } from "../../components/StatusBadge";

export default function Explore() {
  const [items, setItems] = useState<Incident[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = () =>
      fetchIncidents()
        .then((data) => { setItems(data); setError(""); })
        .catch(() => setError("Incident information is currently unavailable."));
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="container page">
      <p className="eyebrow">Public incidents</p>
      <h1 className="h1-small">Explore reports</h1>
      <p className="lede narrow">
        Reports are never verified by volume. Each one shows its status plainly, so you can tell a lead from a
        confirmed disruption.
      </p>
      {error && <p className="notice" role="alert">{error}</p>}
      {!error && items === null && <p aria-busy="true">Loading…</p>}
      {!error && items?.length === 0 && (
        <div className="empty">
          <p><strong>No public incidents are available yet.</strong></p>
          <p>Have you seen a barrier to care? <Link href="/report">Report it</Link>.</p>
        </div>
      )}
      <section aria-label="Incident list">
        {items?.map((item) => (
          <article className="incident-card" key={item.id}>
            <StatusBadge status={item.verification_status} />
            <p>{item.summary}</p>
            <small>Received {new Date(item.first_seen).toLocaleString()}</small>
            <p><Link href={`/incidents/${item.id}`}>View status</Link></p>
          </article>
        ))}
      </section>
    </main>
  );
}
