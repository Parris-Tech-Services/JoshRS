#!/usr/bin/env python3
"""UFO2 Windows desktop capability probe (no credentials, no JoshRS saves).

Runs exclusively on a disposable Windows CI runner. Imports Microsoft's REAL
UFO2 UI Automation inspector, opens Notepad, and attempts a real GUI/UIA action.
An empty/locked Session 0 must fail closed. No claim of RuneScape playthrough.
"""
from __future__ import annotations
import json
import os
import platform
from pathlib import Path
import subprocess
import sys
import time

def run():
    data = {
        "schema": "joshrs-ufo2-windows-capability-v1",
        "purpose": "Can UFO2 access and operate a real Windows desktop window on GitHub hosted runner?",
        "repository": "microsoft/UFO",
        "target": "disposable Notepad only; NOT a JoshRS client",
        "windows": platform.system() == "Windows",
        "ufo2_imported": False,
        "desktop_windows_visible": False,
        "notepad_window_detected": False,
        "notepad_ui_action_confirmed": False,
        "ufo2_llm_agent_executed": False,
        "legends_quest_playthrough_verified": False,
        "blockers": [],
        "status": "BLOCKED",
    }
    if platform.system() != "Windows":
        data["blockers"].append("Requires Windows 10+.")
        return data
    try:
        import ctypes
        data["desktop_metrics"] = {
            "width": ctypes.windll.user32.GetSystemMetrics(0),
            "height": ctypes.windll.user32.GetSystemMetrics(1)
        }
        from pywinauto import Desktop
        from pywinauto.keyboard import send_keys
        # Load the exact UFO2 inspector source module directly. Its package-wide
        # __init__ eagerly loads other agent services and LLM libraries that
        # are not needed for this *UIA capability* test.
        import importlib.util
        import subprocess
        repo = Path(os.environ["PYTHONPATH"]).resolve(strict=True)
        actual = subprocess.check_output(["git", "-C", str(repo), "rev-parse", "HEAD"], text=True).strip()
        expected = "eae3c0a8d168c47cb10df0652e293e092eda1078"
        if actual != expected:
            raise RuntimeError("UFO2 pinned SHA mismatch; refusing unsafe source")
        module_path = repo / "ufo" / "automator" / "ui_control" / "inspector.py"
        spec = importlib.util.spec_from_file_location("ms_ufo2_uia_inspector", module_path)
        if spec is None or spec.loader is None:
            raise RuntimeError("Microsoft UFO2 UIA module spec missing")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        ControlInspectorFacade = module.ControlInspectorFacade
        data["ufo2_source_commit"] = actual
        data["ufo2_imported"] = True
    except Exception as ex:
        data["blockers"].append("Import of real UFO2 UIA inspector failed: "+type(ex).__name__+": "+str(ex)[:200])
        return data
    proc = None
    marker = "JOSHRS_UFO2_DISPOSABLE_WINDOW_CHECK_20261108"
    try:
        proc = subprocess.Popen(["notepad.exe"], close_fds=True)
        inspector = ControlInspectorFacade(backend="uia")
        found = None
        for attempt in range(16):
            time.sleep(1)
            try:
                windows = inspector.get_desktop_windows(remove_empty=True)
                data["visible_window_count"] = len(windows)
                data["desktop_windows_visible"] = bool(windows)
                candidates = []
                for w in windows:
                    try:
                        name = w.window_text()
                        if "notepad" in name.lower() or "untitled" in name.lower():
                            candidates.append(w)
                    except Exception:
                        pass
                if candidates:
                    found = candidates[0]
                    break
            except Exception as ex:
                if attempt == 15:
                    data["blockers"].append("UFO2 desktop inspection refused: "+type(ex).__name__+": "+str(ex)[:200])
        data["notepad_window_detected"] = bool(found)
        if not found:
            data["blockers"].append("No Notepad window visible to UFO2 UIA, likely non-interactive cloud service desktop.")
            return data
        try:
            data["notepad_title"] = found.window_text()[:100]
            try:
                child_controls = inspector.find_control_elements_in_descendants(
                    found, control_type_list=["Edit", "Document"], depth=5,
                )
                data["notepad_uia_edit_controls"] = len(child_controls)
            except Exception as ex:
                data["notepad_control_detection_note"] = type(ex).__name__+": "+str(ex)[:150]
                child_controls = []
            found.set_focus()
            # Notepad is a synthetic blank file on the throwaway runner.
            send_keys(marker, pause=0.04)
            time.sleep(1.5)
            seen = False
            for element in child_controls:
                try:
                    text = element.window_text()
                    if marker in text:
                        seen = True
                        break
                except Exception:
                    continue
            # If Notepad uses a custom canvas, test the message text through UIA's
            # Document/Edit value patterns; no screenshot OCR or fabricated pass.
            if not seen:
                try:
                    all_controls = inspector.find_control_elements_in_descendants(found, depth=7)
                    for element in all_controls:
                        try:
                            if marker in element.window_text():
                                seen = True
                                break
                        except Exception:
                            pass
                except Exception:
                    pass
            # The screen-input route above may be suppressed in a service
            # desktop. Also use Notepad's native UIA ValuePattern, the part
            # of UFO2 specifically meant to avoid fragile coordinate clicks.
            # Still require an independently read-back exact marker.
            actions = ["keyboard_send_keys"]
            for element in child_controls:
                if seen:
                    break
                for operation in ("get_value", "window_text"):
                    try:
                        value = getattr(element, operation)()
                        if isinstance(value, str) and marker in value:
                            seen = True
                            break
                    except Exception:
                        pass
                if seen:
                    break
                for action in ("set_edit_text", "iface_value"):
                    try:
                        if action == "set_edit_text":
                            element.set_edit_text(marker)
                            actions.append("uia_set_edit_text")
                        elif getattr(element, "iface_value", None) is not None:
                            element.iface_value.SetValue(marker)
                            actions.append("uia_valuepattern_setvalue")
                        else:
                            continue
                        time.sleep(1)
                        getter = getattr(element, "get_value", None)
                        actual = getter() if callable(getter) else ""
                        if not actual:
                            try:
                                actual = element.iface_value.CurrentValue
                            except Exception:
                                pass
                        if isinstance(actual, str) and marker in actual:
                            seen = True
                            break
                    except Exception as ex:
                        data["native_control_note"] = type(ex).__name__ + ": " + str(ex)[:120]
                if seen:
                    break
            data["input_methods_attempted"] = actions
            data["notepad_ui_action_confirmed"] = seen
            if not seen:
                data["blockers"].append("Notepad UIA Edit detected; typed and ValuePattern inputs were not independently readable.")
            else:
                data["status"] = "UFO2_UIA_DESKTOP_ACTION_VERIFIED"
        except Exception as ex:
            data["blockers"].append("Desktop input/verification failed: "+type(ex).__name__+": "+str(ex)[:240])
    finally:
        if proc is not None:
            try:
                proc.terminate()
                proc.wait(timeout=8)
            except Exception:
                try: proc.kill()
                except Exception: pass
    return data

def main():
    result = run()
    report = Path(os.environ.get("RUNNER_TEMP", ".")) / "ufo2-windows-capability.json"
    report.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as out:
            out.write("## UFO2 Windows desktop control\n\n")
            out.write(f"- **Result:** {result['status']}\n")
            out.write(f"- Microsoft UFO2 inspector imported: {result['ufo2_imported']}\n")
            out.write(f"- Desktop windows visible: {result['desktop_windows_visible']}\n")
            out.write(f"- Notepad UI action confirmed: {result['notepad_ui_action_confirmed']}\n")
            out.write("- **Full AI model UFO2 action and Legends' Quest: NOT EXECUTED.**\n")
            for blocker in result["blockers"]:
                out.write(f"- Blocker: {blocker}\n")
    # Fail if real UFO2 UI action could not be confirmed, not because a model is
    # unconfigured. API credentials must never be invented or committed to repo.
    if result["status"] != "UFO2_UIA_DESKTOP_ACTION_VERIFIED":
        sys.exit(1)

if __name__ == "__main__":
    main()
