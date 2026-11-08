import importlib.util
import sys
from pathlib import Path


def load_audit_module():
    path = Path(__file__).resolve().parents[1] / "audit_npc_dialogue.py"
    spec = importlib.util.spec_from_file_location("audit_npc_dialogue", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["audit_npc_dialogue"] = mod
    spec.loader.exec_module(mod)
    return mod
