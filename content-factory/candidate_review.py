#!/usr/bin/env python3
"""Produce a *per-file evidence ledger*, never automatic rights clearance.

Metadata, an MIT/ISC licence and native compilation are different forms of proof.
A foreign game's scripts may contain protected dialogue and game-specific assets.
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import re
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
# Actual repo-level licence files inspected 2026-10-31 (content at the named ref).
# MIT source code permission does NOT clear the underlying game assets or dialogue.
LICENSE_EVIDENCE = {
    "LostCityRS/Content": ("MIT", "https://github.com/LostCityRS/Content/blob/377-wip/LICENSE"),
    "LostCityRS/Engine-TS": ("MIT", "https://github.com/LostCityRS/Engine-TS/blob/377-wip/LICENSE"),
    "LostCityRS/RuneScriptTS": ("MIT", "https://github.com/LostCityRS/RuneScriptTS/blob/main/LICENSE"),
    "openrs2/openrs2": ("ISC", "https://github.com/openrs2/openrs2/blob/master/LICENSE"),
    "2006-Scape/2006Scape": ("GPL-3.0", "https://github.com/2006-Scape/2006Scape/blob/master/LICENSE"),
}
GAME_SPECIFIC_CONFIG = {".npc", ".obj", ".loc", ".seq", ".pack"}
KNOWN_CODE_EXT = {".rs2", ".ts", ".tsx", ".kt", ".java", ".py"}
THIRD_PARTY_POLICY = {
    "already_in_pinned_source": "already_present_no_port_required",
    "rights_review_required": "blocked_game_content_rights",
    "blocked_reference_only": "blocked_reference_only",
    "manual_port_required": "requires_individual_code_and_game_rights_review",
}


def assess(row: dict) -> dict:
    """Assess immutable source metadata; never assume a source copy was implemented."""
    for key in ("id", "source", "repo", "path", "blob_sha", "url", "status"):
        if not isinstance(row.get(key), str) or not row[key]:
            raise ValueError(f"Candidate missing required metadata: {key}")
    path = Path(row["path"])
    ext = path.suffix.lower()
    repo = row["repo"]
    known_license, license_link = LICENSE_EVIDENCE.get(repo, (None, None))
    source_status = row["status"]
    if source_status not in THIRD_PARTY_POLICY:
        raise ValueError(f"Unsupported classification: {source_status}")
    if source_status == "already_in_pinned_source":
        action = "No import: already included in pinned source; test locally before claiming functionality."
    elif source_status == "blocked_reference_only":
        action = "Blocked for importing. May be used as public factual context only."
    elif ext in GAME_SPECIFIC_CONFIG:
        action = "Block until code/config, game dialogue and referenced assets have separate provenance checks."
    elif ext in KNOWN_CODE_EXT:
        action = "Inspect source and all dependencies; separately verify original-game-content rights, then port and compile 377."
    else:
        action = "Do not auto-port unfamiliar or potentially binary content."
    identity = hashlib.sha256(f'{repo}\n{row["path"]}\n{row["blob_sha"]}'.encode()).hexdigest()[:24]
    return {
        "review_id": identity,
        "candidate_id": row["id"],
        "source": row["source"],
        "repo": repo,
        "path": row["path"],
        "blob_sha": row["blob_sha"],
        "source_commit_sha": row.get("source_commit_sha"),
        "reference_url": row["url"],
        "classification": source_status,
        "decision": THIRD_PARTY_POLICY[source_status],
        "repository_software_license": known_license,
        "repository_license_evidence": license_link,
        "license_scope": "software_only_not_proof_of_game_data_or_asset_permission" if known_license else "unconfirmed",
        "source_code_reviewed_individually": False,
        "game_content_rights_approved": False,
        "external_assets_approved": False,
        "compatible_with_pinned_377": source_status == "already_in_pinned_source",
        "native_377_compiled_as_new_feature": False,
        "npc_or_player_interaction_tested": False,
        "elrothiro_save_tested": False,
        "outstanding_action": action,
    }


def build_ledger(packs_dir: Path) -> dict:
    rows: dict[str, dict] = {}
    for file in sorted(packs_dir.glob("*.json")):
        pack = json.loads(file.read_text(encoding="utf-8"))
        for row in pack.get("candidates", []):
            record = assess(row)
            key = record["review_id"]
            if key in rows:
                # Duplicates from identical paths/SHAs under multiple branches are one source file.
                if (rows[key]["classification"] == "already_in_pinned_source"
                    or record["classification"] != "already_in_pinned_source"):
                    continue
            rows[key] = record
    decisions = Counter(r["decision"] for r in rows.values())
    return {
        "schema": 1,
        "provenance": "read-only GitHub tree metadata; NOT individual source/rights review",
        "total_unique_source_files": len(rows),
        "counts_by_decision": dict(sorted(decisions.items())),
        "total_approved_third_party_source_ports": 0,
        "total_verified_live_gameplay_candidates": 0,
        "code_license_not_equal_asset_rights": True,
        "reviews": [rows[k] for k in sorted(rows)],
    }


def run(packs_dir: Path, output: Path, batch_size: int = 200) -> dict:
    """Store an index plus small GitHub-readable review shards (<1 MB each)."""
    if not 1 <= batch_size <= 250:
        raise ValueError("Evidence shard size must be 1..250")
    ledger = build_ledger(packs_dir)
    generated = output.parent
    generated.mkdir(parents=True, exist_ok=True)
    shard_dir = generated / "candidate-evidence-shards"
    shard_dir.mkdir(parents=True, exist_ok=True)
    groups: dict[str, list[dict]] = {}
    for record in ledger["reviews"]:
        name = record["source"]
        if not re.fullmatch(r"[a-z][a-z0-9_-]{1,70}", name):
            raise ValueError("Unsafe evidence source filename")
        groups.setdefault(name, []).append(record)
    manifests = []
    created = set()
    for source, rows in sorted(groups.items()):
        for index in range(0, len(rows), batch_size):
            page = rows[index:index + batch_size]
            filename = f"{source}-{index // batch_size:04d}.json"
            content = (json.dumps({"schema": 1, "source": source, "reviews": page},
                                  ensure_ascii=False, indent=2) + "\n").encode("utf-8")
            if len(content) >= 900_000:
                raise ValueError("Evidence shard exceeds GitHub readable size")
            (shard_dir / filename).write_bytes(content)
            created.add(filename)
            manifests.append({
                "path": f"candidate-evidence-shards/{filename}",
                "source": source,
                "count": len(page),
                "sha256": hashlib.sha256(content).hexdigest(),
            })
    # Remove stale *known-format* shards when a repo changes/retreats.
    # Other files are never altered.
    for old in shard_dir.iterdir():
        if (old.is_file() and re.fullmatch(r"[a-z][a-z0-9_-]+-[0-9]{4}\.json", old.name)
                and old.name not in created):
            old.unlink()
    summary = {k: v for k, v in ledger.items() if k != "reviews"}
    summary["shard_count"] = len(manifests)
    summary["shards"] = manifests
    output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    verify_shards(output)
    print(f'Per-candidate review index published: {ledger["total_unique_source_files"]} unique files, '
          f'{len(manifests)} readable shards, 0 auto-approved game assets.')
    return summary


def verify_shards(index_file: Path) -> int:
    """Recount and check hashes, source labels, unique IDs and all manual-review gates."""
    index = json.loads(index_file.read_text(encoding="utf-8"))
    seen = set()
    count = 0
    for shard in index.get("shards", []):
        path = Path(shard["path"])
        if path.is_absolute() or ".." in path.parts or path.parts[0] != "candidate-evidence-shards" or len(path.parts) != 2:
            raise ValueError("Unsafe shard index path")
        data = (index_file.parent / path).read_bytes()
        if hashlib.sha256(data).hexdigest() != shard["sha256"]:
            raise ValueError("Evidence shard hash mismatch")
        doc = json.loads(data)
        if doc["source"] != shard["source"] or len(doc["reviews"]) != shard["count"]:
            raise ValueError("Evidence index count/source mismatch")
        for record in doc["reviews"]:
            if (record["review_id"] in seen or
                record["source"] != shard["source"] or
                record["game_content_rights_approved"] is not False or
                record["external_assets_approved"] is not False or
                record["native_377_compiled_as_new_feature"] is not False or
                record["npc_or_player_interaction_tested"] is not False or
                record["elrothiro_save_tested"] is not False):
                raise ValueError("Evidence duplicate or unjustified approval")
            seen.add(record["review_id"])
        count += len(doc["reviews"])
    if count != index.get("total_unique_source_files") or len(index["shards"]) != index.get("shard_count"):
        raise ValueError("Evidence index does not cover all candidates")
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--packs", type=Path, default=ROOT / "generated/packs")
    parser.add_argument("--output", type=Path, default=ROOT / "generated/candidate-evidence.json")
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    try:
        if args.verify:
            print(f'Verified {verify_shards(args.output)} per-file evidence records.')
        else:
            run(args.packs, args.output)
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as exc:
        print("Evidence audit blocked: " + str(exc), file=sys.stderr)
        raise SystemExit(1)
