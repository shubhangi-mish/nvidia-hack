"""Build the public map dataset of US dialysis facilities and hospitals.

Joins the official CMS Dialysis Facility listing (dataset 23ew-n7w9) and Hospital General Information
(dataset xubh-q36u) from data.cms.gov with US Census
ZIP-code centroids and county FIPS codes. Coordinates are ZIP-level approximations, NOT street addresses,
and the directory says nothing about live capacity or availability.

Usage: python services/worker/build_facility_map.py [output.json]
Standard library only.
"""
import csv, io, json, re, subprocess, sys, urllib.error, urllib.request, zipfile
from collections import Counter

CMS_API = "https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/23ew-n7w9"
GAZETTEER = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip"
COUNTIES = "https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt"
HOSPITAL_API = "https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/xubh-q36u"
OUT = sys.argv[1] if len(sys.argv) > 1 else "apps/web/public/data/facilities.json"


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "lastline-map-build"})
    try:
        return urllib.request.urlopen(request, timeout=120).read()
    except urllib.error.HTTPError as error:
        if error.code != 403:
            raise
        # data.cms.gov rejects some Python clients; curl is accepted.
        return subprocess.run(["curl", "-sSL", "--fail", "--max-time", "120", url], check=True, capture_output=True).stdout


def norm(name: str) -> str:
    name = name.lower().replace("saint ", "st ").replace("st. ", "st ").replace("'", "")
    name = re.sub(r"\b(county|parish|borough|census area|municipality|city and borough|municipio)\b", "", name)
    return re.sub(r"[^a-z0-9]+", " ", name).strip()


def main() -> None:
    meta = json.loads(fetch(CMS_API))
    csv_url = meta["distribution"][0]["downloadURL"]
    modified = meta.get("modified", "")
    print("CMS dataset modified", modified)

    zcta = {}
    with zipfile.ZipFile(io.BytesIO(fetch(GAZETTEER))) as z:
        text = z.read(z.namelist()[0]).decode()
    for row in csv.DictReader(io.StringIO(text), delimiter="\t"):
        row = {k.strip(): v.strip() for k, v in row.items()}
        zcta[row["GEOID"]] = (float(row["INTPTLAT"]), float(row["INTPTLONG"]))

    county_exact, county_norm = {}, {}
    for row in csv.DictReader(io.StringIO(fetch(COUNTIES).decode()), delimiter="|"):
        fips = row["STATEFP"] + row["COUNTYFP"]
        county_exact[(row["STATE"], row["COUNTYNAME"].lower())] = fips
        county_norm.setdefault((row["STATE"], norm(row["COUNTYNAME"])), []).append(fips)

    def county_fips(state: str, county: str) -> str:
        key = (state, norm(county))
        found = county_norm.get(key, [])
        if len(found) == 1:
            return found[0]
        for suffix in (" county", " parish", " borough", " city"):
            if (state, county.lower() + suffix) in county_exact:
                return county_exact[(state, county.lower() + suffix)]
        return found[0] if found else ""

    rows, missing_geo, missing_county = [], 0, 0
    columns = {
        "cms_certification_number_ccn": "CMS Certification Number (CCN)", "facility_name": "Facility Name",
        "citytown": "City/Town", "state": "State", "zip_code": "ZIP Code", "countyparish": "County/Parish",
        "of_dialysis_stations": "# of Dialysis Stations", "offers_incenter_hemodialysis": "Offers in-center hemodialysis",
        "offers_peritoneal_dialysis": "Offers peritoneal dialysis", "offers_home_hemodialysis_training": "Offers home hemodialysis training",
    }
    for raw in csv.DictReader(io.StringIO(fetch(csv_url).decode("utf-8-sig"))):
        row = {key: raw.get(label, "") for key, label in columns.items()}
        zip5 = (row["zip_code"] or "")[:5]
        if zip5 not in zcta:
            missing_geo += 1
            continue
        fips = county_fips(row["state"], row["countyparish"])
        missing_county += 0 if fips else 1
        lat, lon = zcta[zip5]
        flags = (
            (1 if row["offers_incenter_hemodialysis"].lower() == "yes" else 0)
            | (2 if row["offers_peritoneal_dialysis"].lower() == "yes" else 0)
            | (4 if row["offers_home_hemodialysis_training"].lower() == "yes" else 0)
        )
        try:
            stations = int(row["of_dialysis_stations"])
        except ValueError:
            stations = 0
        rows.append([
            row["cms_certification_number_ccn"],
            row["facility_name"].title(),
            row["citytown"].title(),
            row["state"],
            zip5,
            round(lat, 4),
            round(lon, 4),
            stations,
            flags,
            fips,
            "d",
        ])


    hospital_meta = json.loads(fetch(HOSPITAL_API))
    hospital_cols = {"id": "Facility ID", "name": "Facility Name", "city": "City/Town", "state": "State", "zip": "ZIP Code",
                     "county": "County/Parish", "type": "Hospital Type", "emergency": "Emergency Services"}
    hospital_count, hospital_skipped = 0, 0
    for raw in csv.DictReader(io.StringIO(fetch(hospital_meta["distribution"][0]["downloadURL"]).decode("utf-8-sig"))):
        row = {key: raw.get(label, "") for key, label in hospital_cols.items()}
        zip5 = (row["zip"] or "")[:5]
        if zip5 not in zcta:
            hospital_skipped += 1
            continue
        lat, lon = zcta[zip5]
        rows.append([
            row["id"], row["name"].title(), row["city"].title(), row["state"], zip5, round(lat, 4), round(lon, 4),
            0, 8 if row["emergency"].strip().lower() == "yes" else 0, county_fips(row["state"], row["county"]), "h",
        ])
        hospital_count += 1
    print(f"{hospital_count} hospitals; skipped {hospital_skipped} without ZIP match")

    payload = {
        "source": "CMS Provider Data Catalog: Dialysis Facility listing (23ew-n7w9) and Hospital General Information (xubh-q36u)",
        "source_url": "https://data.cms.gov/provider-data/topics/dialysis-facilities",
        "cms_modified": modified,
        "location_note": "Coordinates are ZIP-code centroids from the US Census Gazetteer, not street addresses.",
        "fields": ["ccn", "name", "city", "state", "zip", "lat", "lon", "stations", "services", "county_fips", "kind"],
        "services_bits": {"1": "in-center hemodialysis", "2": "peritoneal dialysis", "4": "home hemodialysis training", "8": "emergency services (hospitals)"}, "kinds": {"d": "dialysis facility", "h": "hospital"},
        "facilities": rows,
    }
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, separators=(",", ":"))
    states = Counter(r[3] for r in rows)
    print(f"{len(rows)} total records, {len(states)} states/territories; skipped {missing_geo} without ZIP match; {missing_county} without county FIPS")


if __name__ == "__main__":
    main()
