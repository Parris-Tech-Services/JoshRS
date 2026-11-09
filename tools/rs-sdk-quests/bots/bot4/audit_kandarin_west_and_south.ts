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
  severity: 'Blocks progress' | 'Cosmetic' | 'OK';
}

const LOG_PATH = 'bots/bot4/lab_log.md';

await runScript(async ({ bot, sdk }) => {
  const testedKeys = new Set<string>();
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const clearAllUI = async () => {
    await bot.dismissBlockingUI();
    for (let i = 0; i < 8; i++) {
      const s = sdk.getState();
      if (s?.interface?.isOpen) {
        await sdk.sendCloseModal();
        await sleep(250);
        continue;
      }
      if (s?.dialog?.isOpen) {
        const opts = s.dialog.options ?? [];
        const safeOpt =
          opts.find((o: any) => /yes|ok|continue|cancel|nevermind|nothing/i.test(o.text)) ??
          opts[0];
        await sdk.sendClickDialog(safeOpt ? safeOpt.index : 0);
        await sleep(250);
        continue;
      }
      break;
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
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
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
          actual: `OK: ${res.message}${movedFloor ? ` (moved to L${pAfter?.level} ${pAfter?.worldX},${pAfter?.worldZ})` : ''}${!locStillSame ? ' (loc state changed)' : ''}${combinedFeedback ? ` | "${combinedFeedback}"` : ''}`,
          severity: 'OK',
        });
      }

      if (movedFloor && ((pAfter?.level ?? 0) > 0 || (pAfter?.worldZ ?? 0) >= 6000)) {
        await ensureSurfaceL0();
      }
    };

    for (const [wx, wz, label] of waypoints) {
      await ensureSurfaceL0();
      await clearAllUI();
      const walkRes = await Promise.race([
        bot.walkTo(wx, wz, 3),
        sleep(55000).then(() => ({ success: false, message: `Walk timed out after 55000ms to (${wx}, ${wz})` })),
      ]);
      const p = sdk.getState()?.player;
      if (!walkRes.success) {
        logFinding({
          region: regionName,
          coords: `(${wx}, ${wz}, L${p?.level ?? 0})`,
          objectName: `Waypoint: ${label}`,
          objectId: -1,
          action: 'Walk',
          expected: `Walk to ${label} at (${wx}, ${wz})`,
          actual: `walkTo failed: ${walkRes.message}`,
          severity: 'Blocks progress',
        });
      }

      const scanned = await sdk.scanNearbyLocs(16);
      const inBounds = scanned.filter(
        (l: any) =>
          l.x >= bounds.minX &&
          l.x <= bounds.maxX &&
          l.z >= bounds.minZ &&
          l.z <= bounds.maxZ &&
          l.options &&
          l.options.length > 0 &&
          !/gangplank|ladder|staircase|stairs|trapdoor|log balance/i.test(l.name)
      );

      let testedAtWaypoint = 0;
      for (const loc of inBounds) {
        if (testedAtWaypoint >= 8) break;
        for (const optObj of loc.optionsWithIndex ?? []) {
          const optText = optObj.text;
          if (!optText || /^walk|^examine/i.test(optText)) continue;
          if (/climb|cross|walk-down|walk-up|balance/i.test(optText)) continue;
          if (/open|close|shut|search|mine|prospect|chop|smelt|spin|pray|use|bank|steal|pick|drink|enter|read|operate|pull|push|take|board|collect/i.test(optText)) {
            await testLocOption(loc, optText, `Interact "${optText}" with ${loc.name} at (${loc.x}, ${loc.z})`);
            testedAtWaypoint++;
          }
        }
      }
    }

    const anomalies = findings.filter(f => f.severity !== 'OK');
    const okOnes = findings.filter(f => f.severity === 'OK');
    const lines: string[] = [];
    lines.push(`\n### Region Completed: ${regionName} — ${new Date().toISOString()}`);
    lines.push(`- **Total Interactions Audited**: ${findings.length} (${okOnes.length} verified working, ${anomalies.length} anomalous/unimplemented)`);
    lines.push(`\n#### Anomalies / Missing Handlers / Unreachable Findings`);
    if (anomalies.length === 0) {
      lines.push(`- None observed in this region.`);
    } else {
      for (const a of anomalies) {
        lines.push(`- **Coordinates & Region**: \`${a.coords}\` — ${a.region}`);
        lines.push(`  - **Object & Action**: \`${a.objectName}\` (id \`${a.objectId}\`) — action \`${a.action}\``);
        lines.push(`  - **Expected vs Actual**: Expected: ${a.expected}. Actual: ${a.actual}`);
        lines.push(`  - **Impact**: **${a.severity}**`);
      }
    }
    lines.push(`\n#### Verified Working Interactions (Summary)`);
    for (const o of okOnes) {
      lines.push(`- \`${o.coords}\` **${o.objectName}** (id \`${o.objectId}\`) [\`${o.action}\`] -> ${o.actual}`);
    }
    lines.push('');

    appendFileSync(LOG_PATH, lines.join('\n'), 'utf8');
    console.log(`[AUDIT] Appended ${findings.length} findings for ${regionName} to ${LOG_PATH}`);
  };

  await ensureSurfaceL0();

  // Region 30: Ranging Guild, Hemenster, Fishing Guild & McGrubor's Wood (m41_52, m41_53, m40_52, m41_54)
  await auditRegion(
    "Ranging Guild, Hemenster, Fishing Guild & McGrubor's Wood (m41_52, m41_53, m40_52, m41_54)",
    [
      [2678, 3440, "McGrubor's Wood East Gate & Railing"],
      [2658, 3439, 'Ranging Guild Entrance'],
      [2642, 3441, 'Hemenster Chest House & Fishing Contest Gate'],
      [2611, 3391, 'Fishing Guild Entrance'],
    ],
    { minX: 2595, maxX: 2685, minZ: 3380, maxZ: 3465 }
  );

  // Region 31: Coal Trucks, Baxtorian Falls & Tree Gnome Stronghold (m39_52, m39_53, m40_53, m40_54, m38_53)
  await auditRegion(
    'Coal Trucks, Baxtorian Falls & Tree Gnome Stronghold (m39_52, m39_53, m40_53, m40_54, m38_53)',
    [
      [2578, 3465, 'Coal Trucks & Log Balance'],
      [2527, 3495, 'Baxtorian Falls Tourist Guide & Chalice'],
      [2461, 3382, 'Tree Gnome Stronghold Main Gate'],
    ],
    { minX: 2445, maxX: 2590, minZ: 3375, maxZ: 3515 }
  );

  // Region 32: West Ardougne Wall, Battlefield of Khazard & Tree Gnome Village (m39_49, m39_50, m39_51)
  await auditRegion(
    'West Ardougne Wall, Battlefield of Khazard & Tree Gnome Village (m39_49, m39_50, m39_51)',
    [
      [2559, 3300, 'West Ardougne Mourner Gate'],
      [2524, 3230, 'Battlefield of Khazard'],
      [2515, 3162, 'Tree Gnome Village Maze Entrance'],
    ],
    { minX: 2500, maxX: 2565, minZ: 3150, maxZ: 3320 }
  );

  // Region 33: Ardougne Monastery, Clocktower, Fight Arena, Port Khazard & Yanille (m40_49, m40_50, m41_49, m41_50, m39_48, m40_48)
  await auditRegion(
    'Ardougne Monastery, Clocktower, Fight Arena, Port Khazard & Yanille (m40_49, m40_50, m41_49, m41_50, m39_48, m40_48)',
    [
      [2606, 3219, 'Ardougne Monastery'],
      [2570, 3245, 'Clocktower Courtyard'],
      [2585, 3152, 'Khazard Fight Arena Bar & Cells'],
      [2662, 3161, 'Port Khazard Docks & Trawler'],
      [2605, 3092, 'Yanille Bank & Wizards Guild'],
      [2545, 3092, 'Yanille West & Watchtower'],
    ],
    { minX: 2530, maxX: 2680, minZ: 3075, maxZ: 3255 }
  );
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
