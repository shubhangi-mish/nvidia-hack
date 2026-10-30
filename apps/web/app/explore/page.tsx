"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Incident = { id: string; summary: string; verification_status: string; first_seen: string };
export default function Explore() {
  const [items, setItems] = useState<Incident[]>([]); const [error, setError] = useState("");
  useEffect(() => {
    const load = () => fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/v1/incidents`).then(r => r.ok ? r.json() : Promise.reject()).then((data) => { setItems(data); setError(""); }).catch(() => setError("Incident information is currently unavailable."));
    load(); const timer = window.setInterval(load, 30_000); return () => window.clearInterval(timer);
  }, []);
  return <main><nav><Link href="/">LASTLINE</Link><Link href="/report">Report a problem</Link></nav><h1>Explore reports</h1><p>Reports are not verified by volume. Each status is shown plainly.</p>{error && <p role="alert">{error}</p>}{!error && items.length === 0 && <p>No public incidents are available yet.</p>}<section aria-label="Incident list">{items.map(item => <article className="incident-card" key={item.id}><p className="eyebrow">{item.verification_status.replaceAll("_", " ")}</p><p>{item.summary}</p><small>Received {new Date(item.first_seen).toLocaleString()}</small><p><Link href={`/incidents/${item.id}`}>View status</Link></p></article>)}</section></main>;
}
