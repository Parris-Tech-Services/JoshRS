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
  const findings: AuditFinding[] = [];
  const testedKeys = new Set<string>();

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const logFinding = (f: AuditFinding) => {
    findings.push(f);
    console.log(`[AUDIT] [${f.severity}] ${f.region} ${f.coords} | ${f.objectName} (id=${f.objectId}) [${f.action}] -> ${f.actual}`);
  };

  // Helper to exit Draynor Manor if we are still inside it from Ernest the Chicken
  const pStart = sdk.getState()?.player;
  if (pStart && pStart.worldX >= 3095 && pStart.worldX <= 3126 && pStart.worldZ >= 3352 && pStart.worldZ <= 3372) {
    console.log('[AUDIT] Exiting Draynor Manor...');
    for (const [dx, dz] of [[3123, 3360], [3119, 3356], [3101, 3371]]) {
      await sdk.sendWalk(dx, dz, true);
      await sleep(1500);
      const d = (sdk.getState()?.nearbyLocs ?? []).find(
        (l: any) => Math.hypot(l.x - dx, l.z - dz) <= 3 && (l.options ?? []).some((o: string) => /^open$/i.test(o))
      );
      if (d) {
        await bot.interactLoc(d, /^open$/i);
        await sleep(900);
      }
    }
    await bot.walkTo(3108, 3345, 3);
  }

  console.log('[AUDIT] Walking to Lumbridge Castle Courtyard (3222, 3218)...');
  await bot.walkTo(3222, 3218, 2);

  // Helper to test a single loc interaction and record what happens
  const testLocOption = async (region: string, loc: any, optText: string, expectedDesc: string, isCosmeticIfNoHandler = true) => {
    const key = `${ sdk.getState()?.player?.level ?? 0 }:${loc.x},${loc.z}:${loc.id}:${optText}`;
    if (testedKeys.has(key)) return;
    testedKeys.add(key);

    await bot.dismissBlockingUI();
    const stateBefore = sdk.getState();
    const pBefore = stateBefore?.player;
    const rejBefore = stateBefore?.opFeedback?.opRejectedCount ?? 0;
    const msgIdBefore = Math.max(0, ...(stateBefore?.gameMessages ?? []).map((m: any) => m.observationId ?? 0));
    const dialogCountBefore = (stateBefore?.recentDialogs ?? []).length;

    const res = await bot.interactLoc(loc, new RegExp(`^${optText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    await sleep(900);
    if (sdk.getState()?.dialog?.isOpen) {
      await bot.dismissBlockingUI();
      if (sdk.getState()?.dialog?.isOpen) {
        await sdk.sendClickDialog(0);
        await sleep(500);
      }
    }

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

    if (!res.success || rejAfter > rejBefore || /nothing interesting happens|can't reach/i.test(combinedFeedback)) {
      const actualStr = `success=${res.success} (${res.message || 'no msg'}), opRejectedDelta=${rejAfter - rejBefore}, messages="${combinedFeedback || 'none'}", locUnchanged=${locStillSame}`;
      const blocks = /door|gate|ladder|stair|trapdoor/i.test(loc.name) && !movedFloor && locStillSame && !isCosmeticIfNoHandler;
      logFinding({
        region,
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
        region,
        coords: coordsStr,
        objectName: loc.name,
        objectId: loc.id,
        action: optText,
        expected: expectedDesc,
        actual: `OK: ${res.message}${combinedFeedback ? ` | "${combinedFeedback}"` : ''}${movedFloor ? ` | moved to (${pAfter?.worldX}, ${pAfter?.worldZ}, L${pAfter?.level})` : ''}`,
        severity: 'Working as expected (verified)',
      });
    }
  };

  // 1. Audit Lumbridge Castle Courtyard & Ground Floor (L0)
  const REGION_L0 = 'Lumbridge Castle - Ground Floor & Courtyard (m50_50 L0)';
  const l0Waypoints: [number, number, string][] = [
    [3222, 3218, 'Courtyard center'],
    [3221, 3212, 'Courtyard fountain'],
    [3218, 3206, 'Courtyard SW corner'],
    [3234, 3206, 'Courtyard SE corner'],
    [3234, 3231, 'Courtyard NE corner'],
    [3218, 3231, 'Courtyard NW corner'],
    [3213, 3218, 'Great Hall entrance'],
    [3208, 3218, 'Great Hall interior'],
    [3209, 3214, 'Kitchen'],
    [3205, 3209, 'South stairwell L0'],
    [3205, 3228, 'North stairwell L0'],
    [3212, 3228, 'North room L0'],
  ];

  for (const [wx, wz, label] of l0Waypoints) {
    const w = await bot.walkTo(wx, wz, 2);
    if (!w.success) {
      logFinding({
        region: REGION_L0,
        coords: `(${wx}, ${wz}, L0)`,
        objectName: `Waypoint: ${label}`,
        objectId: -1,
        action: 'Walk',
        expected: `Reach ${label} at (${wx}, ${wz})`,
        actual: `walkTo failed: ${w.message}`,
        severity: 'Blocks progress',
      });
      continue;
    }
    const locs = await sdk.scanNearbyLocs(10);
    for (const loc of locs) {
      if (loc.x < 3203 || loc.x > 3237 || loc.z < 3204 || loc.z > 3235) continue;
      for (const opt of loc.options ?? []) {
        if (!opt || /^examine$/i.test(opt)) continue;
        // Skip Climb-up / Climb-down during the L0 sweep so we don't leave L0 prematurely
        if (/climb|trapdoor/i.test(opt) || /trapdoor|staircase|ladder/i.test(loc.name)) continue;
        await testLocOption(
          REGION_L0,
          loc,
          opt,
          `Interact "${opt}" with ${loc.name} at (${loc.x}, ${loc.z})`
        );
      }
    }
  }

  // 2. Audit Lumbridge Castle Cellar / Basement via Kitchen Trapdoor (3209, 3216)
  const REGION_CELLAR = 'Lumbridge Castle - Cellar / Basement (m50_150)';
  await bot.walkTo(3209, 3215, 2);
  let trapdoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /trapdoor/i.test(l.name));
  if (trapdoor) {
    if ((trapdoor.options ?? []).some((o: string) => /^open$/i.test(o))) {
      await testLocOption(REGION_L0, trapdoor, 'Open', 'Open kitchen trapdoor to reveal climb-down option', false);
      trapdoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /trapdoor/i.test(l.name));
    }
    if (trapdoor && (trapdoor.options ?? []).some((o: string) => /climb-?down/i.test(o))) {
      await testLocOption(REGION_L0, trapdoor, 'Climb-down', 'Climb down trapdoor to Lumbridge cellar (3209, 9616)', false);
    }
  }

  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
    const cellarLocs = await sdk.scanNearbyLocs(16);
    for (const loc of cellarLocs) {
      if (/ladder/i.test(loc.name)) continue;
      for (const opt of loc.options ?? []) {
        if (!opt || /^examine$/i.test(opt)) continue;
        await testLocOption(
          REGION_CELLAR,
          loc,
          opt,
          `Interact "${opt}" with ${loc.name} in Lumbridge cellar`
        );
      }
    }
    const ladderUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /ladder/i.test(l.name));
    if (ladderUp) {
      await testLocOption(REGION_CELLAR, ladderUp, 'Climb-up', 'Climb up cellar ladder back to Kitchen L0', false);
    }
  }

  // 3. Audit Lumbridge Castle First Floor (L1)
  const REGION_L1 = 'Lumbridge Castle - First Floor (m50_50 L1)';
  await bot.walkTo(3205, 3209, 2);
  const stairL0S = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /staircase/i.test(l.name) && Math.hypot(l.x - 3205, l.z - 3208) <= 3);
  if (stairL0S) {
    await testLocOption(REGION_L0, stairL0S, 'Climb-up', 'Climb south staircase from L0 to L1', false);
  }

  if (sdk.getState()?.player?.level === 1) {
    const l1Waypoints: [number, number][] = [
      [3206, 3210],
      [3210, 3213],
      [3212, 3221],
      [3206, 3228],
    ];
    for (const [wx, wz] of l1Waypoints) {
      await bot.walkTo(wx, wz, 2);
      const locs = await sdk.scanNearbyLocs(10);
      for (const loc of locs) {
        if (loc.x < 3203 || loc.x > 3218 || loc.z < 3206 || loc.z > 3232) continue;
        if (/staircase|ladder/i.test(loc.name)) continue;
        for (const opt of loc.options ?? []) {
          if (!opt || /^examine$/i.test(opt)) continue;
          await testLocOption(
            REGION_L1,
            loc,
            opt,
            `Interact "${opt}" with ${loc.name} on Castle L1`
          );
        }
      }
    }

    // 4. Climb up to L2 (Second Floor / Roof)
    const REGION_L2 = 'Lumbridge Castle - Second Floor / Roof (m50_50 L2)';
    await bot.walkTo(3205, 3228, 2);
    const stairL1N = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /staircase/i.test(l.name) && Math.hypot(l.x - 3205, l.z - 3228) <= 3);
    if (stairL1N) {
      await testLocOption(REGION_L1, stairL1N, 'Climb-up', 'Climb north staircase from L1 to L2', false);
    }

    if (sdk.getState()?.player?.level === 2) {
      const l2Locs = await sdk.scanNearbyLocs(16);
      for (const loc of l2Locs) {
        if (loc.x < 3203 || loc.x > 3218 || loc.z < 3206 || loc.z > 3232) continue;
        if (/staircase/i.test(loc.name)) continue;
        for (const opt of loc.options ?? []) {
          if (!opt || /^examine$/i.test(opt)) continue;
          await testLocOption(
            REGION_L2,
            loc,
            opt,
            `Interact "${opt}" with ${loc.name} on Castle L2`
          );
        }
      }
      // Climb down from L2 -> L1 -> L0 via south staircase
      await bot.walkTo(3205, 3209, 2);
      const stairL2S = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /staircase/i.test(l.name) && Math.hypot(l.x - 3205, l.z - 3208) <= 3);
      if (stairL2S) {
        await testLocOption(REGION_L2, stairL2S, 'Climb-down', 'Climb south staircase from L2 to L1', false);
      }
    }

    if (sdk.getState()?.player?.level === 1) {
      await bot.walkTo(3205, 3209, 2);
      const stairL1S = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /staircase/i.test(l.name) && Math.hypot(l.x - 3205, l.z - 3208) <= 3);
      if (stairL1S) {
        await testLocOption(REGION_L1, stairL1S, 'Climb-down', 'Climb south staircase from L1 to L0', false);
      }
    }
  }

  // Format report and append to bots/bot4/lab_log.md
  const brokenOrCosmetic = findings.filter((f) => f.severity !== 'Working as expected (verified)');
  const working = findings.filter((f) => f.severity === 'Working as expected (verified)');

  const lines: string[] = [
    '',
    '## World Interaction Audit — Session 1',
    `### Region Completed: Lumbridge Castle (m50_50 L0, L1, L2 & Cellar m50_150) — ${new Date().toISOString()}`,
    `- **Total Interactions Audited**: ${findings.length} (${working.length} verified working, ${brokenOrCosmetic.length} anomalous/unimplemented)`,
    '',
    '#### Anomalies / Missing Handlers / Unreachable Findings',
  ];

  if (brokenOrCosmetic.length === 0) {
    lines.push('- None — all tested interactions in Lumbridge Castle succeeded.');
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
  console.log(`[AUDIT] Appended ${findings.length} findings to bots/bot4/lab_log.md`);
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
