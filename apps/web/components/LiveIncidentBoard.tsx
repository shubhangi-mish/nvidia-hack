"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchIncidents, type Incident } from "../lib/api";
import { StatusBadge } from "./StatusBadge";
import { MapPinIcon } from "./Icons";

const scenarios = [
  {
    name: "NYC Health + Hospitals / Bellevue",
    address: "462 First Avenue, New York, NY 10016",
    simulated: "A public entrance access barrier is reported. Status stays “community reported” until an official notice is linked.",
    next: "Verify the official facility update, show only directory alternatives, and promise nothing about appointments or treatment.",
    href: "https://www.nychealthandhospitals.org/locations/bellevue/",
  },
  {
    name: "NYC Health + Hospitals / Harlem",
    address: "506 Lenox Avenue, New York, NY 10037",
    simulated: "An elevator outage affects the trip to a public facility. This is not a claim about hospital operations.",
    next: "Check the transit operator's official status, then offer step-free route candidates with unknowns clearly labeled.",
    href: "https://www.nychealthandhospitals.org/locations/harlem/",
  },
];

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
        <h2 id="live-title">Active incidents and service access</h2>
        <p className="lede narrow">
          Refreshes every 30 seconds. A source record is not the same as a confirmed service disruption, and personal
          report locations are never plotted.
        </p>

        <div className="board">
          <div className="map-wrap">
            <iframe
              title="United States reference map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-127%2C24%2C-66%2C50&amp;layer=mapnik"
              loading="lazy"
            />
            <p className="hint">Pins appear only when a public, verified coordinate exists.</p>
          </div>

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

        <h3 className="scenario-title">Scenario sandbox <span className="pill">Simulated, not live</span></h3>
        <p className="hint">Examples of how a disruption would be explained, using real public facility addresses.</p>
        <div className="card-grid two">
          {scenarios.map((scenario) => (
            <article className="card" key={scenario.name}>
              <h3>{scenario.name}</h3>
              <p className="hint">{scenario.address}</p>
              <p><strong>Simulated:</strong> {scenario.simulated}</p>
              <p><strong>Possible next step:</strong> {scenario.next}</p>
              <a href={scenario.href} target="_blank" rel="noreferrer">Official facility reference</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
