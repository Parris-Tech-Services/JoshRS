#!/usr/bin/env bash
# Only for a disposable GitHub Actions runner. NEVER apply to a live JoshRS install.
set -euo pipefail
: "${RUNNER_TEMP:?missing runner temp}"
: "${GITHUB_WORKSPACE:?missing checkout}"
if [[ "${GITHUB_ACTIONS:-}" != "true" ]]; then echo "BLOCKED: disposable CI only" >&2; exit 2; fi
root="$RUNNER_TEMP/joshrs-377-build"
content="$root/content"
engine="$root/engine"
quest="$GITHUB_WORKSPACE/content-patches/rs377"
[[ "$content" == "$RUNNER_TEMP/joshrs-377-build/content" && -d "$content/.git" && -d "$engine/.git" ]] || { echo "BLOCKED: unrecognised workspace" >&2; exit 2; }
[[ "$(git -C "$content" rev-parse HEAD)" == "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50" ]] || { echo "BLOCKED: Content SHA drift" >&2; exit 2; }
[[ "$(git -C "$engine" rev-parse HEAD)" == "b5ac859b47915afb545e60e4c1208f25d43cb3fb" ]] || { echo "BLOCKED: Engine SHA drift" >&2; exit 2; }
for patch in "$quest/patches/0001-register-fenkenstrain-in-quests-rs2.patch" "$quest/patches/0002-move-fenk-varps-out-of-unpack.patch" "$quest/patches/0003-roavar-fenkenstrain-brain-menu.patch" "$quest/patches/0004-fenkenstrain-native-furnace.patch" "$quest/patches/0005-fenkenstrain-stairs-existing-handler.patch"; do
  git -C "$content" apply --check "$patch"
done
for patch in "$quest/patches/0001-register-fenkenstrain-in-quests-rs2.patch" "$quest/patches/0002-move-fenk-varps-out-of-unpack.patch" "$quest/patches/0003-roavar-fenkenstrain-brain-menu.patch" "$quest/patches/0004-fenkenstrain-native-furnace.patch" "$quest/patches/0005-fenkenstrain-stairs-existing-handler.patch"; do
  git -C "$content" apply "$patch"
done
dest="$content/scripts/quests/quest_fenkenstrain"
[[ ! -e "$dest" ]] || { echo "BLOCKED: pinned content already has a Fenkenstrain folder" >&2; exit 2; }
cp -R "$quest/scripts/quests/quest_fenkenstrain" "$dest"
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
echo "DISPOSABLE_FENKENSTRAIN_OVERLAY_READY"
