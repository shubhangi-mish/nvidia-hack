export function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function hasSafePublicLocation(locationLabel: string): boolean {
  return locationLabel === "Location withheld pending verification";
}
