#!/usr/bin/env python3
"""
Build a canonical variant-configurator contract from a Shopify import CSV.

This pipeline is intentionally configurable so metafields can be added/removed
without code changes.
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


def norm(value: Any) -> str:
    return str(value or "").strip()


def key_norm(value: Any) -> str:
    return " ".join(norm(value).lower().split())


def get_first(row: dict[str, str], *keys: str) -> str:
    for key in keys:
        if key in row and norm(row.get(key)):
            return norm(row.get(key))
    return ""


def dot_set(target: dict[str, Any], path: str, value: Any) -> None:
    parts = [part for part in path.split(".") if part]
    if not parts:
        return
    cursor = target
    for part in parts[:-1]:
        if part not in cursor or not isinstance(cursor[part], dict):
            cursor[part] = {}
        cursor = cursor[part]
    cursor[parts[-1]] = value


@dataclass
class MetafieldMap:
    column: str
    target: str


def parse_metafield_maps(config: dict[str, Any]) -> list[MetafieldMap]:
    raw = config.get("metafields") if isinstance(config, dict) else None
    if not isinstance(raw, list):
        return []
    mappings: list[MetafieldMap] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        column = norm(item.get("column"))
        target = norm(item.get("target"))
        if not column or not target:
            continue
        mappings.append(MetafieldMap(column=column, target=target))
    return mappings


def load_metafield_config(path: str | None) -> list[MetafieldMap]:
    if not path:
        return []
    config_path = Path(path)
    if not config_path.exists():
        raise FileNotFoundError(f"Metafield config not found: {config_path}")
    parsed = json.loads(config_path.read_text(encoding="utf-8"))
    return parse_metafield_maps(parsed)


def variant_key_from_row(row: dict[str, str]) -> tuple[str, str, str, str]:
    sku = get_first(row, "SKU", "Variant SKU")
    opt1 = get_first(row, "Option1 value", "Option1 Value")
    opt2 = get_first(row, "Option2 value", "Option2 Value")
    opt3 = get_first(row, "Option3 value", "Option3 Value")
    return (key_norm(sku), key_norm(opt1), key_norm(opt2), key_norm(opt3))


def read_rows(csv_path: Path, handle_filter: str | None) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            handle_value = get_first(row, "URL handle", "Handle")
            if handle_filter and key_norm(handle_value) != key_norm(handle_filter):
                continue
            rows.append({k: norm(v) for k, v in row.items()})
    return rows


def build_contract(rows: list[dict[str, str]], metafield_maps: list[MetafieldMap]) -> dict[str, Any]:
    by_variant: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    product_handle = ""
    product_title = ""
    option1_name = "Option 1"
    option2_name = "Option 2"
    option3_name = "Option 3"
    last_sku = ""
    last_opt1 = ""
    last_opt2 = ""
    last_opt3 = ""

    for row in rows:
        product_handle = product_handle or get_first(row, "URL handle", "Handle")
        product_title = product_title or get_first(row, "Title")
        option1_name = get_first(row, "Option1 name", "Option1 Name") or option1_name
        option2_name = get_first(row, "Option2 name", "Option2 Name") or option2_name
        option3_name = get_first(row, "Option3 name", "Option3 Name") or option3_name

        sku = get_first(row, "SKU", "Variant SKU") or last_sku
        opt1 = get_first(row, "Option1 value", "Option1 Value") or last_opt1
        opt2 = get_first(row, "Option2 value", "Option2 Value") or last_opt2
        opt3 = get_first(row, "Option3 value", "Option3 Value") or last_opt3

        # Shopify CSV image continuation rows often blank variant columns.
        # Carry forward the most recent variant identity for the same handle.
        if sku:
            last_sku = sku
        if opt1:
            last_opt1 = opt1
        if opt2:
            last_opt2 = opt2
        if opt3:
            last_opt3 = opt3

        if not (sku and opt1 and opt2 and opt3):
            continue

        variant_id = (
            key_norm(sku),
            key_norm(opt1),
            key_norm(opt2),
            key_norm(opt3),
        )
        if variant_id not in by_variant:
            by_variant[variant_id] = {
                "id": "",
                "sku": sku,
                "title": get_first(row, "Title"),
                "available": key_norm(get_first(row, "Status")) in {"active", "draft", "true"},
                "price": get_first(row, "Price", "Variant Price"),
                "lens_type": opt1,
                "lens_color": opt2,
                "frame_color": opt3,
                "featured_media_url": get_first(row, "Variant image URL", "Variant Image URL"),
                "gallery_urls": [],
                "lens_support": {
                    "title": "",
                    "body": "",
                    "secondary_body": "",
                },
                "metafields": {},
                "swatch": {
                    "lens_color": "",
                    "frame_color": "",
                },
            }

        variant = by_variant[variant_id]
        for image_col in ("Variant image URL", "Variant Image URL"):
            image_url = get_first(row, image_col)
            if image_url and image_url not in variant["gallery_urls"]:
                variant["gallery_urls"].append(image_url)

        for mapping in metafield_maps:
            value = get_first(row, mapping.column)
            if not value:
                continue
            dot_set(variant, mapping.target, value)
            if mapping.target.startswith("metafields."):
                variant["metafields"][mapping.target.removeprefix("metafields.")] = value

    return {
        "schema_version": "1.0",
        "component": "variant-configurator",
        "product": {
            "id": "",
            "handle": product_handle,
            "title": product_title,
            "template_suffix": "",
            "option_names": [option1_name, option2_name, option3_name],
        },
        "variants": list(by_variant.values()),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build canonical variant-configurator contract from Shopify CSV.")
    parser.add_argument("--csv", required=True, help="Shopify CSV path")
    parser.add_argument("--handle", default="", help="Optional handle filter (URL handle)")
    parser.add_argument(
        "--metafield-config",
        default="",
        help="JSON config with configurable metafield column mappings",
    )
    parser.add_argument("--out", required=True, help="Output JSON path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    rows = read_rows(csv_path, args.handle or None)
    mappings = load_metafield_config(args.metafield_config or None)
    contract = build_contract(rows, mappings)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote contract: {out_path}")
    print(f"Rows read: {len(rows)}")
    print(f"Variants built: {len(contract.get('variants', []))}")
    print(f"Metafield mappings active: {len(mappings)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
