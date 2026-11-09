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

      await bot.dismissBlockingUI();
      if (sdk.getState()?.interface?.isOpen) {
        await bot.closeInterface();
      }
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
      if (sdk.getState()?.interface?.isOpen) {
        await bot.closeInterface();
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

      // If we climbed up a ladder/staircase to L1, test climbing back down so we stay on L0 for the rest of the town sweep
      if (movedFloor && (sdk.getState()?.player?.level ?? 0) > 0) {
        const downLoc = (sdk.getState()?.nearbyLocs ?? []).find(
          (l: any) => /ladder|staircase/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down/i.test(o))
        );
        if (downLoc) {
          await testLocOption(downLoc, 'Climb-down', `Climb back down ${downLoc.name} to L0`);
        }
      }
    };

    for (const [wx, wz, label] of waypoints) {
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

      const locs = await sdk.scanNearbyLocs(12);
      for (const loc of locs) {
        if (loc.x < bounds.minX || loc.x > bounds.maxX || loc.z < bounds.minZ || loc.z > bounds.maxZ) continue;
        // Skip trees & rocks except at most 1 per region to avoid filling inventory with logs
        if (/tree|plant/i.test(loc.name)) continue;
        for (const opt of loc.options ?? []) {
          if (!opt || /^examine$/i.test(opt)) continue;
          if (/^close$/i.test(opt) && /door|gate/i.test(loc.name)) continue;
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

  // Region 1b: Lumbridge Castle Cellar / Basement (m50_150) via Kitchen Trapdoor (3209, 3216)
  await bot.walkTo(3209, 3215, 2);
  const td = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /trapdoor/i.test(l.name));
  if (td) {
    if ((td.options ?? []).some((o: string) => /^open$/i.test(o))) {
      await bot.interactLoc(td, /^open$/i);
      await sleep(1000);
    }
    const tdOpen = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /trapdoor/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down/i.test(o)));
    if (tdOpen) {
      await bot.interactLoc(tdOpen, /climb-?down/i);
      await sleep(1500);
    }
  }
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
    await auditRegion(
      'Lumbridge Castle Cellar / Basement (m50_150)',
      [
        [3209, 9616, 'Cellar West Ladder'],
        [3214, 9620, 'Cellar Center'],
        [3218, 9618, 'Cellar East Wall'],
      ],
      { minX: 3206, maxX: 3222, minZ: 9612, maxZ: 9626 }
    );
    await bot.walkTo(3209, 9616, 2);
    const ladUp = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /ladder/i.test(l.name));
    if (ladUp) {
      await bot.interactLoc(ladUp, /climb-?up/i);
      await sleep(1500);
    }
  }

  // Region 2: Lumbridge Town, Church, Graveyard, Shops & East River Lum (m50_50)
  await auditRegion(
    'Lumbridge Town, Church, Graveyard & East River Lum (m50_50)',
    [
      [3234, 3203, "Bob's Brilliant Axes"],
      [3243, 3206, 'Lumbridge Church'],
      [3249, 3193, 'Lumbridge Graveyard & Coffin'],
      [3253, 3191, 'Graveyard SE Corner'],
      [3226, 3256, 'Lumbridge Furnace'],
      [3212, 3247, 'Lumbridge General Store'],
      [3219, 3244, 'North Lumbridge Houses'],
      [3245, 3244, 'East River Lum Goblin House'],
      [3266, 3227, 'Al Kharid Toll Gate'],
    ],
    { minX: 3208, maxX: 3270, minZ: 3188, maxZ: 3262 }
  );

  // Region 3: Lumbridge Swamp & Father Urhney's Hut (m50_49 & m49_49)
  await auditRegion(
    'Lumbridge Swamp & Mining Site (m50_49 & m49_49)',
    [
      [3235, 3153, "Father Urhney's House"],
      [3228, 3147, 'Swamp SE Mining Site'],
      [3200, 3145, 'Swamp South Coast Edge'],
      [3169, 3172, 'Swamp Caves Entrance Area'],
      [3147, 3175, 'Swamp West Shack'],
    ],
    { minX: 3140, maxX: 3255, minZ: 3138, maxZ: 3190 }
  );

  // Region 4: West Lumbridge Farms, Fred's House & Windmill (m49_50 & m49_51)
  await auditRegion(
    "West Lumbridge Farms, Fred's House & Mill Lane Mill (m49_50 & m49_51)",
    [
      [3189, 3275, "Fred the Farmer's House"],
      [3197, 3280, 'Sheep Field Stile'],
      [3166, 3306, 'Mill Lane Windmill L0'],
      [3162, 3299, 'Wheat Field'],
    ],
    { minX: 3150, maxX: 3205, minZ: 3255, maxZ: 3315 }
  );
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
