#!/usr/bin/env bash
# Only for a disposable GitHub Actions runner. NEVER apply to a live JoshRS install.
set -euo pipefail
: "${RUNNER_TEMP:?missing runner temp}"
: "${GITHUB_WORKSPACE:?missing checkout}"
if [[ "${GITHUB_ACTIONS:-}" != "true" ]]; then echo "BLOCKED: disposable CI only" >&2; exit 2; fi
root="$RUNNER_TEMP/joshrs-fenkenstrain-377"
content="$root/content"
engine="$root/engine"
quest="$GITHUB_WORKSPACE/content-patches/rs377"
[[ "$content" == "$RUNNER_TEMP/joshrs-fenkenstrain-377/content" && -d "$content/.git" && -d "$engine/.git" ]] || { echo "BLOCKED: unrecognised workspace" >&2; exit 2; }
[[ "$(git -C "$content" rev-parse HEAD)" == "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50" ]] || { echo "BLOCKED: Content SHA drift" >&2; exit 2; }
[[ "$(git -C "$engine" rev-parse HEAD)" == "b5ac859b47915afb545e60e4c1208f25d43cb3fb" ]] || { echo "BLOCKED: Engine SHA drift" >&2; exit 2; }
for patch in "$quest/patches/0001-register-fenkenstrain-in-quests-rs2.patch" "$quest/patches/0002-move-fenk-varps-out-of-unpack.patch" "$quest/patches/0003-roavar-fenkenstrain-brain-menu.patch" "$quest/patches/0004-fenkenstrain-native-furnace.patch" "$quest/patches/0005-fenkenstrain-stairs-existing-handler.patch" "$quest/patches/0006-mortton-quest-persistence.patch" "$quest/patches/0007-mortton-native-tarromin-serum.patch"; do
  git -C "$content" apply --check "$patch"
done
for patch in "$quest/patches/0001-register-fenkenstrain-in-quests-rs2.patch" "$quest/patches/0002-move-fenk-varps-out-of-unpack.patch" "$quest/patches/0003-roavar-fenkenstrain-brain-menu.patch" "$quest/patches/0004-fenkenstrain-native-furnace.patch" "$quest/patches/0005-fenkenstrain-stairs-existing-handler.patch" "$quest/patches/0006-mortton-quest-persistence.patch" "$quest/patches/0007-mortton-native-tarromin-serum.patch"; do
  git -C "$content" apply "$patch"
done
dest="$content/scripts/quests/quest_fenkenstrain"
[[ ! -e "$dest" ]] || { echo "BLOCKED: pinned content already has a Fenkenstrain folder" >&2; exit 2; }
cp -R "$quest/scripts/quests/quest_fenkenstrain" "$dest"
# Only the reviewed, explicitly-allowlisted new dialogue files are installed
# into this throwaway content checkout. Refuse duplicate scripts or existing
# direct NPC handlers. The live Windows content directory is never accessed.
ghost_rel="scripts/areas/area_ahoy/scripts/ahoy_ghost_dialogue_377.rs2"
ghost_src="$quest/$ghost_rel"
ghost_dst="$content/$ghost_rel"
[[ -f "$ghost_src" && ! -e "$ghost_dst" ]] || { echo "BLOCKED: unexpected ghost dialogue overlay" >&2; exit 2; }
python3 - "$content" "$ghost_src" <<'PY'
import pathlib, re, sys
root, overlay = map(pathlib.Path, sys.argv[1:])
text = overlay.read_text()
keys = re.findall(r"(?m)^\[opnpc1,([a-z0-9_]+)\]$", text)
if len(keys) != 17 or len(set(keys)) != 17 or not all(x.startswith("ahoy_") for x in keys):
    raise SystemExit(f"BLOCKED: expected 17 distinct ahoy NPC triggers, found {len(keys)}")
for p in (root/"scripts").rglob("*.rs2"):
    source = p.read_text(errors="replace")
    for key in keys:
        if re.search(r"(?m)^\[opnpc1,"+re.escape(key)+r"\]", source) or re.search(r"(?m)^\[apnpc1,"+re.escape(key)+r"\]", source):
            raise SystemExit(f"BLOCKED: {key} already implemented in {p}")
print("NPC_OVERLAY_CLEAN: 17 exact unhandled Port Phasmatys NPCs")
PY
mkdir -p "$(dirname "$ghost_dst")"
cp "$ghost_src" "$ghost_dst"
# Add a first genuinely interactive Mort'ton quest slice; preserve all
# historical cache and existing 377 source. The `quest_mortton` config
# directory already exists in the pinned content; do not replace it.
for mort_rel in "scripts/quests/quest_mortton/configs/quest_mortton.varp" "scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2"; do
  src="$quest/$mort_rel"
  dst="$content/$mort_rel"
  [[ -f "$src" && ! -e "$dst" ]] || { echo "BLOCKED: unrecognised Mortton file: $mort_rel" >&2; exit 2; }
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
done
python - "$content" <<'PY'
import pathlib, sys, re
root=pathlib.Path(sys.argv[1])
scripts=root/'scripts'
varps=list(scripts.rglob('*.varp'))
for name in ('fenk_quest','fenk_flags'):
    found=[str(p.relative_to(root)) for p in varps if re.search(r'(?m)^\['+name+r'\]$',p.read_text(errors='replace'))]
    if len(found)!=1:
        raise SystemExit(f'BLOCKED: {name} defined in {len(found)} files: {found}')
for key in ('fenk_quest','fenk_flags'):
    text=(scripts/'quests/quest_fenkenstrain/configs/quest_fenkenstrain.varp').read_text()
    assert re.search(r'(?m)^\['+key+r'\]\s*scope=perm\s*transmit=yes',text),key
src=(scripts/'general/scripts/quests.rs2').read_text()
assert src.count('send_quest_progress_colour(questlist:creatureoffenkenstrain')==1
print('Disposable overlay verified: unique permanent varps, single quest-list registration')
PY
FENK_CONTENT="$content" FENK_QUEST_DIR="$dest" python3 -I "$quest/tools/check_fenk_symbols.py"
python3 -I "$quest/tools/check_fenk_map.py" --content "$content"
python3 -I "$quest/tools/check_morytania_batch.py" --content "$content"
echo "DISPOSABLE_FENKENSTRAIN_OVERLAY_READY"
