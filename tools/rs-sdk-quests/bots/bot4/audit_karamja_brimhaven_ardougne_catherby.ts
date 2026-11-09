import { runScript } from '../../sdk/runner';
import { appendFileSync } from 'fs';

interface AuditFinding {
  region: string;
  coords: string;
  objectName: string;
  objectId: number;
  action: string;
  expected: string;
  actual: string;
  severity: 'Blocks progress' | 'Cosmetic' | 'Working as expected (verified)';
}

await runScript(async ({ bot, sdk }) => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const testedKeys = new Set<string>();

  const clearAllUI = async () => {
    for (let i = 0; i < 8; i++) {
      const st = sdk.getState();
      if (st?.interface?.isOpen) {
        await bot.closeInterface();
        await sleep(250);
      }
      if (st?.dialog?.isOpen) {
        const opts = st.dialog.options ?? [];
        const targetOpt = opts.find((o: any) => /yes|ok|continue|cancel|nevermind|nothing/i.test(o.text));
        const idx = targetOpt ? targetOpt.index : (opts[0]?.index ?? 0);
        await sdk.sendClickDialog(idx);
        await sleep(350);
      } else {
        break;
      }
    }
  };

  const interactFast = async (loc: any, pattern: RegExp, timeoutMs = 4500) => {
    return Promise.race([
      bot.interactLoc(loc, pattern),
      sleep(timeoutMs).then(() => ({ success: false, message: `Timed out after ${timeoutMs}ms` })),
    ]);
  };

  const ensureSurfaceL0 = async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const p = sdk.getState()?.player;
      if (!p) break;
      await clearAllUI();
      const scanned = await sdk.scanNearbyLocs(12);

      // Check if we are in a ship hold on L0 (where Ship's ladder Climb-up is nearby at x=2958,z=3141)
      if (p.level === 0 && p.worldX >= 2950 && p.worldX <= 2964 && p.worldZ >= 3138 && p.worldZ <= 3144) {
        const shipsLadderUp = scanned.find(
          (l: any) => /ship's ladder/i.test(l.name) && l.x === 2958 && (l.options ?? []).some((o: string) => /climb-?up/i.test(o))
        ) ?? scanned.find(
          (l: any) => /ship's ladder/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?up/i.test(o))
        );
        if (shipsLadderUp) {
          await interactFast(shipsLadderUp, /climb-?up/i, 5000);
          await sleep(1200);
          continue;
        }
      }

      if (p.level === 0 && p.worldZ < 6000) break;

      if (p.worldZ >= 6000) {
        const upLoc = scanned.find(
          (l: any) => /ladder|staircase|stairs|trapdoor/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?up|walk-?up|climb/i.test(o))
        );
        if (upLoc) {
          const opt = (upLoc.options ?? []).find((o: string) => /climb-?up|walk-?up|climb/i.test(o)) ?? 'Climb-up';
          await interactFast(upLoc, new RegExp(opt, 'i'), 5000);
          await sleep(1000);
          continue;
        }
      }
      if (p.level > 0) {
        const plank = scanned.find((l: any) => /gangplank/i.test(l.name));
        if (plank) {
          await interactFast(plank, /cross/i, 5000);
          await sleep(1200);
          continue;
        }
        const downLoc = scanned.find(
          (l: any) => /ladder|staircase|stairs/i.test(l.name) && !/ship's ladder/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down|walk-?down|climb/i.test(o))
        );
        if (downLoc) {
          const opt = (downLoc.options ?? []).find((o: string) => /climb-?down|walk-?down|climb/i.test(o)) ?? 'Climb-down';
          await interactFast(downLoc, new RegExp(opt, 'i'), 5000);
          await sleep(1000);
          continue;
        }
      }
      break;
    }
  };

  const auditRegion = async (
    regionName: string,
    waypoints: [number, number, string][],
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
    allowMultiPlane = false
  ) => {
    const findings: AuditFinding[] = [];
    const logFinding = (f: AuditFinding) => {
      findings.push(f);
      console.log(`[AUDIT] [${f.severity}] ${f.region} ${f.coords} | ${f.objectName} (id=${f.objectId}) [${f.action}] -> ${f.actual}`);
    };

    const testLocOption = async (loc: any, optText: string, expectedDesc: string) => {
      const isUniqueCoordTarget = /door|gate|ladder|stair|trapdoor|stile|chest|cupboard|coffin|altar|furnace|anvil|range|sink|fountain|hopper|bin|wheel|winch|lever/i.test(loc.name);
      const key = isUniqueCoordTarget
        ? `${sdk.getState()?.player?.level ?? 0}:${loc.x},${loc.z}:${loc.id}:${optText}`
        : `${regionName}:id=${loc.id}:${optText}`;
      if (testedKeys.has(key)) return;
      testedKeys.add(key);

      await clearAllUI();
      const stateBefore = sdk.getState();
      const pBefore = stateBefore?.player;
      const rejBefore = stateBefore?.opFeedback?.opRejectedCount ?? 0;
      const msgIdBefore = Math.max(0, ...(stateBefore?.gameMessages ?? []).map((m: any) => m.observationId ?? 0));
      const dialogCountBefore = (stateBefore?.recentDialogs ?? []).length;

      const res = await interactFast(loc, new RegExp(`^${optText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
      await sleep(600);
      await clearAllUI();

      const stateAfter = sdk.getState();
      const pAfter = stateAfter?.player;
      const rejAfter = stateAfter?.opFeedback?.opRejectedCount ?? 0;
      const newMsgs = (stateAfter?.gameMessages ?? [])
        .filter((m: any) => (m.observationId ?? 0) > msgIdBefore)
        .map((m: any) => m.text.trim());
      const newDialogs = (stateAfter?.recentDialogs ?? []).slice(dialogCountBefore).flatMap((d: any) => d.text ?? []);
      const locStillSame = (stateAfter?.nearbyLocs ?? []).some((l: any) => l.x === loc.x && l.z === loc.z && l.id === loc.id);
      const movedFloor = pBefore && pAfter && (pBefore.level !== pAfter.level || Math.abs(pBefore.worldZ - pAfter.worldZ) > 100);

      const coordsStr = `(${loc.x}, ${loc.z}, L${pBefore?.level ?? 0})`;
      const combinedFeedback = [...newMsgs, ...newDialogs].join(' | ');
      const stateChanged = !locStillSame || movedFloor || combinedFeedback.length > 0;

      if ((!res.success && !stateChanged) || rejAfter > rejBefore || /nothing interesting happens|can't reach/i.test(combinedFeedback)) {
        const actualStr = `success=${res.success} (${res.message || 'no msg'}), opRejectedDelta=${rejAfter - rejBefore}, messages="${combinedFeedback || 'none'}", locUnchanged=${locStillSame}`;
        const blocks = /door|gate|ladder|stair|stile/i.test(loc.name) && !movedFloor && locStillSame;
        logFinding({
          region: regionName,
          coords: coordsStr,
          objectName: loc.name,
          objectId: loc.id,
          action: optText,
          expected: expectedDesc,
          actual: actualStr,
          severity: blocks ? 'Blocks progress' : 'Cosmetic',
        });
      } else {
        logFinding({
          region: regionName,
          coords: coordsStr,
          objectName: loc.name,
          objectId: loc.id,
          action: optText,
          expected: expectedDesc,
          actual: `OK: ${res.message}${!locStillSame ? ' (loc state changed)' : ''}${combinedFeedback ? ` | "${combinedFeedback}"` : ''}${movedFloor ? ` | moved to (${pAfter?.worldX}, ${pAfter?.worldZ}, L${pAfter?.level})` : ''}`,
          severity: 'Working as expected (verified)',
        });
      }

      if (!allowMultiPlane && movedFloor) {
        await ensureSurfaceL0();
      }
    };

    for (const [wx, wz, label] of waypoints) {
      await clearAllUI();
      if (!allowMultiPlane) {
        await ensureSurfaceL0();
      }
      const w = await bot.walkTo(wx, wz, 3);
      if (!w.success) {
        logFinding({
          region: regionName,
          coords: `(${wx}, ${wz}, L${sdk.getState()?.player?.level ?? 0})`,
          objectName: `Waypoint: ${label}`,
          objectId: -1,
          action: 'Walk',
          expected: `Walk to ${label} at (${wx}, ${wz})`,
          actual: `walkTo failed: ${w.message}`,
          severity: 'Blocks progress',
        });
        continue;
      }

      const locs = await sdk.scanNearbyLocs(9);
      for (const loc of locs) {
        if (loc.x < bounds.minX || loc.x > bounds.maxX || loc.z < bounds.minZ || loc.z > bounds.maxZ) continue;
        if (/tree|oak|willow|yew|plant|cactus|gangplank|ladder|staircase|stairs|trapdoor/i.test(loc.name)) continue;
        for (const opt of loc.options ?? []) {
          if (!opt || /^examine$/i.test(opt)) continue;
          if (/^close$/i.test(opt) && /door|gate/i.test(loc.name)) continue;
          if (/climb|cross|walk-down|walk-up|chop|pick-lock/i.test(opt)) continue;
          await testLocOption(loc, opt, `Interact "${opt}" with ${loc.name} at (${loc.x}, ${loc.z})`);
        }
      }
    }

    const brokenOrCosmetic = findings.filter((f) => f.severity !== 'Working as expected (verified)');
    const working = findings.filter((f) => f.severity === 'Working as expected (verified)');

    const lines: string[] = [
      '',
      `### Region Completed: ${regionName} — ${new Date().toISOString()}`,
      `- **Total Interactions Audited**: ${findings.length} (${working.length} verified working, ${brokenOrCosmetic.length} anomalous/unimplemented)`,
      '',
      '#### Anomalies / Missing Handlers / Unreachable Findings',
    ];

    if (brokenOrCosmetic.length === 0) {
      lines.push(`- None — all tested interactions in ${regionName} succeeded.`);
    } else {
      for (const f of brokenOrCosmetic) {
        lines.push(
          `- **Coordinates & Region**: \`${f.coords}\` — ${f.region}`,
          `  - **Object & Action**: \`${f.objectName}\` (id \`${f.objectId}\`) — action \`${f.action}\``,
          `  - **Expected vs Actual**: Expected: ${f.expected}. Actual: ${f.actual}`,
          `  - **Impact**: **${f.severity}**`
        );
      }
    }

    lines.push('', '#### Verified Working Interactions (Summary)');
    for (const f of working) {
      lines.push(`- \`${f.coords}\` **${f.objectName}** (id \`${f.objectId}\`) [\`${f.action}\`] -> ${f.actual}`);
    }
    lines.push('');

    appendFileSync('bots/bot4/lab_log.md', lines.join('\n'));
    console.log(`[AUDIT] Appended ${findings.length} findings for ${regionName} to bots/bot4/lab_log.md`);
  };

  // Step 1: Climb out of the ship hold (L0) -> ship deck (L1) -> cross Gangplank onto Karamja dock (L0)
  await ensureSurfaceL0();
  console.log(`[AUDIT] Position after ensureSurfaceL0: (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  if ((sdk.getState()?.player?.worldX ?? 3029) < 2970) {
    // Region 26: Karamja — Musa Point Docks, Banana Plantation & Luthas's House (m45_49 & m45_48)
    await auditRegion(
      "Karamja — Musa Point, Banana Plantation & Luthas's House (m45_49 & m45_48)",
      [
        [2956, 3146, 'Musa Point Docks & Customs'],
        [2938, 3154, "Luthas's House & Banana Crate"],
        [2916, 3162, 'Karamja Banana Plantation & Rum Store'],
        [2860, 3168, 'Karamja Volcano Rim'],
      ],
      { minX: 2845, maxX: 2965, minZ: 3135, maxZ: 3185 },
      false
    );

    // Pick bananas if low HP on Karamja before walking to Brimhaven
    if ((sdk.getState()?.player?.hp ?? 10) < 8) {
      await bot.walkTo(2916, 3162, 3);
      for (let i = 0; i < 6; i++) {
        const bTree = sdk.findNearbyLoc(/banana tree/i);
        if (bTree) {
          await interactFast(bTree, /pick/i, 4000);
          await sleep(600);
        }
        const banana = sdk.findInventoryItem(/banana/i);
        if (banana && (sdk.getState()?.player?.hp ?? 10) < 10) {
          await bot.eatFood(banana);
          await sleep(600);
        }
      }
    }

    // Region 27: Brimhaven Town, Docks, Pub & Shrine (m43_49 & m43_50)
    await auditRegion(
      'Brimhaven Town, Docks, Pub & Shrine (m43_49 & m43_50)',
      [
        [2802, 3182, 'Brimhaven East Gate / Jungle Border'],
        [2794, 3179, 'Brimhaven Dead Man Chest Pub'],
        [2772, 3185, 'Brimhaven Town Center & Shops'],
        [2772, 3227, 'Brimhaven North Docks (Captain Barnaby)'],
      ],
      { minX: 2750, maxX: 2815, minZ: 3155, maxZ: 3238 },
      false
    );

    // Ensure Coins >= 30 in Brimhaven if needed
    if ((sdk.findInventoryItem(/coins/i)?.count ?? 0) < 30) {
      await bot.walkTo(2794, 3179, 4);
      for (let attempt = 0; attempt < 25; attempt++) {
        if ((sdk.findInventoryItem(/coins/i)?.count ?? 0) >= 32) break;
        const banana = sdk.findInventoryItem(/banana/i);
        if (banana && (sdk.getState()?.player?.hp ?? 10) < 8) {
          await bot.eatFood(banana);
          await sleep(600);
        }
        if ((sdk.getState()?.player?.hp ?? 10) <= 2) break;
        const man = sdk.findNearbyNpc(/^(man|woman)$/i);
        if (man) {
          await bot.pickpocketNpc(man);
          await sleep(1000);
        } else {
          await bot.walkTo(2772, 3185, 4);
        }
      }
    }

    // Sail from Brimhaven (2772, 3227) to East Ardougne (2683, 3271) via Captain Barnaby
    await clearAllUI();
    await bot.walkTo(2772, 3227, 2);
    const barnaby = sdk.findNearbyNpc(/captain barnaby/i);
    if (barnaby) {
      const hasPayFare = (barnaby.options ?? []).some((o: string) => /pay-fare/i.test(o));
      if (hasPayFare) {
        await bot.interactNpc(barnaby, /pay-fare/i);
      } else {
        await bot.talkTo(barnaby);
      }
      for (let i = 0; i < 16; i++) {
        await sleep(600);
        const d = sdk.getDialog();
        if (!d?.isOpen) {
          if ((sdk.getState()?.player?.worldZ ?? 3227) > 3260) break;
          continue;
        }
        const yesOpt = (d.options ?? []).find((o: any) => /journey|search away|ok|yes|pay|please/i.test(o.text));
        if (yesOpt) {
          await sdk.sendClickDialog(yesOpt.index);
        } else {
          await sdk.sendClickDialog(0);
        }
      }
      await sleep(3000);
      await clearAllUI();
      await ensureSurfaceL0();
    }
  }

  if ((sdk.getState()?.player?.worldX ?? 3029) < 2750) {
    // Region 28: East Ardougne Market, Banks, Church & Palace (m40_51 & m41_51)
    await auditRegion(
      'East Ardougne Market, Banks, Church & Palace (m40_51 & m41_51)',
      [
        [2662, 3305, 'East Ardougne Market Square'],
        [2655, 3283, 'East Ardougne South Bank'],
        [2615, 3332, 'East Ardougne North Bank'],
        [2614, 3308, 'East Ardougne Church'],
        [2576, 3296, 'Ardougne Palace Courtyard'],
      ],
      { minX: 2565, maxX: 2685, minZ: 3265, maxZ: 3345 },
      false
    );

    // Region 29: Seers' Village, Camelot Castle & Catherby (m42_53, m43_53, m43_54)
    await auditRegion(
      "Seers' Village, Camelot Castle & Catherby (m42_53, m43_53, m43_54)",
      [
        [2715, 3472, "Seers' Village Spinning Wheel & Houses"],
        [2725, 3485, "Seers' Village Bank & Pub"],
        [2757, 3480, 'Camelot Castle Courtyard'],
        [2763, 3443, 'Catherby Flax Field & Beehives'],
        [2809, 3440, 'Catherby Bank & Shops'],
      ],
      { minX: 2695, maxX: 2835, minZ: 3425, maxZ: 3515 },
      false
    );
  }
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
