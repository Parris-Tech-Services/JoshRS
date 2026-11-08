#!/usr/bin/env python3
"""Disposable CI-only starting location for a real RuneScape 377 quest click.

This changes no saved player and gives no quest progress. It moves ONLY the
new HarnessProbe test character from tutorial island to beside Canifis's
pinned signpost, marks the tutorial complete for this CI fixture, and then
requires a normal authenticated 377 client to interact with the real sign.
Do not run against a personal game.
"""
import os
from pathlib import Path
import subprocess
import sys

PIN="b5ac859b47915afb545e60e4c1208f25d43cb3fb"
def main():
    root=Path(os.environ.get("RUNNER_TEMP","/")).resolve()
    if os.environ.get("GITHUB_ACTIONS")!="true":
        raise SystemExit("DISPOSABLE_CI_ONLY")
    engine=(root/"joshrs-377-build/engine").resolve(strict=True)
    if engine != root/"joshrs-377-build/engine":
        raise SystemExit("UNEXPECTED_DISPOSABLE_ENGINE")
    actual=subprocess.check_output(["git","-C",str(engine),"rev-parse","HEAD"],text=True).strip()
    if actual != PIN:
        raise SystemExit("ENGINE_PIN_DRIFT")
    file=engine/"src/engine/entity/PlayerLoading.ts"
    original=file.read_text()
    old="""            player.levels[PlayerStat.HITPOINTS] = 10;
            return player;"""
    new="""            player.levels[PlayerStat.HITPOINTS] = 10;
            // Isolated CI test fixture ONLY: normal client must still click
            // the real 377 Canifis signpost to gain any Fenkenstrain progress.
            if (process.env.RS377_FENK_SIGNPOST_PROBE === 'true' &&
                process.env.NODE_PROFILE === 'joshrs_ci_377' &&
                safeName === 'harnessprobe') {
                player.x = 3492;
                player.z = 3485;
                player.level = 0;
                // 281=tutorial in pinned varp.pack, ^tutorial_complete=1000.
                player.vars[281] = 1000;
            }
            return player;"""
    if original.count(old)!=1 or "RS377_FENK_SIGNPOST_PROBE" in original:
        raise SystemExit("UPSTREAM_PLAYER_LOADING_ANCHOR_MISMATCH")
    file.write_text(original.replace(old,new,1))
    print("FENK_DISPOSABLE_NEW_PLAYER_START_SET_CANIFIS: no quest state granted")
if __name__=="__main__":
    main()
