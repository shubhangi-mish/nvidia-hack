import { statusLabel } from "../lib/incident";

const classes: Record<string, string> = {
  community_reported: "s-community",
  under_investigation: "s-investigating",
  officially_confirmed: "s-confirmed",
  resolved: "s-resolved",
  disputed: "s-disputed",
  unknown: "s-community",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${classes[status] ?? "s-community"}`}>{statusLabel(status)}</span>;
}
