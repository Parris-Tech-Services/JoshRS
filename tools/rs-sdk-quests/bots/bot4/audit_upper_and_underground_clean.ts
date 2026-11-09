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
    for (let i = 0; i < 5; i++) {
      const st = sdk.getState();
      if (st?.interface?.isOpen) {
        await bot.closeInterface();
        await sleep(250);
      }
      if (st?.dialog?.isOpen) {
        const opts = st.dialog.options ?? [];
        const cancelOpt = opts.find((o: any) => /cancel|nevermind|no|nothing/i.test(o.text));
        const idx = cancelOpt ? cancelOpt.index : (opts[0]?.index ?? 0);
        await sdk.sendClickDialog(idx);
        await sleep(300);
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
    for (let attempt = 0; attempt < 5; attempt++) {
      const p = sdk.getState()?.player;
      if (!p) break;
      if (p.level === 0 && p.worldZ < 6000) break;
      await clearAllUI();
      if (p.worldZ >= 6000) {
        const upLoc = (sdk.getState()?.nearbyLocs ?? []).find(
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
        const downLoc = (sdk.getState()?.nearbyLocs ?? []).find(
          (l: any) => /ladder|staircase|stairs/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down|walk-?down|climb/i.test(o))
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
        if (/tree|oak|willow|yew|plant|cactus|ladder|staircase|stairs|trapdoor/i.test(loc.name)) continue;
        for (const opt of loc.options ?? []) {
          if (!opt || /^examine$/i.test(opt)) continue;
          if (/^close$/i.test(opt) && /door|gate/i.test(loc.name)) continue;
          if (/climb|walk-down|walk-up|chop|pick-lock/i.test(opt)) continue;
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

  // 1. Wizards' Tower Basement (Sedridor's Chambers, m48_149)
  // Step inside the entrance door, then into the west room (tolerance 0) so all inner doors open
  await bot.walkTo(3109, 3167, 1);
  await bot.walkTo(3108, 3163, 1);
  await bot.walkTo(3104, 3162, 1);
  const wizLadderDown = (sdk.getState()?.nearbyLocs ?? []).find(
    (l: any) => /ladder/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down/i.test(o))
  );
  if (wizLadderDown) {
    await interactFast(wizLadderDown, /climb-?down/i, 5000);
    await sleep(1000);
  }
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
    await auditRegion(
      "Wizards' Tower Basement (Sedridor's Chambers, m48_149)",
      [
        [3104, 9576, "Wizards' Tower Basement Ladder & Outer Hall"],
        [3105, 9570, "Sedridor's Inner Room"],
      ],
      { minX: 3095, maxX: 3115, minZ: 9560, maxZ: 9585 },
      true
    );
    await bot.walkTo(3104, 9576, 1);
    await ensureSurfaceL0();
  }

  // 2. Dwarven Mine Underground via South Falador Staircase (3059, 3376 -> 3058, 9776)
  await bot.walkTo(3059, 3376, 2);
  const dwarfStairsDown = (sdk.getState()?.nearbyLocs ?? []).find(
    (l: any) => /staircase|stairs|ladder/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down|walk-?down/i.test(o))
  );
  if (dwarfStairsDown) {
    await interactFast(dwarfStairsDown, /climb-?down|walk-?down/i, 5000);
    await sleep(1000);
  }
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
    await auditRegion(
      'Dwarven Mine Underground (m47_153 & m47_152)',
      [
        [3058, 9776, 'Dwarven Mine South Staircase Landing'],
        [3028, 9806, "Dwarven Mine Drogo's Mining Emporium"],
        [2997, 9827, 'Dwarven Mine General Store & Anvil'],
        [3018, 9850, 'Dwarven Mine North Ladder & Carts'],
      ],
      { minX: 2980, maxX: 3065, minZ: 9770, maxZ: 9860 },
      true
    );
    await ensureSurfaceL0();
  }

  // 3. Varrock Sewers Entrance & Corridors (m50_154)
  await bot.walkTo(3237, 3458, 2);
  const manhole = (sdk.getState()?.nearbyLocs ?? []).find(
    (l: any) => /manhole/i.test(l.name) && Math.abs(l.x - 3237) <= 3 && Math.abs(l.z - 3458) <= 3
  );
  if (manhole) {
    if ((manhole.options ?? []).some((o: string) => /^open$/i.test(o))) {
      await interactFast(manhole, /^open$/i, 4000);
      await sleep(800);
    }
    const manholeAfter = (sdk.getState()?.nearbyLocs ?? []).find(
      (l: any) => /manhole/i.test(l.name) && Math.abs(l.x - 3237) <= 3 && Math.abs(l.z - 3458) <= 3 && (l.options ?? []).some((o: string) => /climb-?down/i.test(o))
    );
    if (manholeAfter) {
      await interactFast(manholeAfter, /climb-?down/i, 5000);
      await sleep(1000);
    }
  }
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
    await auditRegion(
      'Varrock Sewers Entrance & West Corridors (m50_154)',
      [
        [3237, 9858, 'Varrock Sewers Manhole Ladder Landing'],
        [3229, 9866, 'Varrock Sewers Central Junction'],
      ],
      { minX: 3215, maxX: 3245, minZ: 9850, maxZ: 9880 },
      true
    );
    await bot.walkTo(3237, 9858, 2);
    await ensureSurfaceL0();
  }

  // 4. North-East Varrock, Jolly Boar Inn, Lumber Yard & Earth Altar Ruins (m51_53 & m51_54)
  await auditRegion(
    'North-East Varrock, Jolly Boar Inn, Lumber Yard & Earth Altar Ruins (m51_53 & m51_54)',
    [
      [3274, 3428, 'Varrock East Gate'],
      [3304, 3474, 'Earth Altar Ruins'],
      [3304, 3491, 'Lumber Yard Entrance'],
      [3280, 3495, 'Jolly Boar Inn'],
    ],
    { minX: 3265, maxX: 3325, minZ: 3420, maxZ: 3515 },
    false
  );
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
