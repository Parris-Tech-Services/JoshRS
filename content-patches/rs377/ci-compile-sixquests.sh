#!/usr/bin/env bash
# Only for a disposable GitHub Actions runner. NEVER apply to a live JoshRS install.
# Combined quest-bundle CI: applies EVERY patch in content-patches/rs377/patches/ in numeric
# order (batch-quests 0001-00NN first, then the 1000N quest-bundle series) to the pinned
# disposable 377 content, overlays EVERY quest folder present in this branch, and verifies
# the combined result. This validates the real post-merge state of main: bundles that patch
# the same files (e.g. quests.rs2) must stack cleanly in numeric order.
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

# All patches, numeric order (ls | sort: 0001-00NN batch, then 10001+ bundles). Later
# patches depend on earlier ones (e.g. 0007's context includes 0001's fenk lines), so each
# patch is checked AND applied before the next is considered - never all against pristine.
mapfile -t patches < <(ls "$quest"/patches/*.patch | sort)
if [[ "${#patches[@]}" -eq 0 ]]; then echo "BLOCKED: no patches found" >&2; exit 2; fi
echo "Applying ${#patches[@]} patches in numeric order:"
for p in "${patches[@]}"; do echo "  $(basename "$p")"; done
for p in "${patches[@]}"; do
  git -C "$content" apply --check "$p"
  git -C "$content" apply "$p"
done

# Overlay every quest folder carried by this branch. Quest dirs that already exist upstream
# as config-only stubs merge via /. instead of nesting.
for src in "$quest"/scripts/quests/*/; do
  q=$(basename "$src")
  dest="$content/scripts/quests/$q"
  mkdir -p "$dest"
  cp -R "$src." "$dest/"
done

python - "$content" <<'PY'
import pathlib, sys, re
root=pathlib.Path(sys.argv[1])
scripts=root/'scripts'
varps=list(scripts.rglob('*.varp'))
# the four varps moved out of all.varp by patch 10002 + the JoshRS-owned RFD varp
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
# patch 10006 renamed the cache's RFD var (id 678) from 100intro to rfd_quest
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
# Swan Song belongs to the batch-quests bundle (JOSHRS_BATCH_QUESTS_NOTES.md): exactly one
# registration, from the batch patch series, never from the 1000N bundles.
assert src.count('questlist:swansong')==1
# questbundle2: four more quests (Mourning's End I, Wanted!, In Aid of the Myreque,
# Rum Deal) registered exactly once each. One Small Favour is owned by the batch
# bundle's batch3 series (patches 0020-0022), like Swan Song before it.
for comp in ('mourning','wanted','myreque_2','deal'):
    assert src.count(f'send_quest_progress_colour(questlist:{comp},')==1, comp
for v in ('%mourning_quest, ^mourning1_complete','%quest_wanted, ^wanted_complete',
          '%myreque_2_main_var, ^myreque2_complete','%deal_quest, ^deal_complete'):
    assert src.count(v)==1, v
# questbundle2 varps stay in all.varp (in-place scope=perm, batch-0006 pattern) so the
# batch bundle's Veliaf handler can reference %myreque_2_main_var independently.
av=(scripts/'_unpack/377/all.varp').read_text(errors='replace')
for name in ('mourning_quest','quest_wanted','myreque_2_main_var','deal_quest'):
    assert re.search(r'(?m)^\['+name+r'\]\nscope=perm\n',av), name
# the batch bundle's Veliaf handler carries the self-contained In Aid of the Myreque
# start branch (raw stages; no questbundle2 symbols).
vr=(scripts/'quests/quest_myreque/scripts/quest_route.rs2').read_text(errors='replace')
assert vr.count('%myreque_2_main_var')==4 and 'questlist:myreque_2' in vr
for q,need in (('quest_mourning','mourning1_journal.rs2'),('quest_wanted','wanted_npcs.rs2'),
               ('quest_myreque_2','myreque2_journal.rs2'),('quest_deal','deal_npcs.rs2')):
    assert (scripts/'quests'/q/'scripts'/need).is_file(), q
print('Disposable overlay verified: unique permanent varps, quest-list registrations, merged stubs intact')
PY
SIXQUEST_CONTENT="$content" \
SIXQUEST_EXTRA_SCRIPTS="$content/scripts/areas/area_lumbridge/scripts/cook.rs2:$content/scripts/areas/area_falador/scripts/sir_amik_varze.rs2:$content/scripts/quests/quest_grandtree/scripts/king_narnode.rs2:$content/scripts/quests/quest_myreque/scripts/quest_route.rs2" \
  python3 -I "$quest/tools/check_fivequest_symbols.py"
echo "DISPOSABLE_QUESTBUNDLE_OVERLAY_READY"
