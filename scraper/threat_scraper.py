#!/usr/bin/env python3
"""
threat_scraper.py
-----------------
Scrapes CISA KEV and NVD CVE feeds, normalises incidents,
embeds descriptions, and upserts into a local Qdrant collection.

Usage:
    python threat_scraper.py [--limit N]

Requirements:
    pip install qdrant-client sentence-transformers requests
Qdrant:
    docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
"""

import os
import sys
import time
import uuid
import json
import hashlib
import argparse
import requests

from qdrant_client import QdrantClient
from qdrant_client.http.models import (
    Distance, VectorParams, PointStruct, UpdateStatus
)
from sentence_transformers import SentenceTransformer

# ─── Config ──────────────────────────────────────────────────────────────────

QDRANT_HOST   = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT   = int(os.environ.get("QDRANT_PORT", "6333"))
COLLECTION    = "threats"
EMBED_MODEL   = "all-MiniLM-L6-v2"
VECTOR_DIM    = 384  # all-MiniLM-L6-v2 output dimension

# NVD rate-limits: 5 req/30s without key → 6s delay; with key → 0.6s
NVD_API_KEY   = os.environ.get("NVD_API_KEY")
NVD_HEADERS   = {"apiKey": NVD_API_KEY} if NVD_API_KEY else {}
NVD_DELAY     = 0.6 if NVD_API_KEY else 6.0

CISA_KEV_URL  = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
NVD_CVE_URL   = "https://services.nvd.nist.gov/rest/json/cves/2.0"

# ─── Classification tables ────────────────────────────────────────────────────

DOMAIN_KEYWORDS = {
    "web":                ["http", "sql", "xss", "injection", "csrf", "jwt",
                           "auth", "cookie", "web", "api"],
    "network":            ["network", "firewall", "tcp", "udp", "dns", "vpn",
                           "router", "packet", "snmp"],
    "malware":            ["malware", "ransomware", "trojan", "backdoor",
                           "payload", "obfuscat", "shellcode"],
    "social_engineering": ["phishing", "spear", "pretexting", "credential",
                           "email", "spoof", "social"],
}

CATEGORY_KEYWORDS = {
    "sql_injection": ["sql", "injection", "sqli"],
    "xss":           ["xss", "cross-site scripting", "cross site scripting"],
    "phishing":      ["phishing", "spear", "pretexting", "spoof"],
    "ransomware":    ["ransomware", "ransom", "encrypt", "lockbit"],
    "mitm":          ["mitm", "man-in-the-middle", "intercept", "arp"],
}


def classify_domain(description: str) -> str:
    """First-match wins; defaults to 'web'."""
    text = description.lower()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return domain
    return "web"


def classify_category(description: str) -> str:
    """First-match wins; defaults to 'other'."""
    text = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return category
    return "other"


def map_severity_label(score: float) -> str:
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    return "low"


def map_difficulty(score: float) -> str:
    if score >= 9.0:
        return "advanced"
    if score >= 6.0:
        return "intermediate"
    return "beginner"


def stable_id(raw_id: str) -> str:
    """
    Convert arbitrary string IDs to a UUID5 so Qdrant always gets
    a valid UUID-format point ID.
    """
    return str(uuid.uuid5(uuid.NAMESPACE_URL, raw_id))


# ─── Scrapers ─────────────────────────────────────────────────────────────────

def fetch_cisa_kev(limit: int = 200) -> list[dict]:
    """Pull from CISA Known Exploited Vulnerabilities list."""
    print("[*] Fetching CISA KEV …")
    try:
        resp = requests.get(CISA_KEV_URL, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[!] CISA KEV fetch failed: {e}")
        return []

    incidents = []
    for vuln in data.get("vulnerabilities", [])[:limit]:
        cve_id = vuln.get("cveID", "UNKNOWN")
        title  = vuln.get("vulnerabilityName", cve_id)
        desc   = (
            f"{vuln.get('shortDescription', '')} "
            f"Product: {vuln.get('product', '')}. "
            f"Vendor: {vuln.get('vendorProject', '')}."
        ).strip()
        date   = vuln.get("dateAdded", "")
        tags   = [
            vuln.get("vendorProject", ""),
            vuln.get("product", ""),
            vuln.get("requiredAction", ""),
        ]
        tags = [t for t in tags if t]

        # CISA doesn't provide CVSS; assign 7.5 (high) as sensible default
        cvss_score = 7.5
        domain     = classify_domain(desc)
        category   = classify_category(desc)

        incidents.append({
            "id":          stable_id(cve_id),
            "title":       title,
            "category":    category,
            "severity":    cvss_score,
            "severity_label": map_severity_label(cvss_score),
            "domain":      domain,
            "difficulty":  map_difficulty(cvss_score),
            "description": desc,
            "date":        date,
            "tags":        tags,
            "source":      "cisa_kev",
            "raw_id":      cve_id,
        })

    print(f"    → {len(incidents)} CISA incidents normalised")
    return incidents


def fetch_nvd_cves(results_per_page: int = 20) -> list[dict]:
    """Pull recent CVEs from NVD 2.0 API."""
    print(f"[*] Fetching NVD CVEs (results_per_page={results_per_page}, "
          f"delay={NVD_DELAY}s, key={'YES' if NVD_API_KEY else 'NO'}) …")

    params = {"resultsPerPage": results_per_page}
    try:
        time.sleep(NVD_DELAY)
        resp = requests.get(NVD_CVE_URL, params=params,
                            headers=NVD_HEADERS, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[!] NVD fetch failed: {e}")
        return []

    incidents = []
    for item in data.get("vulnerabilities", []):
        cve    = item.get("cve", {})
        cve_id = cve.get("id", "UNKNOWN")

        # Description — prefer English
        descs  = cve.get("descriptions", [])
        desc   = next(
            (d["value"] for d in descs if d.get("lang") == "en"),
            descs[0]["value"] if descs else ""
        )

        title  = f"{cve_id}: {desc[:80]}…" if len(desc) > 80 else cve_id
        date   = cve.get("published", "")[:10]

        # CVSS score — prefer v3.1, fall back to v3.0, then v2
        metrics = cve.get("metrics", {})
        cvss_score = 5.0  # sensible default
        for version_key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
            entries = metrics.get(version_key, [])
            if entries:
                cvss_score = entries[0].get("cvssData", {}).get("baseScore", cvss_score)
                break

        tags = [ref.get("url", "") for ref in cve.get("references", [])[:3]]

        domain   = classify_domain(desc)
        category = classify_category(desc)

        incidents.append({
            "id":          stable_id(cve_id),
            "title":       title,
            "category":    category,
            "severity":    cvss_score,
            "severity_label": map_severity_label(cvss_score),
            "domain":      domain,
            "difficulty":  map_difficulty(cvss_score),
            "description": desc,
            "date":        date,
            "tags":        tags,
            "source":      "nvd",
            "raw_id":      cve_id,
        })

    print(f"    → {len(incidents)} NVD incidents normalised")
    return incidents


# ─── Qdrant helpers ───────────────────────────────────────────────────────────

def ensure_collection(client: QdrantClient) -> None:
    """Create the 'threats' collection if it doesn't already exist."""
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION not in existing:
        print(f"[*] Creating Qdrant collection '{COLLECTION}' …")
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
        )
    else:
        print(f"[*] Collection '{COLLECTION}' already exists.")


def upsert_incidents(
    client: QdrantClient,
    model: SentenceTransformer,
    incidents: list[dict],
    batch_size: int = 64,
) -> None:
    """Embed descriptions and upsert into Qdrant in batches."""
    if not incidents:
        print("[!] No incidents to upsert.")
        return

    print(f"[*] Embedding {len(incidents)} descriptions …")
    descriptions = [inc["description"] for inc in incidents]
    vectors = model.encode(descriptions, batch_size=batch_size,
                           show_progress_bar=True)

    points = []
    for inc, vec in zip(incidents, vectors):
        payload = {
            "id":          inc["raw_id"],
            "title":       inc["title"],
            "category":    inc["category"],
            "severity":    inc["severity"],
            "severity_label": inc["severity_label"],
            "domain":      inc["domain"],
            "difficulty":  inc["difficulty"],
            "description": inc["description"],
            "date":        inc["date"],
            "tags":        inc["tags"],
            "source":      inc["source"],
        }
        points.append(PointStruct(id=inc["id"], vector=vec.tolist(), payload=payload))

    # Upsert in batches
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        result = client.upsert(collection_name=COLLECTION, points=batch)
        status_ok = result.status == UpdateStatus.COMPLETED
        print(f"    batch {i // batch_size + 1}: "
              f"{len(batch)} points → {'OK' if status_ok else 'WARN'}")

    print(f"[+] Upserted {len(points)} points into '{COLLECTION}'.")


# ─── Entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="CyberQuest Threat Scraper")
    parser.add_argument("--limit", type=int, default=200,
                        help="Max CISA incidents to ingest (default: 200)")
    parser.add_argument("--nvd-count", type=int, default=20,
                        help="NVD resultsPerPage (default: 20, max: 2000)")
    args = parser.parse_args()

    # Connect to Qdrant
    print(f"[*] Connecting to Qdrant at {QDRANT_HOST}:{QDRANT_PORT} …")
    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    ensure_collection(client)

    # Load embedding model
    print(f"[*] Loading embedding model '{EMBED_MODEL}' …")
    model = SentenceTransformer(EMBED_MODEL)

    # Fetch & normalise
    all_incidents: list[dict] = []
    all_incidents.extend(fetch_cisa_kev(limit=args.limit))
    all_incidents.extend(fetch_nvd_cves(results_per_page=args.nvd_count))

    # Deduplicate by stable UUID
    seen: set[str] = set()
    unique_incidents = []
    for inc in all_incidents:
        if inc["id"] not in seen:
            seen.add(inc["id"])
            unique_incidents.append(inc)

    print(f"[*] Total unique incidents: {len(unique_incidents)}")
    upsert_incidents(client, model, unique_incidents)
    print("[✓] Scrape complete.")


if __name__ == "__main__":
    main()
