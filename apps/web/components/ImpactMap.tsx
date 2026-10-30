"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import {
  byCounty, distanceMiles, loadFacilities, nearestAlternatives, totalStations,
  IN_CENTER_HD, type Facility, type FacilityDataset,
} from "../lib/facilities";
import { alertImpacts, fetchWeatherAlerts, type AlertImpact, type WeatherAlert } from "../lib/nws";

type Scenario = {
  kind: "nws" | "simulated";
  title: string;
  alert?: WeatherAlert;
  origin?: Facility;
  facilities: Facility[];
};

const SIMULATION_RADIUS_MILES = 25;
const nf = new Intl.NumberFormat("en-US");

function popupContent(facility: Facility): HTMLElement {
  const root = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = facility.name;
  const line = document.createElement("div");
  line.textContent = `${facility.city}, ${facility.state} ${facility.zip}`;
  const meta = document.createElement("div");
  meta.textContent = `${facility.stations} dialysis stations`;
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

  const [dataset, setDataset] = useState<FacilityDataset | null>(null);
  const [loadError, setLoadError] = useState("");
  const [alerts, setAlerts] = useState<WeatherAlert[] | null>(null);
  const [alertsError, setAlertsError] = useState(false);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [decision, setDecision] = useState<"" | "approved" | "rejected">("");

  const index = useMemo(() => (dataset ? byCounty(dataset.facilities) : null), [dataset]);
  const impacts: AlertImpact[] = useMemo(
    () => (alerts && index ? alertImpacts(alerts, index) : []),
    [alerts, index],
  );
  const alternatives = useMemo(
    () => (dataset && scenario ? nearestAlternatives(dataset.facilities, scenario.facilities) : []),
    [dataset, scenario],
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

  // Create the map and the base layer of every facility once the data is ready.
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
      const renderer = L.canvas({ padding: 0.5 });
      for (const facility of dataset.facilities) {
        L.circleMarker([facility.lat, facility.lon], {
          renderer, radius: 3, weight: 0, fillColor: "#0b6b73", fillOpacity: 0.55,
        })
          .bindPopup(() => popupContent(facility))
          .on("click", () => setSelected(facility))
          .addTo(instance);
      }
      overlay.current = L.layerGroup().addTo(instance);
      map.current = instance;
    });
    return () => { cancelled = true; };
  }, [dataset]);

  // Draw the highlighted scenario on top of the base layer.
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
        radius: SIMULATION_RADIUS_MILES * 1609.34, color: "#c8321f", weight: 2, fillColor: "#c8321f", fillOpacity: 0.08,
      }).addTo(group);
      bounds.extend([scenario.origin.lat, scenario.origin.lon]);
    }
    for (const facility of scenario.facilities) {
      L.circleMarker([facility.lat, facility.lon], { radius: 7, color: "#fff", weight: 1.5, fillColor: "#c8321f", fillOpacity: 0.95 })
        .bindPopup(() => popupContent(facility)).addTo(group);
      bounds.extend([facility.lat, facility.lon]);
    }
    for (const { facility } of alternatives) {
      L.circleMarker([facility.lat, facility.lon], { radius: 8, color: "#fff", weight: 2, fillColor: "#1d8a4a", fillOpacity: 1 })
        .bindPopup(() => popupContent(facility)).addTo(group);
      bounds.extend([facility.lat, facility.lon]);
    }
    if (bounds.isValid()) instance.fitBounds(bounds.pad(0.2), { maxZoom: 9 });
  }, [scenario, alternatives]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  function chooseAlert(impact: AlertImpact) {
    setDecision("");
    setScenario({ kind: "nws", title: impact.alert.event, alert: impact.alert, facilities: impact.facilities });
  }

  function simulate(origin: Facility) {
    if (!dataset) return;
    const nearby = dataset.facilities.filter(
      (f) => distanceMiles(origin.lat, origin.lon, f.lat, f.lon) <= SIMULATION_RADIUS_MILES,
    );
    setDecision("");
    setScenario({ kind: "simulated", title: `Simulated outage near ${origin.city}, ${origin.state}`, origin, facilities: nearby });
  }

  const stations = scenario ? totalStations(scenario.facilities) : 0;
  const inCenter = scenario ? scenario.facilities.filter((f) => (f.services & IN_CENTER_HD) === IN_CENTER_HD).length : 0;

  return (
    <div className="impact">
      <div className="impact-map-col">
        <div className="impact-stats" aria-live="polite">
          <div><strong>{dataset ? nf.format(dataset.facilities.length) : "…"}</strong><span>US dialysis facilities</span></div>
          <div><strong>{dataset ? nf.format(totalStations(dataset.facilities)) : "…"}</strong><span>dialysis stations (chairs)</span></div>
          <div>
            <strong>{alertsError ? "n/a" : alerts ? impacts.length : "…"}</strong>
            <span>live weather alerts touching them</span>
          </div>
        </div>
        <div className="impact-map" ref={mapEl} role="region" aria-label="Map of US dialysis facilities and live weather alerts">
          {!dataset && !loadError && <p className="map-loading" aria-busy="true">Loading the national facility directory…</p>}
          {loadError && <p className="notice" role="alert">{loadError}</p>}
        </div>
        <ul className="legend" aria-label="Map legend">
          <li><i className="dot dot-teal" /> Dialysis facility</li>
          <li><i className="dot dot-red" /> Possibly affected</li>
          <li><i className="dot dot-green" /> Nearest in-center alternatives</li>
        </ul>
        <p className="hint">
          Source: <a href={dataset?.sourceUrl ?? "https://data.cms.gov/provider-data/dataset/23ew-n7w9"} target="_blank" rel="noreferrer">CMS Dialysis Facility listing</a>
          {dataset?.cmsModified ? ` (updated ${dataset.cmsModified})` : ""} and live alerts from the{" "}
          <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer">National Weather Service</a>.
          Pins sit at the centre of each facility&rsquo;s ZIP code, not its street address.
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
            {alerts && impacts.length === 0 && <p className="empty">No active alerts currently touch a dialysis facility.</p>}
            <ul className="alert-list">
              {impacts.slice(0, 8).map((impact) => (
                <li key={impact.alert.id}>
                  <button type="button" className="alert-item" onClick={() => chooseAlert(impact)}>
                    <span className={`sev sev-${impact.alert.severity.toLowerCase()}`}>{impact.alert.severity}</span>
                    <strong>{impact.alert.event}</strong>
                    <span className="alert-area">{impact.alert.areaDesc.split(";").slice(0, 3).join(", ")}</span>
                    <span className="alert-count">
                      {nf.format(impact.facilities.length)} facilities · {nf.format(totalStations(impact.facilities))} stations
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
                    <b>{nf.format(scenario.facilities.length)}</b> {scenario.facilities.length === 1 ? "facility" : "facilities"} with{" "}
                    <b>{nf.format(stations)}</b> dialysis {stations === 1 ? "station" : "stations"} (
                    {inCenter} {inCenter === 1 ? "offers" : "offer"} in-center treatment) {scenario.facilities.length === 1 ? "lies" : "lie"} in the area.
                  </p>
                  <ul className="mini-list">
                    {scenario.facilities.slice(0, 4).map((f) => <li key={f.ccn}>{f.name}, {f.city}</li>)}
                    {scenario.facilities.length > 4 && <li>+ {scenario.facilities.length - 4} more (red dots)</li>}
                  </ul>
                </div>
              </li>
              <li>
                <span className="flow-num">4</span>
                <div>
                  <strong>A human decides</strong>
                  <p>Draft for coordinator review (generated from the directory in this demo):</p>
                  <blockquote>
                    Call {scenario.facilities.length === 1 ? "the facility" : `all ${nf.format(scenario.facilities.length)} facilities`} to confirm {scenario.facilities.length === 1 ? "it is" : "they are"} open and staffed.
                    {alternatives.length > 0 && <> If any are closed, offer nearby in-center options such as {alternatives.slice(0, 3).map((a) => `${a.facility.name} (${Math.round(a.miles)} mi)`).join(", ")}.</>}
                    {" "}Do not promise appointments or capacity.
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
                </div>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
