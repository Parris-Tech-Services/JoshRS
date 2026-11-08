# JoshRS revision-377 Barcrawl — automated QA evidence (8 November 2026)

## Purpose

Eliminate the misleading practice of calling **compiled** quest code a **completed** playthrough. All work here is **isolated/disposable**. Never point any tests at `main` (family world), TCP 52402, Elrothiro, Sylvie, personal saves or account databases.

### Implemented in this branch

1. The existing 377 native observer (`tools/rs377-bot-bench/engine-patch/src/web.ts`) publishes `questStages.barcrawl` from the *authenticated disposable bot's own persistent varp*. If its native definition cannot be resolved it reports `null`, never guesses progress.
2. `tools/rs377-barcrawl-qa/audit.py --content <disposable-native-content>` checks the pinned 377 source of **all ten pubs**, permanent varp, signed-card scroll, guard hand-in and outpost gate. It runs inside the existing disposable 377 compile workflow.
3. `tools/rs377-agent-manager/barcrawl-acceptance.mjs` checks strict observations: a fresh isolated Harness account, guard-issued card, ten individually observed signature bits 3–12, no skipped pub, full final hand-in with card removal, and persistence observed under a separate authenticated login session. It rejects missing observer state, family players, nonexistent varps, stale/replayed ticks and false completion.
4. Windows and Linux CI run seven regression scenarios, including deliberately misleading synthetic traces.

## Verification levels

- **Source contract:** The historical scripts contain the ten progress paths. This does not run a player or validate the downloaded Windows family world.
- **Acceptance fixtures:** The verifier detects false positives. Fixture tests are synthetic, explicitly *not* a live game test.
- **Full real bot playthrough:** **NOT YET VERIFIED**. Requires an authenticated disposable 377 account to use ordinary movement and NPC/dialogue packets through the existing RS-SDK/agent bridge, a verified route to every pub (including crossings/doors), and actual server-observed varp transitions through login, hand-in, disconnect, and fresh login. The current Windows Agent Manager supports only Idle/Explore and **must not be advertised as quest-capable**.

The native observer source patch is installed only in disposable CI by `377-native-compile.yml`; it does **not** change or remotely deploy anything to the existing Windows family world. The verifier deliberately outputs `trace_contract_passed_provenance_not_attested` instead of claiming that arbitrary local JSON demonstrates authenticated gameplay.

## Next code integration

Connect a real isolated-world controller (not a fabricated observer) to walk/interact with the Barbarian Guard, traverse the verified ten-pub route using normal 377 packets, buy the correct drinks, use the card, return to the guard, disconnect and relog. Feed snapshots and authenticated session lifecycle into the acceptance gate. Only promote the result to independently verified after the captured game and control traces agree.

Keep the scope separate from other unfinished exact-parity quests; do not rewrite or populate quest stages merely to satisfy this verifier.
