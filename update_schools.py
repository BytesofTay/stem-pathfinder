"""Refresh the CDE school snapshot locally, with validation and a review report.

Running this script never publishes a site. The scheduled workflow uploads the
result and its diff for review; deployment stays a separate, explicit action.
Reviewed program descriptions live in program_evidence.js and are not modified.
"""
import argparse
import csv
import hashlib
import io
import json
import math
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

BASE = Path(__file__).resolve().parent
JS_FILE = BASE / "lausd_magnet_app" / "web" / "schools_data.js"
CKAN_SEARCH = "https://data.ca.gov/api/3/action/package_search?q=california-public-schools&rows=100"
DISTRICT_CODE = "1964733"
MIN_SCHOOLS = 100
MAX_SCHOOLS = 400
MAX_ROSTER_CHANGE = 0.10
REQUIRED_COLUMNS = {
    "Academic Year", "CDS Code", "District Code", "District Name", "School Name",
    "Status", "Magnet", "Grade Low", "Grade High", "Street", "City", "Zip",
    "State", "School Website", "Latitude", "Longitude",
}
GRADE_VALUES = {"TK": -1, "K": 0, **{str(n): n for n in range(1, 13)}}


def curl(url, timeout=180):
    """Fetch a source successfully or fail without changing the snapshot."""
    result = subprocess.run(
        [shutil.which("curl") or "curl", "--fail", "--silent", "--show-error",
         "--location", "--proto", "=https", "--proto-redir", "=https",
         "--max-time", str(timeout), url],
        capture_output=True, timeout=timeout + 15, check=False,
    )
    if result.returncode:
        raise ValueError(f"Source download failed (curl exit {result.returncode})")
    return result.stdout


def find_latest_dataset_csv(catalog=None):
    catalog = catalog if catalog is not None else json.loads(curl(CKAN_SEARCH))
    if not catalog.get("success", False):
        raise ValueError("CDE catalog did not report success")
    candidates = []
    for package in catalog.get("result", {}).get("results", []):
        name = package.get("name", "")
        match = re.fullmatch(r"california-public-schools-(20\d{2})-(\d{2})", name)
        if not match:
            continue
        for resource in package.get("resources", []):
            url = resource.get("url", "")
            parsed = urlsplit(url)
            if (resource.get("format", "").upper() == "CSV"
                    and parsed.scheme == "https"
                    and parsed.hostname in {"gis.data.ca.gov", "data.ca.gov", "www.cde.ca.gov"}):
                candidates.append((int(match.group(1)), name, url))
                break
    if not candidates:
        raise ValueError("No recognized CDE school-year CSV found in official catalog")
    _, name, url = max(candidates)
    return name, url


def normalize_grade(value):
    value = value.strip().upper()
    if value == "KG":
        value = "K"
    elif value.isdigit():
        value = str(int(value))
    if value not in GRADE_VALUES:
        raise ValueError(f"Unknown grade value: {value!r}")
    return value


def website_url(value):
    value = value.strip()
    if not value:
        return None
    parsed = urlsplit(value)
    if (parsed.scheme not in {"http", "https"} or not parsed.hostname
            or parsed.username or parsed.password
            or any(char.isspace() for char in value)):
        raise ValueError("School website must be an absolute http(s) URL")
    return value


def to_school(row):
    """Keep official directory fields; do not infer program themes or ratings."""
    cds = row["CDS Code"].strip()
    if not re.fullmatch(r"1964733\d{7}", cds):
        raise ValueError("Invalid LAUSD CDS code")
    if row["District Code"].strip() != DISTRICT_CODE:
        raise ValueError("CDS/district-code mismatch")
    name = row["School Name"].strip()
    street, city, state, zip_code = (row[key].strip() for key in ("Street", "City", "State", "Zip"))
    if not name or not street or not city or state != "CA" or not re.fullmatch(r"\d{5}(?:-\d{4})?", zip_code):
        raise ValueError(f"Incomplete or invalid school address/name: {cds}")
    low = normalize_grade(row["Grade Low"])
    high = normalize_grade(row["Grade High"])
    if GRADE_VALUES[low] > GRADE_VALUES[high]:
        raise ValueError(f"Reversed grade range: {cds}")
    try:
        lat, lng = float(row["Latitude"]), float(row["Longitude"])
    except (TypeError, ValueError) as error:
        raise ValueError(f"Missing or invalid coordinates: {cds}") from error
    # Broad Los Angeles County bounds catch swapped axes and wrong-country points.
    if not (math.isfinite(lat) and math.isfinite(lng) and 32.7 <= lat <= 35.0 and -119.2 <= lng <= -117.5):
        raise ValueError(f"Coordinates outside expected LA County bounds: {cds}")
    return {
        "id": cds, "cds_code": cds, "name": name,
        "low_grade": low, "high_grade": high, "magnet": True,
        "street": street, "city": city, "state": state, "zip": zip_code,
        "address": f"{street}, {city}, {state} {zip_code}",
        "website": website_url(row["School Website"]),
        "lat": round(lat, 8), "lng": round(lng, 8),
    }


def parse_cde_csv(raw, dataset):
    expected_year = dataset.removeprefix("california-public-schools-")
    if not re.fullmatch(r"20\d{2}-\d{2}", expected_year):
        raise ValueError("Invalid source dataset school year")
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""))
    missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
    if missing:
        raise ValueError(f"CDE schema changed; missing columns: {', '.join(sorted(missing))}")
    schools = []
    for row in reader:
        # The CDE school-level Magnet flag is not a complete LAUSD program roster.
        if (row["Status"].strip() != "Active"
                or row["District Name"].strip() != "Los Angeles Unified"
                or row["Magnet"].strip().upper() != "Y"):
            continue
        if row["Academic Year"].strip() != expected_year:
            raise ValueError("CSV school year does not match selected catalog dataset")
        schools.append(to_school(row))
    if not MIN_SCHOOLS <= len(schools) <= MAX_SCHOOLS:
        raise ValueError(f"Unexpected roster count {len(schools)}; expected {MIN_SCHOOLS}–{MAX_SCHOOLS}")
    ids = [school["id"] for school in schools]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate CDS codes in active magnet roster")
    return sorted(schools, key=lambda school: (school["name"].casefold(), school["id"]))


def load_existing(path=JS_FILE):
    content = path.read_text(encoding="utf-8")
    match = re.search(r"const SCHOOLS_DATA = (\[.*\]);", content, re.DOTALL)
    metadata = re.search(r"const SCHOOL_DATA_SOURCE = (\{[^\n]+\});", content)
    if not match:
        raise ValueError("Existing school snapshot is not recognized")
    return json.loads(match.group(1)), json.loads(metadata.group(1)) if metadata else {}


def review_changes(existing, schools):
    # A name-only comparison is used solely to migrate the legacy snapshot once.
    stable_ids = all(school.get("id") for school in existing)
    key = (lambda school: school["id"]) if stable_ids else (lambda school: school["name"])
    old, new = {key(s): s for s in existing}, {key(s): s for s in schools}
    added, removed = sorted(new.keys() - old.keys()), sorted(old.keys() - new.keys())
    fraction = (len(added) + len(removed)) / max(len(old), 1)
    if fraction > MAX_ROSTER_CHANGE:
        raise ValueError(f"Roster change {fraction:.1%} exceeds {MAX_ROSTER_CHANGE:.0%}; review the source before accepting a new baseline")
    changed = [identifier for identifier in new.keys() & old.keys() if new[identifier] != old[identifier]]
    return {
        "oldCount": len(existing), "newCount": len(schools),
        "added": added, "removed": removed, "detailsChanged": sorted(changed),
        "rosterChangeFraction": fraction, "legacyIdMigration": not stable_ids,
        "missingWebsites": sum(s["website"] is None for s in schools),
    }


def refresh(raw, dataset, csv_url, checked_at, data_file=JS_FILE):
    # Validate every row and the whole change before writing any output.
    datetime.strptime(checked_at, "%Y-%m-%d")
    schools = parse_cde_csv(raw, dataset)
    existing, old_metadata = load_existing(data_file)
    report = review_changes(existing, schools)
    changed_at = checked_at if schools != existing else old_metadata.get("changedAt", old_metadata.get("retrievedAt", checked_at))
    metadata = {
        "source": "California Department of Education public school directory",
        "dataset": dataset,
        "schoolYear": dataset.removeprefix("california-public-schools-"),
        "sourceUrl": f"https://data.ca.gov/dataset/{dataset}",
        "csvUrl": csv_url,
        "checkedAt": checked_at, "retrievedAt": checked_at, "changedAt": changed_at,
        "sha256": hashlib.sha256(raw).hexdigest(), "recordCount": len(schools),
        "scope": "Active LAUSD school records with CDE Magnet=Y; not a complete magnet program directory",
    }
    payload = "const SCHOOL_DATA_SOURCE = " + json.dumps(metadata, separators=(",", ":")) + ";\n"
    payload += "const SCHOOLS_DATA = " + json.dumps(schools, separators=(",", ":"), ensure_ascii=False) + ";\n"
    temporary = data_file.with_suffix(".js.tmp")
    temporary.write_text(payload, encoding="utf-8")
    temporary.replace(data_file)
    return {"source": metadata, **report}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, help="Review a previously downloaded official CSV offline")
    parser.add_argument("--dataset", help="Required with --csv, e.g. california-public-schools-2025-26")
    parser.add_argument("--source-url", help="Original CSV download URL, required with --csv")
    parser.add_argument("--checked-at", default=datetime.now(timezone.utc).date().isoformat())
    parser.add_argument("--report", type=Path, default=BASE / "school-update-report.json")
    args = parser.parse_args()
    if args.csv:
        if not args.dataset or not args.source_url:
            parser.error("--csv requires --dataset and --source-url")
        dataset, csv_url, raw = args.dataset, args.source_url, args.csv.read_bytes()
    else:
        dataset, csv_url = find_latest_dataset_csv()
        raw = curl(csv_url)
    parsed = urlsplit(csv_url)
    if parsed.scheme != "https" or parsed.hostname not in {"gis.data.ca.gov", "data.ca.gov", "www.cde.ca.gov"}:
        parser.error("CSV source must be an official CDE/California HTTPS URL")
    report = refresh(raw, dataset, csv_url, args.checked_at)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Validated {report['newCount']} school records from {dataset}; local files only. Review {args.report} before publishing.")


if __name__ == "__main__":
    main()
