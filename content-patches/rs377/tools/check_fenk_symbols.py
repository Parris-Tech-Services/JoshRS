#!/usr/bin/env python3
"""Static symbol check for the Fenkenstrain rs2 drafts. Reads files as data only; executes nothing external."""
import os, re, sys, glob

C = os.environ.get("FENK_CONTENT", "/home/claude/lostcityrs/content")  # pinned LostCityRS/Content checkout
P = os.environ.get("FENK_QUEST_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts", "quests", "quest_fenkenstrain"))

def pack_names(name):
    out = set()
    for line in open(f"{C}/pack/{name}.pack", errors="ignore"):
        if "=" in line:
            out.add(line.strip().split("=", 1)[1])
    return out

npc, obj, varp, seq, synth, loc = (pack_names(n) for n in ("npc", "obj", "varp", "seq", "synth", "loc"))
try:
    varbit = pack_names("varbit")
except Exception:
    varbit = set()

# constants: every ^name = value in any .constant (existing + ours)
consts = set()
for f in glob.glob(f"{C}/scripts/**/*.constant", recursive=True) + glob.glob(f"{P}/configs/*.constant"):
    for m in re.finditer(r"^\^([A-Za-z0-9_]+)\s*=", open(f, errors="ignore").read(), re.M):
        consts.add(m.group(1))

# defined procs / labels / queues across all scripts + ours
defs = {"proc": set(), "label": set(), "queue": set()}
files = glob.glob(f"{C}/scripts/**/*.rs2", recursive=True) + glob.glob(f"{P}/scripts/*.rs2")
for f in files:
    for m in re.finditer(r"^\[(proc|label|queue),([A-Za-z0-9_]+)\]", open(f, errors="ignore").read(), re.M):
        defs[m.group(1)].add(m.group(2))

# varbits come from config files (unpacked cache + quest folders)
for f in glob.glob(f"{C}/scripts/**/*.varbit", recursive=True):
    for m in re.finditer(r"^\[([A-Za-z0-9_]+)\]", open(f, errors="ignore").read(), re.M):
        varbit.add(m.group(1))
# varps: pack + ours
varp |= {"fenk_quest", "fenk_flags"}

ql = open(f"{C}/scripts/interfaces/questlist.if", errors="ignore").read()
comps = set(re.findall(r"^\[([A-Za-z0-9_]+)\]", ql, re.M))

problems, checked = [], 0
def bad(f, ln, kind, name):
    problems.append(f"{os.path.basename(f)}:{ln}: unknown {kind} '{name}'")

for f in sorted(glob.glob(f"{P}/scripts/*.rs2")):
    text = open(f).read()
    # bracket balance (ignore text inside strings/comments)
    stripped = re.sub(r'"(?:[^"\\]|\\.)*"', '""', re.sub(r"//.*", "", text))
    for a, b in ("()", "{}"):
        if stripped.count(a) != stripped.count(b):
            problems.append(f"{os.path.basename(f)}: unbalanced {a}{b} ({stripped.count(a)} vs {stripped.count(b)})")
    for ln, raw in enumerate(text.splitlines(), 1):
        line = re.sub(r"//.*", "", raw)
        s = re.sub(r'"(?:[^"\\]|\\.)*"', '""', line)  # blank out string literals for symbol scans
        # triggers
        m = re.match(r"\[(opnpc\d|opnpcu|oploc\d|opheld\d),([A-Za-z0-9_]+)\]", s)
        if m:
            checked += 1
            if m.group(2) not in npc and m.group(2) not in loc and m.group(2) not in obj:
                bad(f, ln, "trigger target", m.group(2))
        for m in re.finditer(r"\^([A-Za-z0-9_]+)", s):
            checked += 1
            if m.group(1) not in consts:
                bad(f, ln, "constant", m.group(1))
        for m in re.finditer(r"%([A-Za-z0-9_]+)", s):
            checked += 1
            n = m.group(1)
            if n not in varp and n not in varbit:
                bad(f, ln, "varp/varbit", n)
        for m in re.finditer(r"~([A-Za-z0-9_]+)", s):
            checked += 1
            if m.group(1) not in defs["proc"]:
                bad(f, ln, "proc", m.group(1))
        for m in re.finditer(r"@([A-Za-z0-9_]+)", s):
            checked += 1
            if m.group(1) not in defs["label"]:
                bad(f, ln, "label", m.group(1))
        for m in re.finditer(r"queue\(([A-Za-z0-9_]+)", s):
            checked += 1
            if m.group(1) not in defs["queue"]:
                bad(f, ln, "queue", m.group(1))
        for m in re.finditer(r"questlist:([A-Za-z0-9_]+)", raw):
            checked += 1
            if m.group(1) not in comps:
                bad(f, ln, "questlist component", m.group(1))
        # item / npc / anim / sound identifiers in common call positions
        for m in re.finditer(r"(?:inv_add|inv_del|inv_total)\((?:inv|worn|bank),\s*([a-z_0-9]+)", s):
            checked += 1
            if m.group(1) not in obj:
                bad(f, ln, "obj", m.group(1))
        for m in re.finditer(r"(?:last_useitem\s*=\s*|case\s+)([a-z][a-z_0-9]*)\s*:", s):
            n = m.group(1)
            if n == "default":
                continue
            checked += 1
            if n not in obj and n not in npc:
                bad(f, ln, "case symbol", n)
        for m in re.finditer(r"anim\(([a-z_0-9]+),", s):
            checked += 1
            if m.group(1) not in seq:
                bad(f, ln, "seq", m.group(1))
        for m in re.finditer(r"sound_synth\(([a-z_0-9]+),", s):
            checked += 1
            if m.group(1) not in synth:
                bad(f, ln, "synth", m.group(1))
        for m in re.finditer(r"~objbox\(([a-z_0-9]+),", s):
            checked += 1
            if m.group(1) not in obj:
                bad(f, ln, "obj", m.group(1))

print(f"symbols checked: {checked}")
if problems:
    print(f"PROBLEMS ({len(problems)}):")
    print("\n".join(problems))
    sys.exit(1)
print("OK: no unknown symbols, brackets balanced")
