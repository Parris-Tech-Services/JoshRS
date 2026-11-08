#!/usr/bin/env bash
# Only for a disposable GitHub Actions runner. NEVER apply to a live JoshRS install.
# Overlays the Fenkenstrain quest, the batch-2 quest bundles, the Morytania
# addendum and the batch-3 quest bundles onto the immutable pinned 377 content,
# applying patches 0001-0022 in numeric order.
set -euo pipefail
: "${RUNNER_TEMP:?missing runner temp}"
: "${GITHUB_WORKSPACE:?missing checkout}"
if [[ "${GITHUB_ACTIONS:-}" != "true" ]]; then echo "BLOCKED: disposable CI only" >&2; exit 2; fi
root="$RUNNER_TEMP/joshrs-batch-377"
content="$root/content"
engine="$root/engine"
quest="$GITHUB_WORKSPACE/content-patches/rs377"
[[ "$content" == "$RUNNER_TEMP/joshrs-batch-377/content" && -d "$content/.git" && -d "$engine/.git" ]] || { echo "BLOCKED: unrecognised workspace" >&2; exit 2; }
[[ "$(git -C "$content" rev-parse HEAD)" == "44eab09081ef0f6c5f3eaabd1897a588ad7d9e50" ]] || { echo "BLOCKED: Content SHA drift" >&2; exit 2; }
[[ "$(git -C "$engine" rev-parse HEAD)" == "b5ac859b47915afb545e60e4c1208f25d43cb3fb" ]] || { echo "BLOCKED: Engine SHA drift" >&2; exit 2; }

# Apply every patch in strict numeric order (0007 anchors on post-0001 state).
mapfile -t patches < <(ls "$quest"/patches/[0-9][0-9][0-9][0-9]-*.patch | sort)
[[ "${#patches[@]}" -eq 22 ]] || { echo "BLOCKED: expected 22 reviewed patches, found ${#patches[@]}" >&2; exit 2; }
# Check-and-apply per patch: later patches anchor on earlier patches' state
# (0007 anchors on the post-0001 quests.rs2), so a single upfront --check pass
# against the pristine tree would wrongly reject them.
for patch in "${patches[@]}"; do
  git -C "$content" apply --check "$patch"
  git -C "$content" apply "$patch"
done

# Copy every quest bundle; none may already exist in the pinned content.
for folder in quest_fenkenstrain quest_rag quest_soulbane quest_swansong quest_myreque quest_ics quest_mdaughter quest_hauntedmine quest_losttribe quest_makinghistory quest_handsand quest_feud quest_elid quest_osf quest_dwarfrock quest_tog quest_zogre quest_giantdwarf; do
  dest="$content/scripts/quests/$folder"
  [[ ! -e "$dest" ]] || { echo "BLOCKED: pinned content already has a $folder folder" >&2; exit 2; }
  cp -R "$quest/scripts/quests/$folder" "$dest"
done

# Morytania addendum: scoped original dialogues plus early Mort'ton stages.
# Only clone exact allowlisted text files into this disposable runner.
for rel in \
  "scripts/areas/area_ahoy/scripts/ahoy_ghost_dialogue_377.rs2" \
  "scripts/quests/quest_mortton/configs/quest_mortton.varp" \
  "scripts/quests/quest_mortton/scripts/joshrs_mortton_start.rs2"; do
  [[ -f "$quest/$rel" && ! -e "$content/$rel" ]] || { echo "BLOCKED: conflicting Morytania file: $rel" >&2; exit 2; }
  mkdir -p "$(dirname "$content/$rel")"
  cp "$quest/$rel" "$content/$rel"
done

python - "$content" <<'PY'
import pathlib, sys, re
root = pathlib.Path(sys.argv[1])
scripts = root / 'scripts'
varps = list(scripts.rglob('*.varp'))

# Each quest-owned varp must be defined in exactly one file, permanent scope.
owned = {
    'quest_fenkenstrain': ['fenk_quest', 'fenk_flags'],
    'quest_ics': ['ics_little_stage'],
    'quest_rag': ['rag_bones_a', 'rag_bones_b'],
    'quest_soulbane': ['soulbane_mask'],
}
for folder, names in owned.items():
    for name in names:
        found = [str(p.relative_to(root)) for p in varps if re.search(r'(?m)^\[' + name + r'\]$', p.read_text(errors='replace'))]
        if len(found) != 1:
            raise SystemExit(f'BLOCKED: {name} defined in {len(found)} files: {found}')
        text = (scripts / 'quests' / folder / 'configs').glob('*.varp')
        body = ''.join(p.read_text(errors='replace') for p in text)
        assert re.search(r'(?m)^\[' + name + r'\]\s*scope=perm', body), name

# The all.varp blocks promoted to permanent by 0006 must be unique and permanent.
allvarp = (scripts / '_unpack/377/all.varp').read_text(errors='replace')
for name in ('hauntedmine', 'routequest', 'mdaughter_var', 'lost_tribe', 'soulbane', 'swansong_quest', 'makinghistory', 'handsand', 'main_feud_var', 'feud_var_multi', 'elid_main', 'rag_bone_2', 'onefavour', 'dwarfrock_main', 'tog_minigame', 'zombie_ogre', 'giantdwarf_main'):
    blocks = re.findall(r'(?m)^\[' + name + r'\]\s*\n[^\[]*', allvarp)
    if len(blocks) != 1 or 'scope=perm' not in blocks[0]:
        raise SystemExit(f'BLOCKED: {name} not a single permanent block in all.varp')

# 0008 renames must be in place and the placeholder ids must be gone (keeps
# varp.dat byte-identical so the client CRC check still passes).
pack = (root / 'pack/varp.pack').read_text(errors='replace')
for line in ('713=soulbane_mask', '715=rag_bones_a', '717=rag_bones_b', '724=ics_little_stage'):
    assert re.search(r'(?m)^' + re.escape(line) + r'$', pack), line
for bad in ('713=varp_713', '715=varp_715', '717=varp_717', '724=varp_724'):
    assert bad not in pack, bad

# Every batch quest is registered in the quest list exactly once.
src = (scripts / 'general/scripts/quests.rs2').read_text()
for key in ('creatureoffenkenstrain', 'rag', 'soulbane', 'swansong', 'routequest',
            'ics_little', 'mdaughter', 'hauntedmine', 'lost_tribe', 'makinghistory', 'handsand', 'feud', 'elid',
            'onesmallfavour', 'dwarfrock', 'tog', 'zogre', 'giantdwarf'):
    assert src.count(f'send_quest_progress_colour(questlist:{key}') == 1, key
shop = (scripts / 'areas/area_draynor/scripts/fortunato.rs2').read_text()
assert 'openshop(wine_vinegar_merchant' in shop
assert '%rag_bonesack = 1' in src
assert '%rag_wine = 1' in shop
inv = (scripts / '_unpack/727/all.inv').read_text()
assert '[wine_vinegar_merchant]' in inv and 'stock2=rag_vinegar,500,10' in inv

print('Disposable overlay verified: unique permanent varps, renamed placeholders, quest-list registrations')
PY

FENK_CONTENT="$content" FENK_QUEST_DIR="$content/scripts/quests/quest_fenkenstrain" python3 -I "$quest/tools/check_fenk_symbols.py"
python3 -I "$quest/tools/check_fenk_map.py" --content "$content"
python3 -I "$quest/tools/check_morytania_batch.py" --content "$content"
echo "DISPOSABLE_BATCH_QUESTS_OVERLAY_READY"
