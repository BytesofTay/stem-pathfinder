"""Offline ingestion checks: malformed sources must not replace the snapshot."""
import csv
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import update_schools as updater

DATASET = "california-public-schools-2025-26"
CSV_URL = "https://gis.data.ca.gov/example.csv"


def rows(count=100):
    return [{
        "Academic Year": "2025-26", "CDS Code": f"1964733{index:07d}",
        "District Code": "1964733", "District Name": "Los Angeles Unified",
        "School Name": f"Example Magnet {index:03d}", "Status": "Active", "Magnet": "Y",
        "Grade Low": "04", "Grade High": "12", "Street": f"{index + 1} Example St.",
        "City": "Los Angeles", "Zip": "90012", "State": "CA",
        "School Website": "https://example.lausd.org/", "Latitude": "34.05", "Longitude": "-118.25",
    } for index in range(count)]


def csv_bytes(records, omit=None):
    fields = sorted(updater.REQUIRED_COLUMNS - ({omit} if omit else set()))
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(records)
    return output.getvalue().encode("utf-8-sig")


def snapshot(path, schools, metadata=None):
    path.write_text("const SCHOOL_DATA_SOURCE = " + json.dumps(metadata or {}) + ";\n"
                    + "const SCHOOLS_DATA = " + json.dumps(schools) + ";\n", encoding="utf-8")


class DirectoryTests(unittest.TestCase):
    def test_preserves_ids_ranges_full_addresses_and_official_website(self):
        school = updater.parse_cde_csv(csv_bytes(rows()), DATASET)[0]
        self.assertEqual(school["id"], "19647330000000")
        self.assertEqual(school["cds_code"], school["id"])
        self.assertEqual((school["low_grade"], school["high_grade"]), ("4", "12"))
        self.assertEqual(school["address"], "1 Example St., Los Angeles, CA 90012")
        self.assertEqual(school["website"], "https://example.lausd.org/")
        self.assertFalse({"quality", "access", "equity"} & school.keys())

    def test_filters_closed_non_magnet_and_other_district(self):
        records = rows()
        for change in ({"Status": "Closed"}, {"Magnet": "N"}, {"District Name": "Other Unified"}):
            records.append({**records[0], **change})
        self.assertEqual(len(updater.parse_cde_csv(csv_bytes(records), DATASET)), 100)

    def test_schema_change_rejected(self):
        with self.assertRaisesRegex(ValueError, "schema changed"):
            updater.parse_cde_csv(csv_bytes(rows(), omit="Grade High"), DATASET)

    def test_school_year_mismatch_rejected(self):
        records = rows()
        records[0]["Academic Year"] = "2024-25"
        with self.assertRaisesRegex(ValueError, "school year"):
            updater.parse_cde_csv(csv_bytes(records), DATASET)

    def test_duplicate_ids_rejected(self):
        records = rows()
        records[1]["CDS Code"] = records[0]["CDS Code"]
        with self.assertRaisesRegex(ValueError, "Duplicate CDS"):
            updater.parse_cde_csv(csv_bytes(records), DATASET)

    def test_invalid_id_and_district_code_rejected(self):
        for column, value in (("CDS Code", "123"), ("CDS Code", "01647330000000"), ("District Code", "0000000")):
            with self.subTest(column=column, value=value):
                record = {**rows(1)[0], column: value}
                with self.assertRaises(ValueError):
                    updater.to_school(record)

    def test_invalid_grade_and_reversed_range_rejected(self):
        for low, high in (("unknown", "12"), ("09", "06"), ("", "05"), ("KG", "13")):
            with self.subTest(low=low, high=high):
                with self.assertRaises(ValueError):
                    updater.to_school({**rows(1)[0], "Grade Low": low, "Grade High": high})
        self.assertEqual(updater.normalize_grade("KG"), "K")
        self.assertEqual(updater.normalize_grade("TK"), "TK")

    def test_invalid_coordinates_rejected(self):
        for latitude, longitude in (("", "-118.25"), ("NaN", "-118.25"), ("34.05", "inf"), ("-118.25", "34.05"), ("40", "-118.25")):
            with self.subTest(latitude=latitude, longitude=longitude):
                with self.assertRaisesRegex(ValueError, "[Cc]oordinates"):
                    updater.to_school({**rows(1)[0], "Latitude": latitude, "Longitude": longitude})

    def test_complete_address_required(self):
        for column, value in (("City", ""), ("Street", ""), ("Zip", "123"), ("State", "NV")):
            with self.subTest(column=column):
                with self.assertRaisesRegex(ValueError, "address"):
                    updater.to_school({**rows(1)[0], column: value})

    def test_missing_website_is_unknown_and_unsafe_url_rejected(self):
        self.assertIsNone(updater.website_url(""))
        for value in ("javascript:alert(1)", "www.school.org", "https://name:password@school.org", "https://school.org/a b"):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    updater.website_url(value)

    def test_collapsed_or_excessive_roster_rejected(self):
        for count in (99, 401):
            with self.subTest(count=count):
                with self.assertRaisesRegex(ValueError, "roster count"):
                    updater.parse_cde_csv(csv_bytes(rows(count)), DATASET)

    def test_large_roster_change_rejected_even_when_total_count_equal(self):
        old = updater.parse_cde_csv(csv_bytes(rows()), DATASET)
        new = [dict(school) for school in old]
        for index in range(6):
            new[index]["id"] = f"1964733{500 + index:07d}"
        with self.assertRaisesRegex(ValueError, "Roster change"):
            updater.review_changes(old, new)

    def test_name_change_keeps_identity(self):
        old = updater.parse_cde_csv(csv_bytes(rows()), DATASET)
        new = [dict(school) for school in old]
        new[0]["name"] = "Renamed Magnet"
        report = updater.review_changes(old, new)
        self.assertEqual(report["added"], [])
        self.assertEqual(report["removed"], [])
        self.assertEqual(report["detailsChanged"], [old[0]["id"]])

    def test_invalid_refresh_leaves_existing_snapshot_untouched(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "schools_data.js"
            snapshot(path, updater.parse_cde_csv(csv_bytes(rows()), DATASET))
            before = path.read_bytes()
            with self.assertRaises(ValueError):
                updater.refresh(csv_bytes(rows(99)), DATASET, CSV_URL, "2026-10-21", path)
            self.assertEqual(path.read_bytes(), before)

    def test_refresh_records_check_date_without_changing_data_change_date(self):
        raw = csv_bytes(rows())
        schools = updater.parse_cde_csv(raw, DATASET)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "schools_data.js"
            evidence = Path(directory) / "program_evidence.js"
            evidence.write_text("reviewed evidence", encoding="utf-8")
            snapshot(path, schools, {"changedAt": "2026-10-01", "retrievedAt": "2026-10-01"})
            report = updater.refresh(raw, DATASET, CSV_URL, "2026-10-21", path)
            loaded, metadata = updater.load_existing(path)
            self.assertEqual(loaded, schools)
            self.assertEqual(metadata["changedAt"], "2026-10-01")
            self.assertEqual(metadata["checkedAt"], "2026-10-21")
            self.assertEqual(metadata["schoolYear"], "2025-26")
            self.assertEqual(len(metadata["sha256"]), 64)
            self.assertEqual(report["detailsChanged"], [])
            self.assertEqual(evidence.read_text(encoding="utf-8"), "reviewed evidence")

    def test_catalog_picks_newest_official_year_and_rejects_untrusted_resource(self):
        catalog = {"success": True, "result": {"results": [
            {"name": "california-public-schools-2024-25", "resources": [{"format": "CSV", "url": CSV_URL}]},
            {"name": DATASET, "resources": [{"format": "CSV", "url": CSV_URL}]},
            {"name": "california-public-schools-2026-27", "resources": [{"format": "CSV", "url": "https://other.example/data.csv"}]},
        ]}}
        self.assertEqual(updater.find_latest_dataset_csv(catalog), (DATASET, CSV_URL))
        with self.assertRaises(ValueError):
            updater.find_latest_dataset_csv({"success": False})

    def test_download_failure_rejected(self):
        with patch.object(updater.subprocess, "run") as run:
            run.return_value.returncode = 22
            with self.assertRaisesRegex(ValueError, "download failed"):
                updater.curl(CSV_URL)
            self.assertIn("--fail", run.call_args.args[0])


if __name__ == "__main__":
    unittest.main()
