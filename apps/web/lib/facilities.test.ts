import { describe, expect, it } from "vitest";
import { byCounty, distanceMiles, nearestAlternatives, type Facility } from "./facilities";
import { alertImpacts, type WeatherAlert } from "./nws";

const make = (ccn: string, lat: number, lon: number, countyFips: string, services = 1, stations = 10, kind: Facility["kind"] = "dialysis"): Facility => ({
  kind, ccn, name: ccn, city: "Town", state: "ZZ", zip: "00000", lat, lon, stations, services, countyFips,
});

const alert = (countyFips: string[], severity = "Severe"): WeatherAlert => ({
  id: "a", event: "Flood Warning", severity, headline: "h", areaDesc: "x", sent: "2026-01-01T00:00:00Z",
  senderName: "NWS", countyFips, link: "https://api.weather.gov/alerts/a",
});

describe("facility helpers", () => {
  it("groups facilities by county and skips unknown counties", () => {
    const index = byCounty([make("a", 0, 0, "01001"), make("b", 0, 0, "01001"), make("c", 0, 0, "")]);
    expect(index.get("01001")?.length).toBe(2);
    expect(index.size).toBe(1);
  });

  it("computes great-circle distance in miles", () => {
    // New York to Los Angeles is roughly 2,450 miles.
    expect(distanceMiles(40.71, -74.0, 34.05, -118.24)).toBeGreaterThan(2400);
    expect(distanceMiles(40.71, -74.0, 34.05, -118.24)).toBeLessThan(2500);
  });

  it("suggests only unaffected in-center facilities, nearest first", () => {
    const affected = [make("hit", 40, -80, "A")];
    const all = [
      affected[0], make("far", 41, -80, "B"), make("near", 40.1, -80, "B"),
      make("home-only", 40.05, -80, "B", 4), make("empty", 40.02, -80, "B", 1, 0),
    ];
    expect(nearestAlternatives(all, affected, "dialysis").map((a) => a.facility.ccn)).toEqual(["near", "far"]);
  });
});

describe("hospital alternatives", () => {
  it("suggests only emergency hospitals when a hospital is affected", () => {
    const affected = [make("h1", 40, -80, "A", 8, 0, "hospital")];
    const all = [
      affected[0], make("er", 40.2, -80, "B", 8, 0, "hospital"), make("no-er", 40.1, -80, "B", 0, 0, "hospital"),
      make("dialysis", 40.05, -80, "B"),
    ];
    expect(nearestAlternatives(all, affected, "hospital").map((a) => a.facility.ccn)).toEqual(["er"]);
    expect(nearestAlternatives(all, affected, "dialysis")).toEqual([]);
  });
});

describe("alertImpacts", () => {
  it("keeps only alerts that touch facilities and ranks severe first", () => {
    const index = byCounty([make("a", 0, 0, "01001"), make("b", 0, 0, "02002"), make("c", 0, 0, "02002")]);
    const impacts = alertImpacts([alert(["99999"]), alert(["01001"], "Moderate"), alert(["02002"], "Severe")], index);
    expect(impacts.map((i) => i.facilities.length)).toEqual([2, 1]);
    expect(impacts[0].alert.severity).toBe("Severe");
  });
});
