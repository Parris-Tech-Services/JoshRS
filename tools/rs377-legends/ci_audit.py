#!/usr/bin/env python3
"""Source-to-live evidence preflight for Legends Quest in disposable pinned rev377."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys

CONTENT_PIN = "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50"
REQUIRED_SCRIPTS = ["quest_legends.rs2", "legends_journal.rs2", "radimus_erkle.rs2", "gujuo.rs2", "ungadulu.rs2", "nezikchened.rs2"]
REQUIRED_MARKERS = {
    "quest completion": "[queue,legends_quest_complete]",
    "Radimus dialogue": "[opnpc1,radimus_erkle]",
    "Gujuo dialogue": "[opnpc1,gujuo]",
    "Ungadulu dialogue": "[opnpc1,ungadulu_good]",
    "Ungadulu attack": "[opnpc2,ungadulu_bad]",
    "Nezikchened encounter": "[opnpc2,nezikchened]",
    "journal": "~quest_journal(",
}
def analyse(content):
    content=Path(content).resolve(strict=True)
    sha=subprocess.check_output(["git","-C",str(content),"rev-parse","HEAD"],text=True).strip()
    if sha!=CONTENT_PIN: raise ValueError("Unexpected upstream Content pin; refusing false confidence")
    root=content/"scripts"/"quests"/"quest_legends"
    if not (root/"scripts").is_dir(): raise ValueError("Legends scripts absent from pinned content")
    scripts={p.name:p.read_text(encoding="utf-8") for p in (root/"scripts").glob("*.rs2")}
    constants=(root/"configs"/"quest_legends.constant").read_text(encoding="utf-8")
    combined="\n".join(scripts.values())
    missing=[s for s in REQUIRED_SCRIPTS if s not in scripts]
    missing.extend(key for key,marker in REQUIRED_MARKERS.items() if marker not in combined)
    if "%legendsquest = ^legends_complete" not in combined: missing.append("set quest completion")
    stages=sorted(set(int(n) for n in re.findall(r"(?m)^\^legends_[a-z_0-9]+\s*=\s*(\d+)\s*$",constants)))
    if len(stages)<15: missing.append("multi-stage quest constants")
    flags=[]
    for name,code in scripts.items():
        for lineno,line in enumerate(code.splitlines(),1):
            comment=line.partition("//")[2] if "//" in line else ""
            if re.search(r"\b(TODO|FIXME|NIH|guess(?:ing)?)\b",comment,re.I):
                flags.append({"file":name,"line":lineno,"comment":comment.strip()[:100]})
    return {
        "schema":"joshrs-legends-377-ci-v1",
        "source_sha":sha,
        "script_count":len(scripts),
        "distinct_stage_values":stages,
        "missing_source_markers":missing,
        "source_uncertainties":flags,
        "status":"SOURCE_PREFLIGHT_ONLY" if not missing else "SOURCE_PREFLIGHT_BLOCKED",
        "real_377_disposable_server_smoke":False,
        "full_legends_quest_playthrough_verified":False,
        "live_windows_family_world_verified":False,
        "prerequisite_107_qp_and_skills_verified":False,
        "quest_npcs_and_objects_reachable_verified":False,
        "dialogue_puzzles_and_boss_combat_verified":False,
        "final_four_skill_rewards_and_save_relog_verified":False,
        "limitations":"Real disposable server smoke authenticates a separate test bot but does NOT execute Legends Quest",
        "next_step":"Full normal-client quest stage automation using complete RS-SDK dialogue, combat, bank, inventory and world object observations; do not fake progress"
    }

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--content",type=Path)
    parser.add_argument("--report",type=Path,required=True)
    parser.add_argument("--mark-server-smoke-passed",action="store_true")
    args=parser.parse_args()
    if args.mark_server_smoke_passed:
        if args.content or os.environ.get("GITHUB_ACTIONS")!="true":
            raise ValueError("Only genuine disposable GitHub runner may record a server smoke")
        data=json.loads(args.report.read_text(encoding="utf-8"))
        if data["status"]!="SOURCE_PREFLIGHT_ONLY": raise ValueError("Source preflight not passed")
        data["real_377_disposable_server_smoke"]=True
    else:
        if not args.content: raise ValueError("--content required for source preflight")
        data=analyse(args.content)
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(data,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:data[k] for k in ["status","script_count","real_377_disposable_server_smoke","full_legends_quest_playthrough_verified"]},indent=2))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"],"a",encoding="utf-8") as summary:
            summary.write("### Legends Quest evidence\n")
            summary.write("Pinned scripts: %s; stage values: %s; source TODO/guess comments: %s.\n" % (data["script_count"],len(data["distinct_stage_values"]),len(data["source_uncertainties"])))
            summary.write("Real disposable 377 engine smoke: %s.\n" % data["real_377_disposable_server_smoke"])
            summary.write("**FULL LEGENDS QUEST PLAYTHROUGH: NOT VERIFIED.**\n")
    if data["status"]!="SOURCE_PREFLIGHT_ONLY": raise ValueError("Source preflight failed")

if __name__=="__main__":
    try:main()
    except (OSError,ValueError,RuntimeError,subprocess.CalledProcessError) as ex:
        print("Legends Quest source/cloud audit FAILED CLOSED:",ex,file=sys.stderr)
        sys.exit(1)
