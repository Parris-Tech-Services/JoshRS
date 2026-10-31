#!/usr/bin/env python3
"""Fail-closed, metadata-only QA for three source-traced Varrock NPCs.

Consumes output from audit_dispatch.py plus optional *sanitised* Agent 3
observations. Never reads private runtime, player saves, script text or caches.
It does not assert that the Java client was independently observed by CI.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re

EXPECTED = {
    "reldo": "opnpc1,reldo",
    "juliet": "opnpc1,juliet_multi_visible",
    "romeo": "opnpc1,romeo",
}
PINNED_BLOBS = {
    "reldo": "a3af9aea051e92409b11c9d561a3381f2a824480",
    "juliet": "510d1e770c86ae35da6bce3432074a7be44cce89",
    "romeo": "b32098585ed83069be3cb0826551b20367970653",
}
GIT_SHA1 = re.compile(r"^[0-9a-f]{40}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
OUTCOMES = {"distinct_dialogue", "generic_greeting", "no_action", "crash", "unverified"}


def valid_sha(value: object) -> bool:
    return isinstance(value, str) and bool(SHA256.fullmatch(value))


def check_audit(audit: object) -> tuple[dict, dict]:
    if not isinstance(audit, dict) or audit.get("schema") != "joshrs-377-dispatch-diagnostic-v1":
        raise ValueError("invalid source diagnostic schema")
    cases = audit.get("cases")
    if not isinstance(cases, list) or len(cases) != len(EXPECTED):
        raise ValueError("expected exactly three Varrock source cases")
    found = {}
    for case in cases:
        if not isinstance(case, dict):
            raise ValueError("invalid source case")
        key = case.get("npc")
        if key not in EXPECTED or key in found or case.get("expected_trigger") != EXPECTED[key]:
            raise ValueError("unexpected, duplicated or mismatched source trigger")
        for field in ("source_exists", "source_trigger_present", "generic_literal_detected"):
            if type(case.get(field)) is not bool:
                raise ValueError("missing or invalid source observation: " + field)
        if case["source_exists"] and not valid_sha(case.get("source_sha256")):
            raise ValueError("source exists without a valid sha256")
        # Older audit reports remain accepted, but do not establish pin identity.
        # New reports must be internally consistent and tied to the public
        # pinned blob identities, never a self-declared alternate baseline.
        pin_fields = ("pinned_source_blob_sha1_expected", "source_git_blob_sha1",
                      "source_matches_pinned_377")
        present = [field in case for field in pin_fields]
        if any(present) and not all(present):
            raise ValueError("incomplete pinned source identity evidence")
        if all(present):
            expected = PINNED_BLOBS[key]
            if case["pinned_source_blob_sha1_expected"] != expected:
                raise ValueError("unexpected pinned source blob for " + key)
            observed, matches = case["source_git_blob_sha1"], case["source_matches_pinned_377"]
            if case["source_exists"]:
                if not isinstance(observed, str) or not GIT_SHA1.fullmatch(observed):
                    raise ValueError("invalid Git blob SHA-1 for " + key)
                if type(matches) is not bool or matches != (observed == expected):
                    raise ValueError("contradictory pinned source comparison for " + key)
            elif observed is not None or matches is not None:
                raise ValueError("missing source cannot claim pinned identity")
        found[key] = case
    packs = audit.get("packs")
    if not isinstance(packs, dict):
        raise ValueError("source diagnostic missing pack information")
    for k in ("script_dat", "script_idx"):
        if not isinstance(packs.get(k), dict) or type(packs[k].get("present")) is not bool:
            raise ValueError("invalid pack fingerprint")
        if packs[k]["present"] and not valid_sha(packs[k].get("sha256")):
            raise ValueError("pack marked present without sha256")
    return found, packs


def check_live(live: object) -> dict | None:
    if live is None:
        return None
    if not isinstance(live, dict) or live.get("schema") != "joshrs-377-agent3-dispatch-observation-v1":
        raise ValueError("invalid Agent 3 observation schema")
    if live.get("evidence_method") != "agent3_read_only_loaded_pack_fingerprint":
        raise ValueError("live observations require explicit Agent 3 process fingerprint method")
    if live.get("client_revision") != 377 or live.get("disposable_test_account") is not True:
        raise ValueError("require rev377 client and disposable test account")
    if not all(valid_sha(live.get(k)) for k in ("loaded_script_dat_sha256", "loaded_script_idx_sha256")):
        raise ValueError("loaded script packs need both sha256 fingerprints")
    observations = live.get("observations")
    if not isinstance(observations, dict) or set(observations) != set(EXPECTED):
        raise ValueError("live observations must cover exactly Reldo, Juliet and Romeo")
    for key, row in observations.items():
        if not isinstance(row, dict) or row.get("result") not in OUTCOMES:
            raise ValueError("invalid result for " + key)
        if type(row.get("click_reached_server")) is not bool:
            raise ValueError("click route must be observed as boolean")
        if type(row.get("relog_checked")) is not bool:
            raise ValueError("relog flag must be a boolean")
        if row["result"] == "distinct_dialogue" and not row["click_reached_server"]:
            raise ValueError("cannot claim distinct dialogue without observed click")
    return live


def verify(audit: dict, live: dict | None = None) -> dict:
    cases, packs = check_audit(audit)
    live = check_live(live)
    source_pack_ready = all(packs[k]["present"] for k in ("script_dat", "script_idx"))
    pack_match = bool(live and source_pack_ready and all(
        packs[k]["sha256"] == live["loaded_" + k + "_sha256"]
        for k in ("script_dat", "script_idx")
    ))
    result = []
    for key in EXPECTED:
        case = cases[key]
        row = live["observations"][key] if live else None
        if not case["source_exists"]:
            state = "source_absent_in_audited_checkout"
        elif not case["source_trigger_present"]:
            state = "expected_source_trigger_missing"
        elif case["generic_literal_detected"]:
            state = "generic_literal_in_source_review_required"
        elif case.get("source_matches_pinned_377") is False:
            state = "source_differs_from_pinned_377_review_customizations"
        elif not source_pack_ready:
            state = "pack_fingerprint_missing"
        elif live is None:
            state = "awaiting_agent3_client_evidence"
        elif not pack_match:
            state = "loaded_pack_mismatch_investigate_first"
        elif row["result"] == "generic_greeting":
            state = "fallback_or_dispatch_suspected_not_proven"
        elif row["result"] == "distinct_dialogue":
            state = "agent3_reported_distinct_client_dialogue"
        elif row["result"] == "no_action":
            state = "agent3_reported_no_action"
        elif row["result"] == "crash":
            state = "agent3_reported_client_error"
        else:
            state = "awaiting_specific_client_observation"
        result.append({
            "npc": key, "expected_trigger": EXPECTED[key], "classification": state,
            "source_trigger_present": case["source_trigger_present"],
            "audited_source_matches_pinned_377": case.get("source_matches_pinned_377"),
            "agent3_relog_reported": bool(row and row["relog_checked"] and row["result"] == "distinct_dialogue" and pack_match),
            "verified_by_this_offline_tool": False,
        })
    return {
        "schema": "joshrs-377-varrock-dispatch-evidence-v1",
        "source_pinned_commit_expected": "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50",
        "source_pinned_commit_verified_by_this_tool": False,
        "all_three_audited_source_blobs_match_pinned_377": all(
            cases[key].get("source_matches_pinned_377") is True for key in EXPECTED),
        "source_pack_fingerprints_present": source_pack_ready,
        "agent3_observations_supplied": live is not None,
        "loaded_pack_sha256_matches_audited_files": pack_match,
        "actual_java_client_verified_by_this_tool": False,
        "gameplay_or_save_modifications": False,
        "cases": result,
        "next_action": "Agent 1 investigate pack drift before fallback routing; Agent 3 independently confirm real Java client click and persistence",
    }


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--audit", type=Path, required=True, help="JSON from audit_dispatch.py")
    ap.add_argument("--agent3", type=Path, help="optional sanitised Agent 3 evidence JSON")
    ap.add_argument("--output", type=Path, help="new report path; must not overwrite")
    args = ap.parse_args()
    report = verify(json.loads(args.audit.read_text(encoding="utf-8")),
                    json.loads(args.agent3.read_text(encoding="utf-8")) if args.agent3 else None)
    output = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.output:
        with args.output.open("x", encoding="utf-8") as f:
            f.write(output)
    else:
        print(output, end="")


if __name__ == "__main__":
    main()
