import type { Facility } from "./facilities";

export type WeatherAlert = {
  id: string;
  event: string;
  severity: string;
  headline: string;
  areaDesc: string;
  sent: string;
  senderName: string;
  countyFips: string[];
  link: string;
};

const SEVERITY_RANK: Record<string, number> = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };

export const NWS_ALERTS_URL = "https://api.weather.gov/alerts/active?status=actual&message_type=alert&region_type=land";

/** Fetch active land-based NWS alerts straight from the official public API (CORS enabled). */
export async function fetchWeatherAlerts(): Promise<WeatherAlert[]> {
  const response = await fetch(NWS_ALERTS_URL, { headers: { Accept: "application/geo+json" } });
  if (!response.ok) throw new Error("NWS alerts unavailable");
  const data = await response.json();
  return (data.features ?? []).map((feature: { id: string; properties: Record<string, any> }) => {
    const p = feature.properties;
    // SAME codes look like "042101": a leading 0 followed by the 5-digit county FIPS.
    const same: string[] = p.geocode?.SAME ?? [];
    return {
      id: p.id ?? feature.id,
      event: p.event,
      severity: p.severity ?? "Unknown",
      headline: p.headline ?? p.event,
      areaDesc: p.areaDesc ?? "",
      sent: p.sent,
      senderName: p.senderName ?? "National Weather Service",
      countyFips: same.map((code) => code.slice(1)),
      link: p["@id"] ?? feature.id,
    } satisfies WeatherAlert;
  });
}

export type AlertImpact = { alert: WeatherAlert; facilities: Facility[] };

export function alertImpacts(alerts: WeatherAlert[], index: Map<string, Facility[]>): AlertImpact[] {
  return alerts
    .map((alert) => ({ alert, facilities: alert.countyFips.flatMap((fips) => index.get(fips) ?? []) }))
    .filter((impact) => impact.facilities.length > 0)
    .sort(
      (a, b) =>
        (SEVERITY_RANK[b.alert.severity] ?? 0) - (SEVERITY_RANK[a.alert.severity] ?? 0) ||
        b.facilities.length - a.facilities.length,
    );
}
