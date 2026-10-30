"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchIncidents, type Incident } from "../lib/api";
import { StatusBadge } from "./StatusBadge";
import { MapPinIcon } from "./Icons";

export function LiveIncidentBoard() {
  const [items, setItems] = useState<Incident[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = () =>
      fetchIncidents()
        .then((data) => { setItems(data); setError(""); })
        .catch(() => setError("Live incident information is temporarily unavailable."));
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="section section-tint" id="live" aria-labelledby="live-title">
      <div className="container">
        <p className="eyebrow">Live public information</p>
        <h2 id="live-title">Community reports</h2>
        <p className="lede narrow">
          Reports from people on the ground, shown with their verification status. Refreshes every 30 seconds. Personal
          report text and locations are never shown or plotted.
        </p>

        <div className="board">
          <div className="feed">
            <h3>Latest reports</h3>
            {error ? (
              <p className="notice" role="alert">{error}</p>
            ) : items === null ? (
              <p aria-busy="true">Loading…</p>
            ) : items.length === 0 ? (
              <div className="empty">
                <MapPinIcon size={28} />
                <p><strong>No public incidents right now.</strong></p>
                <p>That means nothing has been reported, not that every route is clear.</p>
              </div>
            ) : (
              items.slice(0, 5).map((item) => (
                <article className="incident-card" key={item.id}>
                  <StatusBadge status={item.verification_status} />
                  <p>{item.summary}</p>
                  <small>{item.location_label} · {new Date(item.first_seen).toLocaleString()}</small>
                  <p><Link href={`/incidents/${item.id}`}>Open incident details</Link></p>
                </article>
              ))
            )}
            <Link href="/explore" className="text-link">See all incidents →</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
