"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import {
  byCounty, countByKind, distanceMiles, facilityKey, loadFacilities, nearestAlternatives, totalStations,
  IN_CENTER_HD, EMERGENCY_SERVICES, type Facility, type FacilityDataset, type FacilityKind,
} from "../lib/facilities";
import { alertImpacts, fetchWeatherAlerts, type AlertImpact, type WeatherAlert } from "../lib/nws";
import { requestBrief, type AiBrief } from "../lib/brief";

type Scenario = {
  kind: "nws" | "simulated";
  title: string;
  alert?: WeatherAlert;
  origin?: Facility;
  facilities: Facility[];
};

const SIMULATION_RADIUS_MILES = 25;
const KIND_COLOR: Record<FacilityKind, string> = { dialysis: "#0b6b73", hospital: "#2b5fc7" };
const nf = new Intl.NumberFormat("en-US");
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function popupContent(facility: Facility): HTMLElement {
  const root = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = facility.name;
  const line = document.createElement("div");
  line.textContent = `${facility.city}, ${facility.state} ${facility.zip}`;
  const meta = document.createElement("div");
  meta.textContent =
    facility.kind === "dialysis"
      ? `Dialysis facility · ${facility.stations} stations`
      : `Hospital · ${(facility.services & EMERGENCY_SERVICES) === EMERGENCY_SERVICES ? "emergency services" : "no emergency services listed"}`;
  const note = document.createElement("small");
  note.textContent = "Location is approximate (ZIP-code centre). Directory listing, not live availability.";
  root.append(title, line, meta, note);
  return root;
}

export function ImpactMap() {
  const mapEl = useRef<HTMLDivElement>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const overlay = useRef<Leaflet.LayerGroup | null>(null);
  // One shared canvas for every layer: a second canvas on top would swallow clicks meant for the base facilities.
  const renderer = useRef<Leaflet.Canvas | null>(null);
  const kindLayers = useRef<Record<FacilityKind, Leaflet.LayerGroup | null>>({ dialysis: null, hospital: null });

  const [dataset, setDataset] = useState<FacilityDataset | null>(null);
  const [loadError, setLoadError] = useState("");
  const [alerts, setAlerts] = useState<WeatherAlert[] | null>(null);
  const [alertsError, setAlertsError] = useState(false);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [decision, setDecision] = useState<"" | "approved" | "rejected">("");
  const [show, setShow] = useState<Record<FacilityKind, boolean>>({ dialysis: true, hospital: true });
  const [brief, setBrief] = useState<AiBrief | null>(null);
  const [briefState, setBriefState] = useState<"idle" | "loading" | "error">("idle");
  const [briefError, setBriefError] = useState("");

  const index = useMemo(() => (dataset ? byCounty(dataset.facilities) : null), [dataset]);
  const impacts: AlertImpact[] = useMemo(
    () => (alerts && index ? alertImpacts(alerts, index) : []),
    [alerts, index],
  );
  const dialysisAlternatives = useMemo(
    () => (dataset && scenario ? nearestAlternatives(dataset.facilities, scenario.facilities, "dialysis") : []),
    [dataset, scenario],
  );
  const hospitalAlternatives = useMemo(
    () => (dataset && scenario ? nearestAlternatives(dataset.facilities, scenario.facilities, "hospital", 3) : []),
    [dataset, scenario],
  );
  const alternatives = useMemo(() => [...dialysisAlternatives, ...hospitalAlternatives], [dialysisAlternatives, hospitalAlternatives]);
  const counts = useMemo(
    () => ({
      dialysis: dataset ? countByKind(dataset.facilities, "dialysis") : 0,
      hospital: dataset ? countByKind(dataset.facilities, "hospital") : 0,
    }),
    [dataset],
  );

  // Load the official facility directory and live NWS alerts.
  useEffect(() => {
    loadFacilities().then(setDataset).catch(() => setLoadError("The facility directory could not be loaded."));
    const refresh = () =>
      fetchWeatherAlerts().then((data) => { setAlerts(data); setAlertsError(false); }).catch(() => setAlertsError(true));
    refresh();
    const timer = window.setInterval(refresh, 120_000);
    return () => window.clearInterval(timer);
  }, []);

  // Create the map and one base layer per facility kind once the data is ready.
  useEffect(() => {
    if (!dataset || !mapEl.current || map.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapEl.current) return;
      leaflet.current = L;
      const instance = L.map(mapEl.current, { preferCanvas: true, zoomControl: true, minZoom: 3 }).setView([39.2, -96.5], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap contributors",
      }).addTo(instance);
      renderer.current = L.canvas({ padding: 0.5 });
      const groups: Record<FacilityKind, Leaflet.LayerGroup> = { dialysis: L.layerGroup(), hospital: L.layerGroup() };
      for (const facility of dataset.facilities) {
        L.circleMarker([facility.lat, facility.lon], {
          renderer: renderer.current,
          radius: facility.kind === "hospital" ? 3.5 : 3,
          weight: 0,
          fillColor: KIND_COLOR[facility.kind],
          fillOpacity: 0.55,
        })
          .bindPopup(() => popupContent(facility))
          .on("click", () => setSelected(facility))
          .addTo(groups[facility.kind]);
      }
      groups.dialysis.addTo(instance);
      groups.hospital.addTo(instance);
      kindLayers.current = groups;
      overlay.current = L.layerGroup().addTo(instance);
      map.current = instance;
    });
    return () => { cancelled = true; };
  }, [dataset]);

  // Layer toggles.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    for (const kind of ["dialysis", "hospital"] as FacilityKind[]) {
      const group = kindLayers.current[kind];
      if (!group) continue;
      if (show[kind] && !instance.hasLayer(group)) group.addTo(instance);
      if (!show[kind] && instance.hasLayer(group)) instance.removeLayer(group);
    }
  }, [show, dataset]);

  // Draw the highlighted scenario on top of the base layers.
  useEffect(() => {
    const L = leaflet.current;
    const group = overlay.current;
    const instance = map.current;
    if (!L || !group || !instance) return;
    group.clearLayers();
    if (!scenario) return;
    const bounds = L.latLngBounds([]);
    if (scenario.kind === "simulated" && scenario.origin) {
      L.circle([scenario.origin.lat, scenario.origin.lon], {
        radius: SIMULATION_RADIUS_MILES * 1609.34, renderer: renderer.current ?? undefined, color: "#c8321f", weight: 2, fillColor: "#c8321f", fillOpacity: 0.08,
      }).addTo(group);
      bounds.extend([scenario.origin.lat, scenario.origin.lon]);
    }
    for (const facility of scenario.facilities) {
      L.circleMarker([facility.lat, facility.lon], { renderer: renderer.current ?? undefined, radius: 7, color: "#fff", weight: 1.5, fillColor: "#c8321f", fillOpacity: 0.95 })
        .bindPopup(() => popupContent(facility)).addTo(group);
      bounds.extend([facility.lat, facility.lon]);
    }
    for (const { facility } of alternatives) {
      L.circleMarker([facility.lat, facility.lon], { renderer: renderer.current ?? undefined, radius: 8, color: "#fff", weight: 2, fillColor: "#1d8a4a", fillOpacity: 1 })
        .bindPopup(() => popupContent(facility)).addTo(group);
      bounds.extend([facility.lat, facility.lon]);
    }
    if (bounds.isValid()) instance.fitBounds(bounds.pad(0.2), { maxZoom: 9 });
  }, [scenario, alternatives]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  function open(next: Scenario) {
    setDecision("");
    setBrief(null);
    setBriefState("idle");
    setBriefError("");
    setScenario(next);
  }

  function chooseAlert(impact: AlertImpact) {
    open({ kind: "nws", title: impact.alert.event, alert: impact.alert, facilities: impact.facilities });
  }

  function simulate(origin: Facility) {
    if (!dataset) return;
    const nearby = dataset.facilities.filter(
      (f) => distanceMiles(origin.lat, origin.lon, f.lat, f.lon) <= SIMULATION_RADIUS_MILES,
    );
    open({ kind: "simulated", title: `Simulated outage near ${origin.city}, ${origin.state}`, origin, facilities: nearby });
  }

  async function askAi() {
    if (!scenario) return;
    setBriefState("loading");
    try {
      setBrief(await requestBrief(scenario, alternatives));
      setBriefState("idle");
    } catch (reason) {
      setBriefError(reason instanceof Error ? reason.message : "The AI briefing is unavailable right now.");
      setBriefState("error");
    }
  }

  const stations = scenario ? totalStations(scenario.facilities) : 0;
  const dialysisHit = scenario ? countByKind(scenario.facilities, "dialysis") : 0;
  const hospitalHit = scenario ? countByKind(scenario.facilities, "hospital") : 0;
  const inCenter = scenario ? scenario.facilities.filter((f) => f.kind === "dialysis" && (f.services & IN_CENTER_HD) === IN_CENTER_HD).length : 0;

  return (
    <div className="impact">
      <div className="impact-map-col">
        <div className="impact-stats" aria-live="polite">
          <div><strong>{dataset ? nf.format(counts.dialysis) : "…"}</strong><span>dialysis facilities</span></div>
          <div><strong>{dataset ? nf.format(counts.hospital) : "…"}</strong><span>hospitals</span></div>
          <div>
            <strong>{alertsError ? "n/a" : alerts ? impacts.length : "…"}</strong>
            <span>live weather alerts touching them</span>
          </div>
        </div>
        <div className="impact-map" ref={mapEl} role="region" aria-label="Map of US dialysis facilities and hospitals with live weather alerts">
          {!dataset && !loadError && <p className="map-loading" aria-busy="true">Loading the national facility directory…</p>}
          {loadError && <p className="notice" role="alert">{loadError}</p>}
        </div>
        <div className="legend-row">
          <fieldset className="layer-toggles">
            <legend className="sr-only">Show on map</legend>
            <label><input type="checkbox" checked={show.dialysis} onChange={(e) => setShow({ ...show, dialysis: e.target.checked })} /> <i className="dot dot-teal" /> Dialysis</label>
            <label><input type="checkbox" checked={show.hospital} onChange={(e) => setShow({ ...show, hospital: e.target.checked })} /> <i className="dot dot-blue" /> Hospitals</label>
          </fieldset>
          <ul className="legend" aria-label="Map legend">
            <li><i className="dot dot-red" /> Possibly affected</li>
            <li><i className="dot dot-green" /> Nearest alternatives</li>
          </ul>
        </div>
        <p className="hint">
          Sources: <a href={dataset?.sourceUrl ?? "https://data.cms.gov/provider-data/"} target="_blank" rel="noreferrer">CMS dialysis and hospital directories</a>
          {dataset?.cmsModified ? ` (updated ${dataset.cmsModified})` : ""} and live alerts from the{" "}
          <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer">National Weather Service</a>.
          Pins sit at the centre of each facility&rsquo;s ZIP code, not its street address. Pharmacies are not included: there is no open national official dataset.
        </p>
      </div>

      <div className="impact-panel">
        {!scenario ? (
          <>
            <h3>Happening right now</h3>
            <p className="hint">
              These are real, active National Weather Service alerts. Pick one to see what LASTLINE would do with it.
            </p>
            {alertsError && <p className="notice" role="alert">Live weather alerts are temporarily unavailable.</p>}
            {!alerts && !alertsError && <p aria-busy="true">Checking the National Weather Service…</p>}
            {alerts && impacts.length === 0 && <p className="empty">No active alerts currently touch a listed facility.</p>}
            <ul className="alert-list">
              {impacts.slice(0, 8).map((impact) => (
                <li key={impact.alert.id}>
                  <button type="button" className="alert-item" onClick={() => chooseAlert(impact)}>
                    <span className={`sev sev-${impact.alert.severity.toLowerCase()}`}>{impact.alert.severity}</span>
                    <strong>{impact.alert.event}</strong>
                    <span className="alert-area">{impact.alert.areaDesc.split(";").slice(0, 3).join(", ")}</span>
                    <span className="alert-count">
                      {nf.format(countByKind(impact.facilities, "dialysis"))} dialysis · {nf.format(countByKind(impact.facilities, "hospital"))} hospitals
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="simulate-box">
              <h3>Or simulate an outage</h3>
              {selected ? (
                <>
                  <p><strong>{selected.name}</strong><br />{selected.city}, {selected.state}</p>
                  <button type="button" onClick={() => simulate(selected)}>Simulate an outage here</button>
                </>
              ) : (
                <p className="hint">Click any dot on the map, then simulate a power or road outage within {SIMULATION_RADIUS_MILES} miles.</p>
              )}
            </div>
          </>
        ) : (
          <div className="pipeline">
            <button type="button" className="back-link" onClick={() => { setScenario(null); setDecision(""); }}>← Back to live alerts</button>
            <h3>{scenario.title}</h3>

            <ol className="flow">
              <li>
                <span className="flow-num">1</span>
                <div>
                  <strong>A signal comes in</strong>
                  {scenario.alert ? (
                    <p>
                      {scenario.alert.headline}.{" "}
                      <a href={scenario.alert.link} target="_blank" rel="noreferrer">Official NWS record</a>
                      <br /><small>{scenario.alert.senderName} · sent {new Date(scenario.alert.sent).toLocaleString()}</small>
                    </p>
                  ) : (
                    <p>A community report says a power or road outage is blocking access near {scenario.origin?.city}. <small>(Simulated)</small></p>
                  )}
                </div>
              </li>
              <li>
                <span className="flow-num">2</span>
                <div>
                  <strong>Status stays honest</strong>
                  <p>
                    <span className={`badge ${scenario.alert ? "s-confirmed" : "s-community"}`}>
                      {scenario.alert ? "Official alert confirmed" : "Community reported"}
                    </span>
                  </p>
                  <p>
                    {scenario.alert
                      ? "The alert is real. Whether any facility is actually disrupted is still unknown, and LASTLINE says so."
                      : "Unverified until an official source supports it."}
                  </p>
                </div>
              </li>
              <li>
                <span className="flow-num">3</span>
                <div>
                  <strong>Who could be affected</strong>
                  <p>
                    <b>{nf.format(dialysisHit)}</b> dialysis {plural(dialysisHit, "facility", "facilities")} with{" "}
                    <b>{nf.format(stations)}</b> {plural(stations, "station", "stations")} ({inCenter} offer in-center treatment) and{" "}
                    <b>{nf.format(hospitalHit)}</b> {plural(hospitalHit, "hospital", "hospitals")} lie in the area.
                  </p>
                  <ul className="mini-list">
                    {scenario.facilities.slice(0, 4).map((f) => <li key={facilityKey(f)}>{f.name}, {f.city}</li>)}
                    {scenario.facilities.length > 4 && <li>+ {scenario.facilities.length - 4} more (red dots)</li>}
                  </ul>
                </div>
              </li>
              <li>
                <span className="flow-num">4</span>
                <div>
                  <strong>AI drafts, a human decides</strong>
                  {alternatives.length > 0 && (
                    <p className="hint">
                      Nearest alternatives (green): {alternatives.slice(0, 3).map((a) => `${a.facility.name} (${Math.round(a.miles)} mi)`).join("; ")}.
                    </p>
                  )}
                  {!brief && briefState !== "loading" && (
                    <button type="button" onClick={askAi}>Ask the AI investigator for a brief</button>
                  )}
                  {briefState === "loading" && <p aria-busy="true">An NVIDIA model on Nebius is drafting a brief…</p>}
                  {briefState === "error" && <p className="notice" role="alert">{briefError}</p>}
                  {brief && (
                    <>
                      <blockquote>
                        <p>{brief.summary}</p>
                        <ul className="mini-list">
                          {brief.priorityActions.map((action) => <li key={action}>{action}</li>)}
                        </ul>
                        <p><em>Not yet known: {brief.caveat}</em></p>
                        <small>Drafted by {brief.modelId} via Nebius Token Factory. A draft, not a fact.</small>
                      </blockquote>
                      {decision === "" ? (
                        <div className="decision">
                          <button type="button" onClick={() => setDecision("approved")}>Approve</button>
                          <button type="button" className="button-ghost" onClick={() => setDecision("rejected")}>Reject</button>
                        </div>
                      ) : (
                        <p className="note" role="status">
                          {decision === "approved" ? "Approved." : "Rejected."} In the real system this writes an audit record.
                          Nothing is sent to anyone automatically, and nothing was sent here.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
