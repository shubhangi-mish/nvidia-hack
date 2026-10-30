import { API_BASE } from "./api";
import { countByKind, totalStations, type Facility } from "./facilities";
import type { WeatherAlert } from "./nws";

export type AiBrief = {
  modelId: string;
  summary: string;
  priorityActions: string[];
  caveat: string;
};

type Alternatives = { facility: Facility; miles: number }[];

/** Ask the server (which holds the Nebius key) for a coordinator briefing. Only aggregate facts are sent. */
export async function requestBrief(
  scenario: { title: string; alert?: WeatherAlert; facilities: Facility[] },
  alternatives: Alternatives,
): Promise<AiBrief> {
  const response = await fetch(`${API_BASE}/v1/demo/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: scenario.alert ? "National Weather Service" : "Simulated community report",
      event: scenario.alert?.event ?? scenario.title,
      severity: scenario.alert?.severity ?? "Unknown",
      area: (scenario.alert?.areaDesc ?? scenario.title).slice(0, 240),
      dialysis_facilities: countByKind(scenario.facilities, "dialysis"),
      dialysis_stations: totalStations(scenario.facilities),
      hospitals: countByKind(scenario.facilities, "hospital"),
      sample_facilities: scenario.facilities.slice(0, 5).map((f) => `${f.name}, ${f.city}`.slice(0, 120)),
      nearest_alternatives: alternatives.slice(0, 4).map((a) => `${a.facility.name} (${Math.round(a.miles)} mi)`.slice(0, 140)),
    }),
  });
  if (response.status === 429) throw new Error("The demo's AI limit was reached. Please try again in a few minutes.");
  if (!response.ok) throw new Error("The AI briefing is unavailable right now.");
  const data = await response.json();
  return {
    modelId: data.model_id,
    summary: data.draft.summary,
    priorityActions: data.draft.priority_actions,
    caveat: data.draft.caveat,
  };
}
