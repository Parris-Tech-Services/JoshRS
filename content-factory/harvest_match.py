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


def match_all(output: Path, pinned_commit: str | None = None,
              multi_catalog: Path | None = None) -> dict:
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
        if file.name == "lostcity-content-377.json":
            continue  # A baseline row is never an external reference candidate.
        doc = json.loads(file.read_text(encoding="utf-8"))
        if not isinstance(doc.get("candidates"), list):
            continue
        sources.extend(row for row in doc["candidates"]
                       if row.get("source") != "lostcity-content-377")
    # Consume the SINGLE existing harvest_multi.py catalogue, including a
    # downloaded hourly GitHub Actions artifact when explicitly supplied.
    meta_path = multi_catalog or (output / "multi-source/catalog.json")
    if meta_path.exists():
        info = json.loads(meta_path.read_text(encoding="utf-8"))
        for entry in info.get("sources", []):
            if isinstance(entry, dict):
                sources.extend(entry.get("records", []))
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
    """Fail closed for original NPC proposals, including non-terminating branches.

    Every reachable choice must retain a route to an exit. Cycles are allowed
    only when players can eventually choose to leave; a branch trapped in a
    closed cycle is not a valid interactive dialogue.
    """
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
            errors.append("invalid entry")
            continue
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
            errors.append(f"{key}: nodes missing")
            continue
        by_id = {}
        for node in nodes:
            node_id = node.get("id") if isinstance(node, dict) else None
            if not isinstance(node_id, str) or not re.fullmatch(r"[a-z][a-z0-9_]{0,63}", node_id):
                errors.append(f"{key}: invalid dialogue node id")
            elif node_id in by_id:
                errors.append(f"{key}: duplicate dialogue node id")
            else:
                by_id[node_id] = node
        if len(by_id) != len(nodes) or "start" not in by_id:
            errors.append(f"{key}: invalid/duplicate dialogue nodes")
            continue

        endings = set()
        edges = {}
        for node_id, node in by_id.items():
            line = node.get("text")
            if not isinstance(line, str) or not 2 <= len(line) <= 180 or any(c in line for c in "\\r\\n<>"):
                errors.append(f"{key}: unsafe/empty dialogue")
            nexts = node.get("next", [])
            if not isinstance(nexts, list):
                errors.append(f"{key}: invalid branches")
                nexts = []
            valid_nexts = []
            for dest in nexts:
                if not isinstance(dest, str) or dest not in by_id:
                    errors.append(f"{key}: dangling or invalid branch")
                else:
                    valid_nexts.append(dest)
            if node.get("exit") is True:
                endings.add(node_id)
                if valid_nexts:
                    errors.append(f"{key}: exit node cannot have outgoing branches")
            elif not valid_nexts:
                errors.append(f"{key}: dead end")
            edges[node_id] = valid_nexts
        if not endings:
            errors.append(f"{key}: no exit")

        reachable = {"start"}
        stack = ["start"]
        while stack:
            node_id = stack.pop()
            for dest in edges[node_id]:
                if dest not in reachable:
                    reachable.add(dest)
                    stack.append(dest)
        if reachable != set(by_id):
            errors.append(f"{key}: unreachable node")

        # A reachable exit somewhere in the graph is not enough: every
        # reachable branch must have a route to an exit. A closed subgraph
        # (e.g. a self-loop or mutually recursive options) traps the player.
        reverse = {node_id: [] for node_id in by_id}
        for node_id, nexts in edges.items():
            for dest in nexts:
                reverse[dest].append(node_id)
        can_exit = set(endings)
        stack = list(endings)
        while stack:
            for parent in reverse[stack.pop()]:
                if parent not in can_exit:
                    can_exit.add(parent)
                    stack.append(parent)
        if reachable - can_exit:
            errors.append(f"{key}: reachable branch cannot reach an exit")

        start_text = by_id["start"].get("text")
        if isinstance(start_text, str):
            first_line = start_text.lower().strip()
            if first_line in greetings:
                errors.append(f"{key}: repeated generic first line")
            greetings.add(first_line)
            if first_line in {"hello adventurer", "hello, adventurer!", "greetings adventurer"}:
                errors.append(f"{key}: universal greeting refused")
    return errors


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--output", type=Path, default=HERE / "generated")
    ap.add_argument("--proposals", type=Path)
    ap.add_argument("--harvest-catalog", type=Path, help="output of the existing harvest_multi.py")
    opts = ap.parse_args()
    if opts.proposals:
        problems = dialogue_health(json.loads(opts.proposals.read_text(encoding="utf-8")))
        if problems:
            ap.exit(1, "\n".join(problems) + "\n")
        print("Original dialogue graph passes static checks; NOT playable")
        return
    report = match_all(opts.output, multi_catalog=opts.harvest_catalog)
    if report["status"].startswith("blocked"):
        ap.exit(2, report["message"] + "\n")
    opts.output.mkdir(parents=True, exist_ok=True)
    out = opts.output / "source-comparison.json"
    out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, sort_keys=True))


if __name__ == "__main__":
    main()
