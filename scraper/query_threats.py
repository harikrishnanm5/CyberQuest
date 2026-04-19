#!/usr/bin/env python3
"""
query_threats.py
----------------
Query the Qdrant 'threats' collection by domain + difficulty.
Returns the top 3 most semantically relevant incidents as JSON.

Usage:
    python query_threats.py <domain> <difficulty>

Arguments:
    domain      web | network | malware | social_engineering
    difficulty  beginner | intermediate | advanced

Example:
    python query_threats.py web intermediate

Output:
    JSON array of up to 3 incident payloads, ordered by relevance.

Requirements:
    pip install qdrant-client sentence-transformers
"""

import sys
import json
import os

from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, MatchAny
from sentence_transformers import SentenceTransformer

# ─── Config ───────────────────────────────────────────────────────────────────

QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.environ.get("QDRANT_PORT", "6333"))
COLLECTION  = "threats"
EMBED_MODEL = "all-MiniLM-L6-v2"

VALID_DOMAINS = {"web", "network", "malware", "social_engineering"}
VALID_DIFFICULTIES = {"beginner", "intermediate", "advanced"}

# Difficulty → broader pool when strict match has few results
DIFFICULTY_FALLBACK: dict[str, list[str]] = {
    "beginner":     ["beginner"],
    "intermediate": ["intermediate", "beginner"],
    "advanced":     ["advanced", "intermediate"],
}

# Seed query for semantic search — enriched with domain context so the
# embedding captures intent rather than just a bare keyword
DOMAIN_SEED_QUERIES: dict[str, str] = {
    "web":                "web application attack SQL injection XSS authentication bypass",
    "network":            "network intrusion packet analysis MITM firewall firewall evasion",
    "malware":            "malware ransomware payload reverse engineering obfuscation IOC",
    "social_engineering": "phishing spear phishing credential harvesting pretexting OSINT",
}


def query(domain: str, difficulty: str, top_k: int = 3) -> list[dict]:
    """
    Query Qdrant for the most relevant threats matching domain + difficulty.
    Falls back to a wider difficulty pool if results are too sparse.
    """
    if domain not in VALID_DOMAINS:
        raise ValueError(f"Invalid domain '{domain}'. Choose from: {sorted(VALID_DOMAINS)}")
    if difficulty not in VALID_DIFFICULTIES:
        raise ValueError(f"Invalid difficulty '{difficulty}'. Choose from: {sorted(VALID_DIFFICULTIES)}")

    client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
    model  = SentenceTransformer(EMBED_MODEL)

    seed      = DOMAIN_SEED_QUERIES[domain]
    query_vec = model.encode(seed).tolist()

    difficulties = DIFFICULTY_FALLBACK[difficulty]

    # Filter: domain must match exactly; difficulty can be broadened
    search_filter = Filter(
        must=[
            FieldCondition(key="domain",     match=MatchValue(value=domain)),
            FieldCondition(key="difficulty", match=MatchAny(any=difficulties)),
        ]
    )

    results = client.search(
        collection_name=COLLECTION,
        query_vector=query_vec,
        query_filter=search_filter,
        limit=top_k,
        with_payload=True,
    )

    incidents = [hit.payload for hit in results if hit.payload]

    # If the strict filter returns nothing, fall back to domain-only search
    if not incidents:
        fallback_filter = Filter(
            must=[FieldCondition(key="domain", match=MatchValue(value=domain))]
        )
        results = client.search(
            collection_name=COLLECTION,
            query_vector=query_vec,
            query_filter=fallback_filter,
            limit=top_k,
            with_payload=True,
        )
        incidents = [hit.payload for hit in results if hit.payload]

    return incidents


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python query_threats.py <domain> <difficulty>", file=sys.stderr)
        print(f"  domain:     {', '.join(sorted(VALID_DOMAINS))}", file=sys.stderr)
        print(f"  difficulty: {', '.join(sorted(VALID_DIFFICULTIES))}", file=sys.stderr)
        sys.exit(1)

    domain     = sys.argv[1].strip().lower()
    difficulty = sys.argv[2].strip().lower()

    try:
        results = query(domain, difficulty)
    except ValueError as e:
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Qdrant query failed: {e}", file=sys.stderr)
        sys.exit(1)

    if not results:
        print(json.dumps([], indent=2))
        print(f"[WARN] No results found for domain='{domain}' difficulty='{difficulty}'.",
              file=sys.stderr)
    else:
        print(json.dumps(results, indent=2, default=str))


if __name__ == "__main__":
    main()
