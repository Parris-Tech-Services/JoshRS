#!/usr/bin/env python3
"""Read-only public metadata adapters for the existing JoshRS 377 content factory.

No source, cache, dialogue, private Drive, binaries or assets are downloaded.
Run via factory.py --source-metadata or this standalone CLI. Not an importer.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request

HERE = Path(__file__).resolve().parent
MAX_BYTES = 5_000_000
MAX_FILES = 400
SHA = re.compile(r"^[0-9a-f]{40}$")
TOKEN = re.compile(r"^[A-Za-z0-9_%-]{1,128}$")
SOURCES = {
    "gitlab-2009scape": ("gitlab", "https://gitlab.com/api/v4/projects/2009scape%2F2009scape"),
    "openrs2-377": ("openrs2", "https://archive.openrs2.org/api/caches.json"),
    "hf-2009-knowledge": ("huggingface", "https://huggingface.co/api/datasets/arsalan-anwari/2009scape-wiki-api-data"),
}
HOSTS = {"gitlab.com", "archive.openrs2.org", "huggingface.co"}
OMIT = ("assets", "sprites", "textures", "models", "maps", "cache", "music",
        "audio", "songs", "images", "media", ".git", "target", "build", "node_modules")
ALLOWED_SUFFIXES = {".rs2", ".java", ".kt", ".py", ".ts", ".npc", ".json", ".md",
                    ".yaml", ".yml", ".loc", ".constant", ".varp"}


class MetadataBlocked(Exception):
    """Provider unavailable, incomplete, unsafe or unexpectedly formatted."""


def request_json(url: str) -> tuple[object, dict]:
    """Allowlisted bounded unauthenticated GET, no redirects to a foreign origin."""
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in HOSTS or parsed.username or parsed.password:
        raise MetadataBlocked("source host not allowlisted")
    class Restricted(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, headers, newurl):
            n = urllib.parse.urlsplit(newurl)
            if n.scheme != "https" or n.hostname != parsed.hostname:
                raise MetadataBlocked("cross-origin redirect refused")
            return super().redirect_request(req, fp, code, msg, headers, newurl)
    opener = urllib.request.build_opener(Restricted)
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "JoshRS-377-Metadata-Only/1.0"})
    try:
        with opener.open(req, timeout=20) as response:
            body = response.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                raise MetadataBlocked("metadata response too large")
            return json.loads(body), dict(response.headers)
    except (OSError, ValueError, UnicodeError) as exc:
        raise MetadataBlocked("metadata request unavailable or invalid") from exc


def safe_path(path: object) -> bool:
    if not isinstance(path, str) or len(path) > 240 or "\\" in path or path.startswith("/"):
        return False
    parts = path.split("/")
    return (len(parts) <= 12 and all(p and p not in (".", "..") and
            p.lower() not in OMIT and not p.startswith(".") for p in parts)
            and Path(path).suffix.lower() in ALLOWED_SUFFIXES)


def meta_item(source: str, path: str, identity: str, revision: str, url: str) -> dict:
    key = hashlib.sha256(f"{source}\0{revision}\0{path}\0{identity}".encode()).hexdigest()[:20]
    return {"id": key, "source": source, "path": path, "source_revision": revision,
            "blob_sha": identity if SHA.fullmatch(identity or "") else None,
            "reference_url": url, "policy": "metadata_only", "rights": "unresolved",
            "classification": "unknown", "runtime_verified": False,
            "eligible_for_import": False}


def _link_token(headers: dict) -> str | None:
    # GitLab keyset pagination: response Link rel=next with a page_token.
    value = next((v for k, v in headers.items() if k.lower() == "link"), "")
    for segment in value.split(","):
        if 'rel="next"' not in segment and "rel=next" not in segment:
            continue
        between = re.search(r"<([^>]+)>", segment)
        if not between:
            continue
        u = urllib.parse.urlsplit(between.group(1))
        if u.scheme != "https" or u.hostname != "gitlab.com" or not u.path.endswith("/repository/tree"):
            raise MetadataBlocked("invalid GitLab next-page link")
        result = urllib.parse.parse_qs(u.query).get("page_token", [])
        if result and TOKEN.fullmatch(result[0]):
            return result[0]
        raise MetadataBlocked("unrecognised GitLab pagination token")
    return None


def collect_gitlab(previous: dict, pages: int, fetch=request_json) -> dict:
    base = SOURCES["gitlab-2009scape"][1]
    commit, _ = fetch(base + "/repository/commits/master")
    sha = commit.get("id") if isinstance(commit, dict) else None
    if not isinstance(sha, str) or not SHA.fullmatch(sha):
        raise MetadataBlocked("GitLab commit SHA missing")
    previous_same = previous.get("revision") == sha
    token = previous.get("cursor") if previous_same else None
    if token is not None and (not isinstance(token, str) or not TOKEN.fullmatch(token)):
        raise MetadataBlocked("invalid saved GitLab cursor")
    existing = (previous.get("candidates", []) if previous_same else [])
    records = {x["id"]: x for x in existing if isinstance(x, dict) and "id" in x}
    complete = False
    for _ in range(pages):
        params = {"recursive": "true", "pagination": "keyset", "per_page": "100", "ref": sha}
        if token:
            params["page_token"] = token
        tree, headers = fetch(base + "/repository/tree?" + urllib.parse.urlencode(params))
        if not isinstance(tree, list):
            raise MetadataBlocked("GitLab tree was not a list")
        for item in tree:
            if not isinstance(item, dict) or item.get("type") != "blob":
                continue
            path, identity = item.get("path"), item.get("id")
            if not safe_path(path) or not isinstance(identity, str) or not SHA.fullmatch(identity):
                continue
            item_url = "https://gitlab.com/2009scape/2009scape/-/blob/" + sha + "/" + urllib.parse.quote(path, safe="/")
            obj = meta_item("gitlab-2009scape", path, identity, sha, item_url)
            records[obj["id"]] = obj
        token = _link_token(headers)
        if not token:
            if len(tree) == 100:
                raise MetadataBlocked("full GitLab page without pagination proof")
            complete = True
            break
        if len(records) > MAX_FILES:
            raise MetadataBlocked("GitLab metadata budget reached; refused partial overwrite")
    if len(records) > MAX_FILES:
        raise MetadataBlocked("GitLab item budget exceeded")
    return {"revision": sha, "cursor": token, "complete": complete,
            "candidates": sorted(records.values(), key=lambda x: x["path"])}


def _find_openrs2(snapshot: object) -> dict | None:
    # The API has changed shapes over time; reject unrecognised/ambiguous matches.
    rows = snapshot if isinstance(snapshot, list) else snapshot.get("caches", []) if isinstance(snapshot, dict) else []
    if not isinstance(rows, list):
        raise MetadataBlocked("OpenRS2 cache metadata schema unsupported")
    matches = [r for r in rows if isinstance(r, dict) and r.get("id") == 2696]
    if len(matches) != 1:
        raise MetadataBlocked("OpenRS2 cache 2696 unavailable or ambiguous")
    return matches[0]


def collect_openrs2(previous: dict, pages: int, fetch=request_json) -> dict:
    raw, _ = fetch(SOURCES["openrs2-377"][1])
    value = _find_openrs2(raw)
    # Explicit allowlist prevents cache keys/binary download URLs entering public reports.
    safe = {k: value[k] for k in ("id", "scope", "game", "build", "timestamp", "name")
            if k in value and isinstance(value[k], (str, int, float, type(None)))}
    if safe.get("id") != 2696:
        raise MetadataBlocked("cache identity mismatch")
    return {"revision": "openrs2:2696", "complete": True, "cursor": None,
            "snapshot": safe, "candidates": [], "notice": "Cache metadata, not runnable server content"}


def collect_hf(previous: dict, pages: int, fetch=request_json) -> dict:
    data, _ = fetch(SOURCES["hf-2009-knowledge"][1])
    if not isinstance(data, dict) or not isinstance(data.get("sha"), str):
        raise MetadataBlocked("Hugging Face dataset revision unavailable")
    revision = data["sha"]
    if not SHA.fullmatch(revision):
        raise MetadataBlocked("invalid dataset commit")
    siblings = data.get("siblings", [])
    if not isinstance(siblings, list) or len(siblings) > 4000:
        raise MetadataBlocked("unsupported or oversized dataset listing")
    records = []
    for file in siblings:
        path = file.get("rfilename") if isinstance(file, dict) else None
        if not safe_path(path):
            continue
        # Metadata only; non-code game data are excluded, even when JSON.
        if Path(path).suffix.lower() not in {".md", ".py", ".yml", ".yaml"}:
            continue
        url = ("https://huggingface.co/datasets/arsalan-anwari/2009scape-wiki-api-data/"
               "blob/" + revision + "/" + urllib.parse.quote(path, safe="/"))
        records.append(meta_item("hf-2009-knowledge", path, "", revision, url))
    return {"revision": revision, "complete": True, "cursor": None,
            "candidates": records[:MAX_FILES]}


def collect_all(dest: Path, kinds: tuple[str, ...] | None = None, pages: int = 2,
                fetch=request_json) -> dict:
    """Existing factory invokes this as an optional, explicitly read-only stage."""
    if not 1 <= pages <= 5:
        raise ValueError("pages must be 1..5")
    names = kinds or tuple(SOURCES)
    if any(n not in SOURCES for n in names):
        raise ValueError("unknown source adapter")
    state_path = dest / "source-metadata-state.json"
    prior = json.loads(state_path.read_text(encoding="utf8")) if state_path.exists() else {}
    state = dict(prior)
    report = {"schema": "joshrs-377-source-metadata-v1", "source_access": {},
              "candidate_count": {}, "complete": {}, "integration": "not_authorised"}
    adapters = {"gitlab-2009scape": collect_gitlab, "openrs2-377": collect_openrs2,
                "hf-2009-knowledge": collect_hf}
    for name in names:
        try:
            result = adapters[name](prior.get(name, {}), pages, fetch)
            state[name] = result
            report["source_access"][name] = "metadata_only"
            report["candidate_count"][name] = len(result["candidates"])
            report["complete"][name] = result["complete"]
        except (MetadataBlocked, ValueError, KeyError, TypeError):
            report["source_access"][name] = "blocked"
            report["candidate_count"][name] = len(prior.get(name, {}).get("candidates", []))
            report["complete"][name] = False
    dest.mkdir(parents=True, exist_ok=True)
    # Preserve prior successful checkpoints if one provider is down.
    out = dest / "source-metadata-report.json"
    for path, doc in ((state_path, state), (out, report)):
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(json.dumps(doc, sort_keys=True, indent=2) + "\n", encoding="utf8")
        os.replace(tmp, path)
    return report


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output", type=Path, default=HERE / "generated")
    p.add_argument("--pages", type=int, default=2)
    p.add_argument("--source", action="append", choices=tuple(SOURCES))
    a = p.parse_args()
    result = collect_all(a.output, tuple(a.source) if a.source else None, a.pages)
    print(json.dumps(result, sort_keys=True))
    if all(v == "blocked" for v in result["source_access"].values()):
        raise SystemExit(2)


if __name__ == "__main__":
    main()
