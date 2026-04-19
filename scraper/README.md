# CyberQuest Threat Scraper

Standalone Python data pipeline that populates a local Qdrant vector database with real-world CVE and vulnerability data from CISA and NVD. This powers the breach scenario retrieval for CIPHER's mission briefings.

---

## Architecture

```
CISA KEV ──┐
           ├── threat_scraper.py ──► Qdrant (localhost:6333)
NVD 2.0 ───┘                              │
                                          ▼
                               query_threats.py ──► CIPHER / aiService
```

---

## Prerequisites

### 1. Python 3.10+

Verify with:

```bash
python --version
```

### 2. Install dependencies

```bash
pip install qdrant-client sentence-transformers requests
```

> The first run will download the `all-MiniLM-L6-v2` model (~90 MB). Subsequent runs use the local cache.

### 3. Start Qdrant via Docker

```bash
docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant
```

Verify it's running:

```bash
curl http://localhost:6333/collections
```

Expected response: `{"result":{"collections":[]},"status":"ok",...}`

---

## Running the Scraper

### Basic run (200 CISA + 20 NVD incidents)

```bash
cd scraper
python threat_scraper.py
```

### Custom limits

```bash
python threat_scraper.py --limit 500 --nvd-count 50
```

### With NVD API key (faster — bypasses rate limit)

Get a free key at [https://nvd.nist.gov/developers/request-an-api-key](https://nvd.nist.gov/developers/request-an-api-key)

```bash
export NVD_API_KEY=your-key-here
python threat_scraper.py
```

Without the key, the script automatically applies a **6-second delay** between NVD requests to respect the public rate limit (5 req/30s). With the key it uses **0.6s**.

### Environment variables

| Variable     | Default     | Description                          |
|-------------|-------------|--------------------------------------|
| `NVD_API_KEY` | _(none)_   | NVD API key for higher rate limits   |
| `QDRANT_HOST` | `localhost` | Qdrant hostname                     |
| `QDRANT_PORT` | `6333`      | Qdrant HTTP port                    |

---

## Querying the Database

```bash
python query_threats.py <domain> <difficulty>
```

**Arguments:**

| Arg          | Valid values                                          |
|-------------|-------------------------------------------------------|
| `domain`    | `web`, `network`, `malware`, `social_engineering`     |
| `difficulty`| `beginner`, `intermediate`, `advanced`                |

**Examples:**

```bash
# Top 3 web incidents for beginners
python query_threats.py web beginner

# Top 3 malware incidents for advanced students
python query_threats.py malware advanced

# Top 3 social engineering incidents for intermediate students
python query_threats.py social_engineering intermediate
```

**Output format** (JSON array of up to 3 incidents):

```json
[
  {
    "id":          "CVE-2023-XXXXX",
    "title":       "Apache mod_rewrite buffer overflow",
    "category":    "xss",
    "severity":    9.1,
    "severity_label": "critical",
    "domain":      "web",
    "difficulty":  "advanced",
    "description": "A buffer overflow in Apache ...",
    "date":        "2023-11-14",
    "tags":        ["https://nvd.nist.gov/..."],
    "source":      "nvd"
  }
]
```

---

## Payload Schema

Every Qdrant point stores these fields as payload alongside its embedding vector:

| Field           | Type     | Description                                              |
|----------------|----------|----------------------------------------------------------|
| `id`           | `string` | Raw CVE ID (e.g. `CVE-2023-12345`)                       |
| `title`        | `string` | Short vulnerability name                                 |
| `category`     | `string` | `sql_injection`, `xss`, `phishing`, `ransomware`, `mitm`, `other` |
| `severity`     | `float`  | CVSS base score (0.0–10.0)                               |
| `severity_label` | `string` | `critical`, `high`, `medium`, `low`                    |
| `domain`       | `string` | `web`, `network`, `malware`, `social_engineering`        |
| `difficulty`   | `string` | `beginner`, `intermediate`, `advanced`                   |
| `description`  | `string` | Full description (used for embedding)                    |
| `date`         | `string` | Published date (`YYYY-MM-DD`)                            |
| `tags`         | `list`   | Reference URLs or product/vendor tags                    |
| `source`       | `string` | `cisa_kev` or `nvd`                                      |

---

## Classification Logic

Domain and category are assigned at ingest time using keyword matching on the description text.

**Domain keywords** (first match wins, defaults to `web`):

| Domain               | Keywords                                              |
|---------------------|-------------------------------------------------------|
| `web`               | http, sql, xss, injection, csrf, jwt, auth, cookie, web, api |
| `network`           | network, firewall, tcp, udp, dns, vpn, router, packet, snmp |
| `malware`           | malware, ransomware, trojan, backdoor, payload, obfuscat, shellcode |
| `social_engineering`| phishing, spear, pretexting, credential, email, spoof, social |

**Difficulty mapping** (from CVSS score):

| CVSS Score | Difficulty     |
|-----------|----------------|
| ≥ 9.0     | `advanced`     |
| ≥ 6.0     | `intermediate` |
| < 6.0     | `beginner`     |

---

## Re-scraping

The scraper is idempotent — re-running it will **upsert** (update or insert) existing points by their stable UUID. You can run it on a cron schedule to keep the database fresh:

```bash
# Example: run daily at 2 AM
0 2 * * * cd /path/to/scraper && python threat_scraper.py >> scraper.log 2>&1
```

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `ConnectionRefusedError` on Qdrant | Check Docker is running: `docker ps` |
| NVD returns HTTP 403 | Add `NVD_API_KEY` or wait for rate limit to reset |
| No results from `query_threats.py` | Run scraper first, verify collection exists via `curl http://localhost:6333/collections` |
| Slow first run | Model download is one-time; subsequent runs start immediately |
