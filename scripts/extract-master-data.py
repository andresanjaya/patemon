"""Extract workbook without third-party packages. Run with --check in CI/local checks."""

import argparse
import json
from pathlib import Path
import posixpath
import xml.etree.ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/data/wedding-master-data.json"
MIGRATION = ROOT / "supabase/migrations/20261121000001_complete_workbook_catalog.sql"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def extract():
    with ZipFile(ROOT / "Bali_Hindu_Wedding_Planner_Master_Data.xlsx") as book:
        strings = []
        if "xl/sharedStrings.xml" in book.namelist():
            strings = [
                "".join(t.text or "" for t in entry.findall(".//s:t", NS))
                for entry in ET.fromstring(book.read("xl/sharedStrings.xml"))
            ]
        relationships = {
            item.attrib["Id"]: item.attrib["Target"]
            for item in ET.fromstring(book.read("xl/_rels/workbook.xml.rels"))
        }
        result = {}
        for sheet in ET.fromstring(book.read("xl/workbook.xml")).find("s:sheets", NS):
            target = relationships[sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
            path = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            rows = []
            for row in ET.fromstring(book.read(path)).findall(".//s:sheetData/s:row", NS):
                values = {}
                for cell in row:
                    value = cell.find("s:v", NS)
                    text = value.text or "" if value is not None else ""
                    if cell.attrib.get("t") == "s":
                        text = strings[int(text)]
                    elif cell.attrib.get("t") == "inlineStr":
                        text = "".join(t.text or "" for t in cell.findall(".//s:t", NS))
                    values["".join(c for c in cell.attrib["r"] if c.isalpha())] = text
                if any(values.values()):
                    rows.append(values)
            result[sheet.attrib["name"]] = rows
        for sheet, count in {"Prosesi": 20, "Banten_Sarana": 66, "Checklist": 157, "Anggaran": 119, "Vendor_PIC": 22, "Onboarding": 20, "Sumber": 7}.items():
            assert len(result[sheet]) - 1 == count, (sheet, len(result[sheet]) - 1)
        return result


def catalog_sql(data):
    def literal(value):
        return "NULL" if value is None else "'" + str(value).replace("'", "''") + "'"

    def insert(table, columns, rows):
        return f"INSERT INTO public.{table} ({', '.join(columns)}) VALUES\n" + ",\n".join(
            "(" + ", ".join(literal(value) for value in row) + ")" for row in rows
        ) + "\nON CONFLICT (id) DO NOTHING;\n"

    sources = data["Sumber"][1:]
    source_id = {row["E"]: "XL-" + row["A"] for row in sources}
    return "-- Generated from Bali_Hindu_Wedding_Planner_Master_Data.xlsx. Existing IDs untouched.\n" + insert(
        "sources", ["id", "title", "source_type", "usage_notes", "source_url"],
        [["XL-" + r["A"], r["B"], r["C"], r["D"], r["E"]] for r in sources],
    ) + "\n" + insert(
        "ceremony_templates", ["id", "phase", "name", "description", "applicability", "default_pic", "validation_status", "source_id", "source_url", "order_index"],
        [["XL-" + r["A"], r["B"], r["C"], r["D"], r["E"], r["F"], r["G"], source_id.get(r["H"]), r["H"], i + 1] for i, r in enumerate(data["Prosesi"][1:])],
    ) + "\n" + insert(
        "ritual_catalog", ["id", "item_type", "name", "used_in_phase", "notes", "obligation_level", "default_quantity", "unit", "default_provider", "validation_status", "source_id", "source_url"],
        [["XL-" + r["A"], r["B"], r["C"], r["D"], r["E"], r["F"], r["G"] or None, r["H"], r["I"] or None, r["K"], source_id.get(r["L"]), r["L"]] for r in data["Banten_Sarana"][1:]],
    ) + "\n" + insert(
        "task_templates", ["id", "phase", "target_timeline", "category", "title", "default_pic", "applicability", "priority", "notes", "source_url"],
        [["XL-" + r["A"], r["B"], r["C"], r["D"], r["E"], r["F"], r["G"], r["H"].lower(), r["J"], r["K"]] for r in data["Checklist"][1:]],
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = extract()
    if args.check:
        assert json.loads(OUTPUT.read_text(encoding="utf-8")) == data, "Workbook snapshot stale; run python scripts/extract-master-data.py"
        assert MIGRATION.read_text(encoding="utf-8") == catalog_sql(data), "Catalog migration stale"
        print("Workbook snapshot complete: all 8 sheets match.")
    else:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        MIGRATION.write_text(catalog_sql(data), encoding="utf-8")
