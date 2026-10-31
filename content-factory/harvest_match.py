#!/usr/bin/env python3
"""Compare discovery metadata with exact pinned rev377 evidence; never infer a missing feature.

Uses only public source identities and optional *sanitised* QA assertions. Does not
read active.json, player saves, client caches, NPC dialogue or private Drive data.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
PIN_PATH = HERE.parent / "deploy/jparris-windows/upstreams.json"
SHA = re.compile(r"^[0-9a-f]{40}$")
PLACEHOLDER = {"law_rune", "nature_rune", "amulet_mould", "chisel", "gold_amulet"}


def baseline_map(pack: dict, pinned_commit: str) -> dict:
    """Fail closed when registry scanned mutable branch instead of pinned content."""
    if pack.get("commit_sha") != pinned_commit:
        raise ValueError("377 baseline pack does not match deploy pin; re-index exact pinned commit")
    if not isinstance(pack.get("candidates"), list):
        raise ValueError("missing baseline candidates")
    found = {}
    for row in pack["candidates"]:
        path, blob = row.get("path"), row.get("blob_sha")
        if not isinstance(path, str) or not isinstance(blob, str) or not SHA.fullmatch(blob):
            continue
        found[path] = blob
    return found


def classify(row: dict, pinned: dict, revision: str) -> dict:
    """Exact path/blob match only. A name or later-era numerical ID is never enough."""
    path, blob = row.get("path"), row.get("blob_sha")
    same = bool(isinstance(path, str) and path in pinned)
    unchanged = same and pinned[path] == blob and bool(blob)
    native = row.get("source") == "lostcity-content-377" and row.get("source_commit_sha") == revision
    if native or unchanged:
        state = "existing_unverified"
    elif same:
        state = "version_difference_unverified"
    else:
        state = "unmapped_reference"
    return {
        "reference_id": row.get("id"), "source": row.get("source"), "path": path,
        "source_revision": row.get("source_revision") or row.get("source_commit_sha"),
        "blob_sha": blob, "baseline_path_exists": same,
        "baseline_blob_identical": unchanged, "classification": state,
        "runtime": "unverified", "missing_confirmed": False,
        "rights_cleared": False, "automatically_installed": False,
        "target_revision": 377, "target_id377": None,
        "evidence_url": row.get("reference_url") or row.get("url")
    }


def match_all(output: Path, pinned_commit: str | None = None) -> dict:
    pins = json.loads(PIN_PATH.read_text(encoding="utf-8"))
    pinned_commit = pinned_commit or pins["content"]["commit"]
    pack_path = output / "packs/lostcity-content-377.json"
    if not pack_path.exists():
        return {"schema": "joshrs-377-source-comparison-v1",
                "status": "blocked_no_pinned_inventory", "rows": [],
                "message": "Scan pinned LostCity Content exact commit before comparison"}
    pack = json.loads(pack_path.read_text(encoding="utf-8"))
    baseline = baseline_map(pack, pinned_commit)
    full_index_path = output / "pinned-377-index.json"
    baseline_complete = False
    if full_index_path.exists():
        index = json.loads(full_index_path.read_text(encoding="utf-8"))
        if (index.get("commit") == pinned_commit and index.get("complete") is True
                and isinstance(index.get("paths"), dict)):
            baseline = index["paths"]
            baseline_complete = True
    sources = []
    for file in sorted((output / "packs").glob("*.json")):
        doc = json.loads(file.read_text(encoding="utf-8"))
        if not isinstance(doc.get("candidates"), list):
            continue
        sources.extend(row for row in doc["candidates"]
                       if row.get("source") != "lostcity-content-377")
    meta_path = output / "source-metadata-state.json"
    if meta_path.exists():
        info = json.loads(meta_path.read_text(encoding="utf-8"))
        for entry in info.values():
            if isinstance(entry, dict):
                sources.extend(entry.get("candidates", []))
    unique = {}
    for row in sources:
        if not isinstance(row, dict):
            continue
        key = (row.get("source"), row.get("path"), row.get("blob_sha"), row.get("source_revision") or row.get("source_commit_sha"))
        unique[key] = classify(row, baseline, pinned_commit)
    matches = sorted(unique.values(), key=lambda r: (str(r["classification"]), str(r["source"]), str(r["path"])))
    if not baseline_complete:
        for item in matches:
            if item["classification"] == "unmapped_reference":
                item["classification"] = "unmapped_partial_inventory"
    counts = {k: sum(m["classification"] == k for m in matches) for k in
              ("existing_unverified", "version_difference_unverified", "unmapped_reference", "unmapped_partial_inventory")}
    return {"schema": "joshrs-377-source-comparison-v1", "status": "metadata_compared_not_playtested",
            "pinned_commit": pinned_commit, "baseline_paths_indexed": len(baseline),
            "baseline_complete": baseline_complete,
            "candidate_count": len(matches), "counts": counts,
            "missing_confirmed": 0, "client_verified": 0,
            "copying_or_auto_installing": False, "rows": matches[:12000]}


def dialogue_health(doc: dict) -> list[str]:
    """Check new *original proposal* graphs, never retroactively rewrite canonical dialogue."""
    errors = []
    if not isinstance(doc, dict) or doc.get("schema") != "joshrs-377-original-dialogue-v1":
        return ["wrong proposal schema"]
    entries = doc.get("entries", [])
    if not isinstance(entries, list) or not entries:
        return ["no original dialogue proposals"]
    identifiers = set()
    greetings = set()
    for entry in entries:
        if not isinstance(entry, dict):
            errors.append("invalid entry"); continue
        key = entry.get("key")
        if not isinstance(key, str) or not re.fullmatch(r"[a-z][a-z0-9_]+", key) or key in identifiers:
            errors.append("missing or duplicate NPC key")
            continue
        identifiers.add(key)
        if entry.get("origin") != "original_user_authored" or entry.get("status") != "research_proposal_not_installable":
            errors.append(f"{key}: provenance/status not safe")
        if entry.get("id377") is not None:
            errors.append(f"{key}: no IDs may be assigned before live gap approval")
        nodes = entry.get("nodes")
        if not isinstance(nodes, list) or not nodes:
            errors.append(f"{key}: nodes missing"); continue
        by_id = {n.get("id"): n for n in nodes if isinstance(n, dict)}
        if len(by_id) != len(nodes) or "start" not in by_id:
            errors.append(f"{key}: invalid/duplicate dialogue nodes"); continue
        endings = {k for k, v in by_id.items() if v.get("exit") is True}
        if not endings:
            errors.append(f"{key}: no exit")
        reachable, seen = ["start"], set()
        while reachable:
            node = reachable.pop()
            if node in seen: continue
            seen.add(node)
            entry_node = by_id.get(node)
            if entry_node is None:
                errors.append(f"{key}: dangling branch {node}"); continue
            line = entry_node.get("text", "")
            if not isinstance(line, str) or not 2 <= len(line) <= 180 or any(c in line for c in "\n<>"):
                errors.append(f"{key}: unsafe/empty dialogue")
            nexts = entry_node.get("next", [])
            if not isinstance(nexts, list):
                errors.append(f"{key}: invalid branches"); continue
            if not entry_node.get("exit") and not nexts:
                errors.append(f"{key}: dead end")
            reachable.extend(nexts)
        if seen != set(by_id):
            errors.append(f"{key}: unreachable node")
        if not any(end in seen for end in endings):
            errors.append(f"{key}: exit unreachable")
        start = by_id["start"].get("text", "").lower().strip()
        if start in greetings:
            errors.append(f"{key}: repeated generic first line")
        greetings.add(start)
        if start in {"hello adventurer", "hello, adventurer!", "greetings adventurer"}:
            errors.append(f"{key}: universal greeting refused")
    return errors


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--output", type=Path, default=HERE / "generated")
    ap.add_argument("--proposals", type=Path)
    opts = ap.parse_args()
    if opts.proposals:
        problems = dialogue_health(json.loads(opts.proposals.read_text(encoding="utf-8")))
        if problems:
            ap.exit(1, "\n".join(problems) + "\n")
        print("Original dialogue graph passes static checks; NOT playable")
        return
    report = match_all(opts.output)
    if report["status"].startswith("blocked"):
        ap.exit(2, report["message"] + "\n")
    opts.output.mkdir(parents=True, exist_ok=True)
    out = opts.output / "source-comparison.json"
    out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, sort_keys=True))


if __name__ == "__main__":
    main()
