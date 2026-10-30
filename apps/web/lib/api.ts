export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type Incident = {
  id: string;
  summary: string;
  category?: string | null;
  verification_status: string;
  lifecycle_state?: string;
  first_seen: string;
  location_label: string;
};

export async function fetchIncidents(): Promise<Incident[]> {
  const response = await fetch(`${API_BASE}/v1/incidents`);
  if (!response.ok) throw new Error("incidents unavailable");
  return response.json();
}
