#!/usr/bin/env python3
"""Probe real UFO2 model-directed Windows GUI control with local Ollama.

This script NEVER types into a window itself. A local LLM-driven UFO2 agent must
create the visible marker through the Notepad UI; an independent UIA observer
then reads back the exact value. GitHub Actions disposal and no family game data.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import time

UFO = "eae3c0a8d168c47cb10df0652e293e092eda1078"
MARKER = "JOSHRS_UFO2_MODEL_ACTION_PROVEN_20261108"

def report(payload):
    f=Path(os.environ.get("RUNNER_TEMP","."))/"ufo2-local-model-proof.json"
    f.write_text(json.dumps(payload, indent=2)+"\n",encoding="utf-8")
    print(json.dumps(payload,indent=2))
    summary=os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary,"a",encoding="utf-8") as out:
            out.write("## UFO2 locally model-directed GUI automation\n")
            out.write("- Result: **%s**\n" % payload["status"])
            out.write("- Agent subprocess exited %s; claimed completion never substitutes for independent text readback.\n" % payload.get("agent_returncode"))
            out.write("- Actual Notepad marker verified: **%s**\n" % payload["marker_verified"])
            out.write("- JoshRS/Legends Quest playthrough: **NOT TESTED**.\n")
            for failure in payload["blockers"]:
                out.write("- Blocker: %s\n" % failure)
    return payload["status"] == "UFO2_LOCAL_LLM_GUI_ACTION_VERIFIED"

def get_windows(marker):
    # The independent verifier runs in JoshRS' checkout, not the UFO repo.
    # Load Microsoft's pinned inspector by absolute path to avoid ambient
    # package import/working-directory assumptions.
    import importlib.util
    from pywinauto import Desktop
    pinned = Path(os.environ["GITHUB_WORKSPACE"]) / "microsoft-ufo"
    module_path = pinned / "ufo" / "automator" / "ui_control" / "inspector.py"
    spec = importlib.util.spec_from_file_location("ms_ufo2_real_ollama_verifier", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Pinned UFO2 native inspector cannot be loaded")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.ControlInspectorFacade("uia"), Desktop(backend="uia")

def get_marker_presence(inspector):
    found_window=False
    readbacks=[]
    for w in inspector.get_desktop_windows(remove_empty=True):
        try:
            if "notepad" not in w.window_text().lower():
                continue
        except Exception:
            continue
        found_window=True
        try:
            controls=inspector.find_control_elements_in_descendants(w,depth=7)
        except Exception:
            controls=[]
        for ctrl in controls:
            for name in ("get_value","window_text"):
                try:
                    value=getattr(ctrl,name)()
                    if isinstance(value,str) and MARKER in value:
                        return True,found_window,len(controls)
                except Exception:
                    pass
            try:
                value=ctrl.iface_value.CurrentValue
                if isinstance(value,str) and MARKER in value:
                    return True,found_window,len(controls)
            except Exception:
                pass
    return False,found_window,0

def main():
    state={
        "schema":"joshrs-ufo2-local-ollama-actual-agent-v1",
        "status":"BLOCKED",
        "microsoft_ufo_sha":UFO,
        "local_model":"qwen2.5:3b, expanded context",
        "model_key_needed":False,
        "windows":platform.system()=="Windows",
        "agent_process_launched":False,
        "agent_returncode":None,
        "marker_verified":False,
        "notepad_window_seen":False,
        "ufo2_full_host_app_agent_executed":False,
        "native_joshrs_client_targeted":False,
        "legends_quest_playthrough_verified":False,
        "blockers":[]
    }
    process=None
    try:
        if platform.system()!="Windows" or os.environ.get("GITHUB_ACTIONS")!="true":
            raise RuntimeError("Disposable Windows GitHub runner only")
        upstream=Path(os.environ["GITHUB_WORKSPACE"])/"microsoft-ufo"
        sha=subprocess.check_output(["git","-C",str(upstream),"rev-parse","HEAD"],text=True).strip()
        if sha!=UFO: raise RuntimeError("Unexpected UFO2 source revision")
        # Config goes into ephemeral runner checkout. NEVER commit a key or
        # user profile. Ollama API stays localhost and needs no credentials.
        import yaml
        cfg=upstream/"config"/"ufo"/"agents.yaml.template"
        agents=yaml.safe_load(cfg.read_text(encoding="utf-8"))
        for role in ("HOST_AGENT","APP_AGENT","BACKUP_AGENT","EVALUATION_AGENT"):
            if role not in agents:continue
            agents[role].update({
                "API_TYPE":"ollama","API_BASE":"http://127.0.0.1:11434",
                "API_KEY":"ollama","API_MODEL":"joshrs-ufo2-3b",
                "VISUAL_MODE":False
            })
        (upstream/"config"/"ufo"/"agents.yaml").write_text(
            yaml.safe_dump(agents,sort_keys=False),encoding="utf-8"
        )
        scfg=upstream/"config"/"ufo"/"system.yaml"
        system=yaml.safe_load(scfg.read_text(encoding="utf-8"))
        system.update({"MAX_STEP":4,"MAX_ROUND":1,"MAX_RETRY":1,"MAX_TOKENS":600,
                       "TIMEOUT":180,"SAFE_GUARD":True,"USE_MCP":False,
                       "ASK_QUESTION":False,"RAG_EXPERIENCE":False,
                       "ENABLED_THIRD_PARTY_AGENTS":[],"CONTROL_BACKEND":["uia"],
                       "SAVE_FULL_SCREEN":False,"SAVE_UI_TREE":False})
        scfg.write_text(yaml.safe_dump(system,sort_keys=False),encoding="utf-8")
        import requests
        resp=requests.get("http://127.0.0.1:11434/api/tags",timeout=10)
        resp.raise_for_status()
        if not any(m.get("name")=="joshrs-ufo2-3b:latest" for m in resp.json().get("models",[])):
            raise RuntimeError("Local Ollama model has not been pulled/created")
        process=subprocess.Popen(["notepad.exe"],creationflags=subprocess.CREATE_NO_WINDOW)
        time.sleep(3)
        inspector,desktop=get_windows(MARKER)
        _,window,_=get_marker_presence(inspector)
        if not window:raise RuntimeError("Notepad invisible in Windows user session")
        task=("Use the open Notepad window. Type exactly the following "
              "single line in its text editing area, with no quotes: "+MARKER+
              ". Do not use any shell commands, files, or web browsers. "
              "When text is visible, stop.")
        command=[sys.executable,"-m","ufo","--task","joshrs_ufo2_local_model_smoke","-r",task]
        state["agent_process_launched"]=True
        execution=subprocess.run(
            command,cwd=upstream,capture_output=True,text=True,
            timeout=900,check=False,env={**os.environ,"PYTHONPATH":str(upstream)}
        )
        state["agent_returncode"]=execution.returncode
        state["ufo2_full_host_app_agent_executed"]=execution.returncode==0
        # No model messages, private paths, huge LLM traces or screenshots
        # exported. Only error class and bounded sanitized signs.
        if execution.returncode!=0:
            lines=(execution.stderr or execution.stdout or "").splitlines()
            state["agent_last_error_excerpt"]=" | ".join(lines[-4:])[:450]
        # An ordinary return code is NEVER enough. The inspector must read
        # back the exact marker from the actual Notepad UIA control.
        try:
            state["marker_verified"],state["notepad_window_seen"],state["observed_uia_controls"]=get_marker_presence(inspector)
        except Exception as ex:
            state["blockers"].append("Independent verification failed: "+type(ex).__name__)
        if state["marker_verified"]:
            state["status"]="UFO2_LOCAL_LLM_GUI_ACTION_VERIFIED"
        else:
            state["blockers"].append("UFO2 did not produce independently observed marker; full agent NOT certified")
    except subprocess.TimeoutExpired:
        state["blockers"].append("UFO2 task exceeded bounded 900s local-model test; no completion")
    except Exception as ex:
        state["blockers"].append(type(ex).__name__+": "+str(ex)[:270])
    finally:
        if process:
            try:process.terminate();process.wait(timeout=5)
            except Exception:
                try:process.kill()
                except Exception:pass
    if not report(state):sys.exit(1)

if __name__=="__main__":main()
