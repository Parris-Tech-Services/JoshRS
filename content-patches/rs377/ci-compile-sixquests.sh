#!/usr/bin/env bash
# Only for a disposable GitHub Actions runner. NEVER apply to a live JoshRS install.
# Overlays the five-quest scaffold (RFD intro, Cabin Fever, Recruitment Drive,
# Mourning's End Part II, Monkey Madness) onto the pinned disposable 377 content and verifies
# it. Swan Song is owned by the batch-quests bundle on main (JOSHRS_BATCH_QUESTS_NOTES.md).
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
patches=(1001-register-five-quests-in-quests-rs2 1002-move-four-quest-varps-out-of-unpack 1003-rfd-extend-cook-dialogue 1004-rd-extend-sir-amik-dialogue 1005-mm-extend-narnode-dialogue 1006-rfd-claim-cache-varp)
for p in "${patches[@]}"; do
  git -C "$content" apply --check "$quest/patches/$p.patch"
done
for p in "${patches[@]}"; do
  git -C "$content" apply "$quest/patches/$p.patch"
done
# Overlay the five quest folders. Four already exist upstream as config-only stubs (a configs/*.loc
# file each); copy with /. so the overlay merges into them instead of nesting.
for q in quest_100 quest_fever quest_rd quest_mourning2 quest_mm; do
  dest="$content/scripts/quests/$q"
  mkdir -p "$dest"
  cp -R "$quest/scripts/quests/$q/." "$dest/"
done
python - "$content" <<'PY'
import pathlib, sys, re
root=pathlib.Path(sys.argv[1])
scripts=root/'scripts'
varps=list(scripts.rglob('*.varp'))
# the four varps moved out of all.varp by patch 1002 + the JoshRS-owned RFD varp
for name in ('fever_quest','recruitmentdrive','mourning_quest_part2','mm_main','rfd_quest'):
    found=[str(p.relative_to(root)) for p in varps if re.search(r'(?m)^\['+name+r'\]$',p.read_text(errors='replace'))]
    if len(found)!=1:
        raise SystemExit(f'BLOCKED: {name} defined in {len(found)} files: {found}')
    if 'all.varp' in found[0]:
        raise SystemExit(f'BLOCKED: {name} still defined in all.varp')
cfg={
 'quest_100':'rfd_quest','quest_fever':'fever_quest',
 'quest_rd':'recruitmentdrive','quest_mourning2':'mourning_quest_part2','quest_mm':'mm_main'}
for q,name in cfg.items():
    files=list((scripts/'quests'/q/'configs').glob('*.varp'))
    assert len(files)==1,(q,files)
    assert re.search(r'(?m)^\['+name+r'\]\s*scope=perm\s*transmit=yes',files[0].read_text(errors='replace')),(q,name)
# the four upstream .loc stubs must have survived the merge
for q in ('quest_100','quest_fever','quest_rd','quest_mourning2','quest_mm'):
    assert any((scripts/'quests'/q/'configs').glob('*.loc')), f'BLOCKED: {q} lost its upstream .loc'
# patch 1006 renamed the cache's RFD var (id 678) from 100intro to rfd_quest
packtext=(root/'pack/varp.pack').read_text()
assert '678=rfd_quest' in packtext and '100intro' not in packtext
vbtext=(scripts/'_unpack/377/all.varbit').read_text(errors='replace')
assert 'basevar=100intro' not in vbtext and vbtext.count('basevar=rfd_quest')==8
src=(scripts/'general/scripts/quests.rs2').read_text()
for comp in ('hundred_main','fever','rd','mourning2','mm'):
    assert src.count(f'send_quest_progress_colour(questlist:{comp},')==1, comp
for v in ('%fever_quest, ^fever_complete','%rd_main, ^rd_complete',
          '%mourning_quest_part2, ^mourning2_complete','%mm_main, ^mm_complete'):
    assert src.count(v)==1, v
assert 'rfd_quest, ^rfd_full_complete' in src  # colour only; QP deferred until chapters land
assert 'rfd_questpoints' not in src
assert 'questlist:swansong' not in src  # owned by the batch-quests bundle, not this one
print('Disposable overlay verified: unique permanent varps, quest-list registrations, merged stubs intact')
PY
SIXQUEST_CONTENT="$content" \
SIXQUEST_EXTRA_SCRIPTS="$content/scripts/areas/area_lumbridge/scripts/cook.rs2:$content/scripts/areas/area_falador/scripts/sir_amik_varze.rs2:$content/scripts/quests/quest_grandtree/scripts/king_narnode.rs2" \
  python3 -I "$quest/tools/check_fivequest_symbols.py"
echo "DISPOSABLE_SIXQUEST_OVERLAY_READY"
