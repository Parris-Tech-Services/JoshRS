#!/usr/bin/env python3
"""Probe the pinned, throwaway RS377 Java CLIENT with Microsoft's UFO2 UIA.

Cloud-only. No game account, login, save, passwords, copyrighted screenshot
artifact or public game server. Starting the client is not playing a quest.
"""
from __future__ import annotations
import importlib.util
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import time
from hashlib import sha256

UFO_SHA = "eae3c0a8d168c47cb10df0652e293e092eda1078"
CLIENT_SHA = "327880f6de74b40c420705bc42e4b34284885087"

def sha_of_checkout(folder):
    return subprocess.check_output(
        ["git","-C",str(folder),"rev-parse","HEAD"],text=True
    ).strip()

def record(report):
    out = Path(os.environ.get("RUNNER_TEMP",".")) / "ufo2-java377-client-evidence.json"
    out.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    with open(os.environ.get("GITHUB_STEP_SUMMARY",str(out.parent / "summary.md")), "a", encoding="utf-8") as summary:
        summary.write("### UFO2 inspecting pinned Java revision-377 client\n\n")
        summary.write("- Client process/window: %s / %s\n" % (report["java_client_started"],report["ufo2_detected_java_client_window"]))
        summary.write("- Client window screenshot capture: %s\n" % report["client_window_capture_verified"])
        summary.write("- AI quest playthrough: **NOT EXECUTED**.\n")
        for b in report["blockers"]: summary.write("- Blocker: %s\n" % b)
    return report["status"] == "JAVA377_WINDOW_VISUALLY_OBSERVED"

def main():
    report = {
        "schema": "joshrs-ufo2-actual-java377-probe-v1",
        "status":"BLOCKED",
        "expected_ufo2_sha":UFO_SHA,
        "expected_client_sha":CLIENT_SHA,
        "source":"microsoft/UFO and LostCityRS/Client-Java",
        "java_client_started":False,
        "ufo2_detected_java_client_window":False,
        "client_window_capture_verified":False,
        "client_operational":False,
        "native_game_login_or_account_used":False,
        "legends_quest_playthrough_verified":False,
        "ufo2_llm_agent_executed":False,
        "blockers":[],
    }
    proc=None
    try:
        if platform.system()!="Windows" or os.environ.get("GITHUB_ACTIONS")!="true":
            raise RuntimeError("Disposable GitHub Windows machine only")
        home=Path(os.environ["GITHUB_WORKSPACE"])
        ufo=home/"microsoft-ufo"
        client=home/"client-377"
        if sha_of_checkout(ufo)!=UFO_SHA or sha_of_checkout(client)!=CLIENT_SHA:
            raise RuntimeError("UFO2 or 377 client provenance is not pinned")
        code=ufo/"ufo"/"automator"/"ui_control"/"inspector.py"
        spec=importlib.util.spec_from_file_location("ms_ufo2_inspector_rs377",code)
        module=importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        inspector=module.ControlInspectorFacade("uia")
        jars=sorted((client/"build"/"libs").glob("*.jar"))
        if len(jars)!=1: raise RuntimeError("Expected exactly one pinned Java client jar, got "+str(len(jars)))
        report["client_jar_sha256"]=sha256(jars[0].read_bytes()).hexdigest()
        # Client startup may be incomplete if no local 377 cache/update server exists.
        # Never auto-login, submit fake credentials, or access a family machine.
        proc=subprocess.Popen(
            ["java","-jar",str(jars[0]),"10","0","highmem","members","32"],
            cwd=client,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        report["java_client_started"]=True
        found=None
        for i in range(18):
            time.sleep(1)
            wins=inspector.get_desktop_windows(remove_empty=True)
            matches=[]
            for w in wins:
                try:
                    title=w.window_text()
                    if "RS2 user client" in title:
                        matches.append(w)
                except Exception:
                    pass
            if matches:
                found=matches[0]
                break
            if proc.poll() is not None:
                report["blockers"].append("Java client exited before a readable 377 window appeared")
                break
        if not found:
            report["blockers"].append("UFO2 could not detect any pinned 377 Java desktop window")
        else:
            report["ufo2_detected_java_client_window"]=True
            report["window_title"]=found.window_text()
            try:
                image=found.capture_as_image()
                if image is not None and image.width>100 and image.height>100:
                    report["image_width"]=image.width
                    report["image_height"]=image.height
                    report["client_window_capture_verified"]=True
                else:
                    report["blockers"].append("Client window exists but visual capture is blank/tiny")
            except Exception as ex:
                report["blockers"].append("Client screenshot unavailable: "+type(ex).__name__+": "+str(ex)[:150])
            # Can create and capture without successful cache and game login.
            report["client_operational"]=False
            report["blockers"].append(
                "A displayed client window is not evidence of a valid RuneScape cache, server login, or Legends Quest interaction"
            )
        if report["ufo2_detected_java_client_window"] and report["client_window_capture_verified"]:
            report["status"]="JAVA377_WINDOW_VISUALLY_OBSERVED"
    except Exception as ex:
        report["blockers"].append(type(ex).__name__+": "+str(ex)[:280])
    finally:
        if proc is not None:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except Exception:
                try:proc.kill()
                except Exception:pass
    if not record(report):
        sys.exit(1)
if __name__=="__main__":main()
