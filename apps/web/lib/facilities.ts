export type FacilityKind = "dialysis" | "hospital";

export type Facility = {
  kind: FacilityKind;
  ccn: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
  stations: number;
  services: number;
  countyFips: string;
};

export type FacilityDataset = {
  source: string;
  sourceUrl: string;
  cmsModified: string;
  locationNote: string;
  facilities: Facility[];
};

export const facilityKey = (f: Facility) => `${f.kind}:${f.ccn}`;

export const IN_CENTER_HD = 1;
export const EMERGENCY_SERVICES = 8;

export async function loadFacilities(): Promise<FacilityDataset> {
  const response = await fetch("/data/facilities.json");
  if (!response.ok) throw new Error("facility dataset unavailable");
  const raw = await response.json();
  return {
    source: raw.source,
    sourceUrl: raw.source_url,
    cmsModified: raw.cms_modified,
    locationNote: raw.location_note,
    facilities: raw.facilities.map((row: (string | number)[]): Facility => ({
      kind: row[10] === "h" ? "hospital" : "dialysis",
      ccn: row[0] as string,
      name: row[1] as string,
      city: row[2] as string,
      state: row[3] as string,
      zip: row[4] as string,
      lat: row[5] as number,
      lon: row[6] as number,
      stations: row[7] as number,
      services: row[8] as number,
      countyFips: row[9] as string,
    })),
  };
}

export function byCounty(facilities: Facility[]): Map<string, Facility[]> {
  const map = new Map<string, Facility[]>();
  for (const facility of facilities) {
    if (!facility.countyFips) continue;
    const list = map.get(facility.countyFips);
    if (list) list.push(facility);
    else map.set(facility.countyFips, [facility]);
  }
  return map;
}

export function distanceMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

export function centroid(facilities: Facility[]): { lat: number; lon: number } {
  const total = facilities.length || 1;
  return {
    lat: facilities.reduce((sum, f) => sum + f.lat, 0) / total,
    lon: facilities.reduce((sum, f) => sum + f.lon, 0) / total,
  };
}

/** Nearest unaffected facilities of one kind that could take over: in-center dialysis, or emergency hospitals. */
export function nearestAlternatives(all: Facility[], affected: Facility[], kind: FacilityKind, limit = 5) {
  const origin = affected.filter((f) => f.kind === kind);
  if (origin.length === 0) return [];
  const taken = new Set(affected.map(facilityKey));
  const center = centroid(origin);
  const capable = (f: Facility) =>
    kind === "dialysis"
      ? (f.services & IN_CENTER_HD) === IN_CENTER_HD && f.stations > 0
      : (f.services & EMERGENCY_SERVICES) === EMERGENCY_SERVICES;
  return all
    .filter((f) => f.kind === kind && !taken.has(facilityKey(f)) && capable(f))
    .map((f) => ({ facility: f, miles: distanceMiles(center.lat, center.lon, f.lat, f.lon) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit);
}

export function countByKind(facilities: Facility[], kind: FacilityKind): number {
  return facilities.filter((f) => f.kind === kind).length;
}

export function totalStations(facilities: Facility[]): number {
  return facilities.filter((f) => f.kind === "dialysis").reduce((sum, f) => sum + f.stations, 0);
}
