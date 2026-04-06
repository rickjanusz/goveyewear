#!/usr/bin/env python3
"""
One-command pipeline:
  Shopify import CSV -> canonical variant-configurator contract -> Shopify sync

What this syncs:
- Variant gallery image assignments (via product images + variant_ids)
- Variant featured image (first gallery image)
- Variant metafields present in contract["metafields"] (optional)

Default mode is dry-run. Pass --write to execute mutations.
"""

from __future__ import annotations

import argparse
import datetime
import csv
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any

from build_variant_contract_from_csv import build_contract, load_metafield_config, read_rows


DEFAULT_STORE = "goveyewear.myshopify.com"
DEFAULT_API_VERSION = "2026-01"
DEFAULT_CSV = "content/gatorz_shopify_import.csv"
DEFAULT_META_CONFIG = "content/test-imports/variant_contract_metafields.gatorz.example.json"


def norm(value: Any) -> str:
    return str(value or "").strip()


def canonical(value: Any) -> str:
    return " ".join(norm(value).lower().split())


def variant_key(sku: str, lens_type: str, lens_color: str, frame_color: str) -> tuple[str, str, str, str]:
    return (canonical(sku), canonical(lens_type), canonical(lens_color), canonical(frame_color))


def parse_gid_num(gid: str) -> int:
    return int(str(gid).rsplit("/", 1)[-1])


def graphql(store: str, api_version: str, token: str, query: str, variables: dict[str, Any]) -> dict[str, Any]:
    url = f"https://{store}/admin/api/{api_version}/graphql.json"
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json", "X-Shopify-Access-Token": token},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            parsed = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GraphQL HTTP {exc.code}: {detail}") from exc
    if parsed.get("errors"):
        raise RuntimeError(f"GraphQL errors: {json.dumps(parsed['errors'])}")
    return parsed.get("data", {})


def rest(store: str, api_version: str, token: str, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    url = f"https://{store}/admin/api/{api_version}/{path.lstrip('/')}"
    body = None
    headers: dict[str, str] = {"X-Shopify-Access-Token": token}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, method=method.upper(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"REST {method} {path} HTTP {exc.code}: {detail}") from exc
    return json.loads(raw) if raw.strip() else {}


def extract_filename_from_url(url: str) -> str:
    clean = str(url or "").split("?", 1)[0].split("#", 1)[0]
    return clean.rsplit("/", 1)[-1]


def canonical_image_url(url: str) -> str:
    clean = norm(url)
    if not clean:
        return ""
    parsed = urllib.parse.urlparse(clean)
    return f"{parsed.path}".lower()


def url_exists(url: str) -> bool:
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return 200 <= int(response.status) < 400
    except Exception:
        return False


def expand_series_urls(url: str, max_images: int, exists_cache: dict[str, bool]) -> list[str]:
    primary = norm(url)
    if not primary:
        return []

    urls = [primary]
    if max_images <= 1:
        return urls

    match = re.search(r"^(.*?)([-_])1(\.[A-Za-z0-9]+)(\?.*)?$", primary)
    if not match:
        return urls

    base, sep, ext, query = match.group(1), match.group(2), match.group(3), match.group(4) or ""
    for idx in range(2, max_images + 1):
        candidate = f"{base}{sep}{idx}{ext}{query}"
        if candidate not in exists_cache:
            exists_cache[candidate] = url_exists(candidate)
        if exists_cache[candidate]:
            urls.append(candidate)
        else:
            break
    return urls


def normalize_filename(filename: str) -> str:
    value = norm(filename).lower()
    if not value:
        return ""
    stem, dot, ext = value.rpartition(".")
    if not dot:
        return value
    # remove common Shopify CDN size suffixes
    for suffix in ("_pico", "_icon", "_thumb", "_small", "_compact", "_medium", "_large", "_grande", "_original", "_master"):
        if stem.endswith(suffix):
            stem = stem[: -len(suffix)]
            break
    return f"{stem}.{ext}"


def slugify_option_value(value: str) -> str:
    return re.sub(r"-{2,}", "-", re.sub(r"[^a-z0-9]+", "-", norm(value).lower())).strip("-")


def load_swatch_manifest(path: str | None) -> dict[str, str]:
    if not path:
        return {}
    manifest_path = Path(path)
    if not manifest_path.exists():
        return {}
    mapping: dict[str, str] = {}
    with manifest_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            filename = normalize_filename(norm(row.get("local_filename")))
            swatch_url = norm(row.get("swatch_url"))
            if filename and swatch_url:
                mapping[filename] = swatch_url
    return mapping


def resolve_swatch_url(manifest: dict[str, str], option_value: str) -> str:
    if not manifest or not option_value:
        return ""
    slug = slugify_option_value(option_value)
    candidates = [
        f"{slug}_small.png",
        f"{slug}.png",
        f"{slug}_small.jpg",
        f"{slug}.jpg",
        f"{slug}_small.jpeg",
        f"{slug}.jpeg",
    ]
    for candidate in candidates:
        url = manifest.get(normalize_filename(candidate))
        if url:
            return url
    return ""


def load_upload_manifest(path: Path) -> dict[str, int]:
    if not path.exists():
        return {}
    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    raw = parsed.get("url_to_image_id") if isinstance(parsed, dict) else None
    if not isinstance(raw, dict):
        return {}
    normalized: dict[str, int] = {}
    for key, value in raw.items():
        url = norm(key)
        image_id = int(value or 0)
        if url and image_id > 0:
            normalized[url] = image_id
    return normalized


def save_upload_manifest(path: Path, target_handle: str, product_id: int, url_to_image_id: dict[str, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "target_handle": target_handle,
        "product_id": product_id,
        "updated_at": datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "url_to_image_id": {k: int(v) for k, v in sorted(url_to_image_id.items()) if norm(k) and int(v or 0) > 0},
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def fetch_product_and_variants(store: str, api_version: str, token: str, handle: str) -> tuple[int, list[dict[str, Any]]]:
    query = """
    query ProductByHandle($handle: String!) {
      productByHandle(handle: $handle) {
        id
        variants(first: 250) {
          nodes {
            id
            sku
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
    """
    data = graphql(store, api_version, token, query, {"handle": handle})
    product = data.get("productByHandle")
    if not product:
        raise RuntimeError(f"Product not found for handle: {handle}")

    variants = []
    for node in product.get("variants", {}).get("nodes", []):
        options = {canonical(o.get("name")): norm(o.get("value")) for o in node.get("selectedOptions") or []}
        variants.append(
            {
                "gid": node["id"],
                "id_num": parse_gid_num(node["id"]),
                "sku": norm(node.get("sku")),
                "lens_type": options.get("lens type", ""),
                "lens_color": options.get("lens color", ""),
                "frame_color": options.get("frame color", ""),
            }
        )
    return parse_gid_num(product["id"]), variants


def fetch_product_images(store: str, api_version: str, token: str, product_id: int) -> list[dict[str, Any]]:
    data = rest(store, api_version, token, "GET", f"products/{product_id}/images.json?limit=250")
    return data.get("images", [])


def ensure_images_exist(
    store: str,
    api_version: str,
    token: str,
    product_id: int,
    required_urls: list[str],
    persisted_url_map: dict[str, int],
    dry_run: bool,
) -> dict[str, int]:
    existing = fetch_product_images(store, api_version, token, product_id)
    image_id_by_input_url: dict[str, int] = {}
    existing_by_canonical = {canonical_image_url(i.get("src")): int(i.get("id") or 0) for i in existing}
    existing_by_id = {int(i.get("id") or 0) for i in existing}
    existing_by_filename: dict[str, int] = {}
    for image in existing:
        image_id = int(image.get("id") or 0)
        if image_id <= 0:
            continue
        key = normalize_filename(extract_filename_from_url(norm(image.get("src"))))
        if key:
            existing_by_filename[key] = max(existing_by_filename.get(key, 0), image_id)

    to_upload: list[str] = []
    for url in required_urls:
        c = canonical_image_url(url)
        if not c:
            continue
        persisted_id = int(persisted_url_map.get(url) or 0)
        if persisted_id > 0 and persisted_id in existing_by_id:
            image_id_by_input_url[url] = persisted_id
            continue
        existing_id = existing_by_canonical.get(c)
        if existing_id:
            image_id_by_input_url[url] = existing_id
            continue
        filename_key = normalize_filename(extract_filename_from_url(url))
        filename_id = existing_by_filename.get(filename_key)
        if filename_id:
            image_id_by_input_url[url] = filename_id
            continue
        to_upload.append(url)

    if not to_upload:
        return image_id_by_input_url

    for src in to_upload:
        if dry_run:
            print(f"[dry-run] upload product image src: {src}")
        else:
            created = rest(store, api_version, token, "POST", f"products/{product_id}/images.json", {"image": {"src": src}})
            image = (created or {}).get("image") or {}
            created_id = int(image.get("id") or 0)
            if created_id:
                image_id_by_input_url[src] = created_id
            print(f"[write] uploaded product image src: {src}")
            time.sleep(0.2)

    return image_id_by_input_url


def map_image_ids_by_normalized_filename(images: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    by_name: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for image in images:
        filename = extract_filename_from_url(norm(image.get("src")))
        key = normalize_filename(filename)
        if key:
            by_name[key].append(image)
    return by_name


def select_image_id_for_url(by_name: dict[str, list[dict[str, Any]]], image_url: str) -> int | None:
    filename = normalize_filename(extract_filename_from_url(image_url))
    candidates = by_name.get(filename, [])
    if not candidates:
        return None
    chosen = max(candidates, key=lambda img: int(img.get("id") or 0))
    return int(chosen.get("id") or 0) or None


def update_product_image_variant_ids(
    store: str,
    api_version: str,
    token: str,
    product_id: int,
    image_id: int,
    variant_ids: list[int],
    dry_run: bool,
) -> None:
    if dry_run:
        print(f"[dry-run] image {image_id} variant_ids -> {variant_ids}")
        return
    rest(
        store,
        api_version,
        token,
        "PUT",
        f"products/{product_id}/images/{image_id}.json",
        {"image": {"id": image_id, "variant_ids": variant_ids}},
    )
    print(f"[write] image {image_id} variant_ids -> {variant_ids}")
    time.sleep(0.1)


def update_variant_featured_image(
    store: str,
    api_version: str,
    token: str,
    variant_id: int,
    image_id: int,
    dry_run: bool,
) -> None:
    if dry_run:
        print(f"[dry-run] variant {variant_id} image_id -> {image_id}")
        return
    rest(store, api_version, token, "PUT", f"variants/{variant_id}.json", {"variant": {"id": variant_id, "image_id": image_id}})
    print(f"[write] variant {variant_id} image_id -> {image_id}")
    time.sleep(0.1)


def set_variant_metafields(
    store: str,
    api_version: str,
    token: str,
    rows: list[dict[str, str]],
    variant_gid: str,
    dry_run: bool,
) -> None:
    if not rows:
        return
    mutation = """
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
    """
    if dry_run:
        for item in rows:
            print(f"[dry-run] metafield {item['namespace']}.{item['key']} -> {item['type']} ({len(item['value'])} chars)")
        return
    data = graphql(store, api_version, token, mutation, {"metafields": rows})
    errors = (((data or {}).get("metafieldsSet") or {}).get("userErrors") or [])
    if errors:
        raise RuntimeError(f"metafieldsSet userErrors for {variant_gid}: {json.dumps(errors)}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CSV -> contract -> Shopify sync pipeline.")
    parser.add_argument("--store", default=DEFAULT_STORE)
    parser.add_argument("--api-version", default=DEFAULT_API_VERSION)
    parser.add_argument("--csv", default=DEFAULT_CSV)
    parser.add_argument("--target-handle", required=True, help="Target Shopify product handle")
    parser.add_argument(
        "--source-handle",
        default="",
        help="Source handle in import CSV (defaults to target handle when omitted).",
    )
    parser.add_argument("--metafield-config", default=DEFAULT_META_CONFIG)
    parser.add_argument("--contract-out", default="", help="Optional contract output JSON path")
    parser.add_argument(
        "--max-gallery-images",
        type=int,
        default=3,
        help="Auto-expand image series from *-1/*_1 URLs up to this count when files exist.",
    )
    parser.add_argument(
        "--upload-manifest-dir",
        default="tmp/variant-upload-manifests",
        help="Directory for per-target upload manifest files (URL -> Shopify image id).",
    )
    parser.add_argument(
        "--swatch-manifest",
        default="",
        help="Optional swatch manifest CSV (local_filename, swatch_url) used to write swatch URL metafields.",
    )
    parser.add_argument("--write", action="store_true", help="Execute writes (default dry-run).")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    token = norm(os.getenv("SHOPIFY_ADMIN_TOKEN") or os.getenv("SHOPIFY_ADMIN_API_TOKEN"))
    if not token:
        print("Missing SHOPIFY_ADMIN_TOKEN (or SHOPIFY_ADMIN_API_TOKEN).", file=sys.stderr)
        return 2

    csv_path = Path(args.csv)
    if not csv_path.exists():
        print(f"CSV not found: {csv_path}", file=sys.stderr)
        return 2

    source_handle = args.source_handle or args.target_handle
    rows = read_rows(csv_path, source_handle)
    mappings = load_metafield_config(args.metafield_config if args.metafield_config else None)
    swatch_manifest = load_swatch_manifest(args.swatch_manifest if args.swatch_manifest else None)
    contract = build_contract(rows, mappings)
    if not contract.get("variants"):
        print(f"No variants built from CSV for source handle: {source_handle}", file=sys.stderr)
        return 2

    if args.contract_out:
        out_path = Path(args.contract_out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote contract: {out_path}")

    product_id, shopify_variants = fetch_product_and_variants(args.store, args.api_version, token, args.target_handle)
    shopify_variant_by_key = {
        variant_key(v["sku"], v["lens_type"], v["lens_color"], v["frame_color"]): v for v in shopify_variants
    }

    contract_to_shopify: dict[str, dict[str, Any]] = {}
    unmatched = 0
    for cv in contract["variants"]:
        k = variant_key(cv.get("sku"), cv.get("lens_type"), cv.get("lens_color"), cv.get("frame_color"))
        sv = shopify_variant_by_key.get(k)
        if not sv:
            unmatched += 1
            print(
                "[warn] no Shopify variant match:",
                cv.get("sku"),
                "|",
                cv.get("lens_type"),
                "|",
                cv.get("lens_color"),
                "|",
                cv.get("frame_color"),
            )
            continue
        contract_to_shopify[sv["gid"]] = cv

    print(f"CSV rows: {len(rows)}")
    print(f"Contract variants: {len(contract['variants'])}")
    print(f"Shopify variants: {len(shopify_variants)}")
    print(f"Matched variants: {len(contract_to_shopify)}")
    print(f"Unmatched variants: {unmatched}")

    # 1) Ensure required gallery images exist on product.
    exists_cache: dict[str, bool] = {}
    required_urls: list[str] = []
    expanded_gallery_urls_by_variant_gid: dict[str, list[str]] = {}
    for sv_gid, cv in contract_to_shopify.items():
        expanded_urls: list[str] = []
        for u in cv.get("gallery_urls") or []:
            for candidate in expand_series_urls(u, max(1, args.max_gallery_images), exists_cache):
                if candidate and candidate not in expanded_urls:
                    expanded_urls.append(candidate)
                if candidate and candidate not in required_urls:
                    required_urls.append(candidate)
        expanded_gallery_urls_by_variant_gid[sv_gid] = expanded_urls
    manifest_path = Path(args.upload_manifest_dir) / f"{args.target_handle}.json"
    persisted_url_map = load_upload_manifest(manifest_path)
    image_id_by_input_url = ensure_images_exist(
        args.store, args.api_version, token, product_id, required_urls, persisted_url_map, dry_run=not args.write
    )
    if args.write:
        merged_map = {**persisted_url_map, **image_id_by_input_url}
        save_upload_manifest(manifest_path, args.target_handle, product_id, merged_map)
        print(f"Upload manifest updated: {manifest_path}")

    # 2) Build desired image<->variant assignments by resolved image IDs.
    images = fetch_product_images(args.store, args.api_version, token, product_id)
    by_name = map_image_ids_by_normalized_filename(images)
    desired_variant_ids_by_image_id: dict[int, set[int]] = defaultdict(set)
    featured_by_variant_id: dict[int, int] = {}
    resolved_gallery_urls_by_variant_gid: dict[str, list[str]] = {}

    for sv in shopify_variants:
        cv = contract_to_shopify.get(sv["gid"])
        if not cv:
            continue
        resolved_ids: list[int] = []
        resolved_urls: list[str] = []
        gallery_urls = expanded_gallery_urls_by_variant_gid.get(sv["gid"], cv.get("gallery_urls") or [])
        for url in gallery_urls:
            image_id = image_id_by_input_url.get(url)
            if not image_id:
                image_id = select_image_id_for_url(by_name, url)
            if not image_id:
                print(f"[warn] no product image resolved for gallery URL: {url}")
                continue
            desired_variant_ids_by_image_id[image_id].add(sv["id_num"])
            if image_id not in resolved_ids:
                resolved_ids.append(image_id)
            if url not in resolved_urls:
                resolved_urls.append(url)
        if resolved_ids:
            featured_by_variant_id[sv["id_num"]] = resolved_ids[0]
        if resolved_urls:
            resolved_gallery_urls_by_variant_gid[sv["gid"]] = resolved_urls

    target_variant_ids = {v["id_num"] for v in shopify_variants if v["gid"] in contract_to_shopify}
    updates = []
    for image in images:
        image_id = int(image.get("id") or 0)
        if image_id <= 0:
            continue
        current = sorted(int(v) for v in (image.get("variant_ids") or []))
        desired = sorted(desired_variant_ids_by_image_id.get(image_id, set()))
        if not desired:
            if any(v in target_variant_ids for v in current):
                updates.append((image_id, []))
            continue
        if current != desired:
            updates.append((image_id, desired))

    print(f"Image assignment updates: {len(updates)}")
    for image_id, desired in updates:
        update_product_image_variant_ids(
            args.store, args.api_version, token, product_id, image_id, desired, dry_run=not args.write
        )

    print(f"Variant featured updates: {len(featured_by_variant_id)}")
    for variant_id, image_id in sorted(featured_by_variant_id.items()):
        update_variant_featured_image(args.store, args.api_version, token, variant_id, image_id, dry_run=not args.write)

    # 3) Variant metafield writes from contract["metafields"].
    metafield_writes = 0
    for sv in shopify_variants:
        cv = contract_to_shopify.get(sv["gid"])
        if not cv:
            continue
        raw_meta = cv.get("metafields") or {}
        write_rows: list[dict[str, str]] = []
        for dotted_key, value in raw_meta.items():
            value = norm(value)
            if not value:
                continue
            # dotted key format: namespace.key
            if "." not in dotted_key:
                continue
            namespace, key = dotted_key.split(".", 1)
            write_rows.append(
                {
                    "ownerId": sv["gid"],
                    "namespace": namespace,
                    "key": key,
                    "type": "multi_line_text_field" if "\n" in value else "single_line_text_field",
                    "value": value,
                }
            )
        if write_rows:
            set_variant_metafields(args.store, args.api_version, token, write_rows, sv["gid"], dry_run=not args.write)
            metafield_writes += len(write_rows)

        gallery_urls = resolved_gallery_urls_by_variant_gid.get(sv["gid"], [])
        gallery_meta_rows: list[dict[str, str]] = []
        for index, gallery_url in enumerate(gallery_urls[:3], start=1):
            gallery_meta_rows.append(
                {
                    "ownerId": sv["gid"],
                    "namespace": "custom",
                    "key": f"gatorz_gallery_url_{index}",
                    "type": "url",
                    "value": gallery_url,
                }
            )
        if gallery_meta_rows:
            set_variant_metafields(args.store, args.api_version, token, gallery_meta_rows, sv["gid"], dry_run=not args.write)
            metafield_writes += len(gallery_meta_rows)

        swatch_rows: list[dict[str, str]] = []
        lens_swatch_url = resolve_swatch_url(swatch_manifest, norm(cv.get("lens_color")))
        frame_swatch_url = resolve_swatch_url(swatch_manifest, norm(cv.get("frame_color")))
        if lens_swatch_url:
            swatch_rows.append(
                {
                    "ownerId": sv["gid"],
                    "namespace": "custom",
                    "key": "gatorz_swatch_lens_url",
                    "type": "url",
                    "value": lens_swatch_url,
                }
            )
        if frame_swatch_url:
            swatch_rows.append(
                {
                    "ownerId": sv["gid"],
                    "namespace": "custom",
                    "key": "gatorz_swatch_frame_url",
                    "type": "url",
                    "value": frame_swatch_url,
                }
            )
        if swatch_rows:
            set_variant_metafields(args.store, args.api_version, token, swatch_rows, sv["gid"], dry_run=not args.write)
            metafield_writes += len(swatch_rows)

    print(f"Variant metafield writes: {metafield_writes}")
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
