"""Import an operator-downloaded official CMS DFC_FACILITY.csv; directory data is not live capacity."""
import csv, os, sys
import httpx

API = os.getenv("LASTLINE_API_URL", "").rstrip("/")
TOKEN = os.getenv("SOURCE_INGEST_TOKEN")
CSV_PATH = os.getenv("CMS_DIALYSIS_CSV_PATH")

def main():
    if not all([API, TOKEN, CSV_PATH]):
        print("LASTLINE_API_URL, SOURCE_INGEST_TOKEN, and CMS_DIALYSIS_CSV_PATH are required")
        return 2
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):
            payload = {"official_id": row.get("cms_certification_number_ccn"), "name": row.get("facility_name"), "address": ", ".join(filter(None, [row.get("address_line_1"), row.get("citytown"), row.get("state"), row.get("zip_code")])), "capabilities": [key for key in ("offers_incenter_hemodialysis", "offers_peritoneal_dialysis", "offers_home_hemodialysis_training") if str(row.get(key, "")).lower() == "yes"], "source_url": "https://data.cms.gov/provider-data/dataset/23ew-n7w9"}
            if payload["official_id"] and payload["name"]:
                httpx.post(f"{API}/v1/internal/facilities", json=payload, headers={"x-source-ingest-token": TOKEN}, timeout=15).raise_for_status()
    return 0
if __name__ == "__main__": sys.exit(main())
