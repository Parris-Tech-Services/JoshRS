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
    for (let attempt = 0; attempt < 4; attempt++) {
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
          await sleep(900);
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
          await sleep(900);
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
    allowUnderground = false
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

      if (!allowUnderground && movedFloor) {
        await ensureSurfaceL0();
      }
    };

    for (const [wx, wz, label] of waypoints) {
      await clearAllUI();
      if (!allowUnderground) {
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

  // Region 17: Mudskipper Point, Thurgo's Hut, Melzar's Maze Exterior & Crafting Guild (m45_50, m45_51, m46_48, m46_49)
  await auditRegion(
    "Mudskipper Point, Thurgo's Peninsula, Melzar's Maze & Crafting Guild (m45_50, m45_51, m46_48, m46_49)",
    [
      [2998, 3144, "Thurgo's Hut & Asgarnian Ice Dungeon Entrance"],
      [2996, 3119, 'Mudskipper Point South Tip'],
      [2940, 3248, "Melzar's Maze Exterior"],
      [2933, 3289, 'Crafting Guild Exterior & Cow Pen'],
    ],
    { minX: 2915, maxX: 3015, minZ: 3110, maxZ: 3300 }
  );

  // Region 18: Dwarven Mine Underground (m47_153 & m47_152)
  await bot.walkTo(3018, 3450, 2);
  const mineLadderDown = (sdk.getState()?.nearbyLocs ?? []).find(
    (l: any) => /ladder/i.test(l.name) && l.x === 3019 && l.z === 3450
  );
  if (mineLadderDown) {
    await interactFast(mineLadderDown, /climb-?down/i, 5000);
    await sleep(1000);
  }
  await auditRegion(
    'Dwarven Mine Underground (m47_153 & m47_152)',
    [
      [3018, 9850, 'Dwarven Mine North Ladder & Carts'],
      [3028, 9806, "Dwarven Mine Drogo's Mining Emporium"],
      [2997, 9827, 'Dwarven Mine General Store & Anvil'],
      [3018, 9850, 'Dwarven Mine Return to North Ladder'],
    ],
    { minX: 2980, maxX: 3060, minZ: 9780, maxZ: 9860 },
    true
  );
  await ensureSurfaceL0();

  // Region 19: Taverley Town, Sanfew's House, Lady of the Lake & Druids' Circle (m45_52 & m45_53)
  await auditRegion(
    "Taverley Town, Druids' Circle & Lady of the Lake (m45_52 & m45_53)",
    [
      [2925, 3482, 'Taverley Druids Circle'],
      [2896, 3456, 'Taverley Town Center & Sanfew House'],
      [2885, 3429, 'Taverley South Gate & Lady of the Lake'],
    ],
    { minX: 2875, maxX: 2935, minZ: 3415, maxZ: 3500 }
  );

  // Region 20: Catherby, Camelot Castle & Seers' Village (m42_53, m43_53, m43_54)
  // Step over White Wolf Mountain via the lower road waypoints to avoid the northern summit wolf pack
  await bot.walkTo(2868, 3460, 4);
  await bot.walkTo(2852, 3440, 4);
  await bot.walkTo(2822, 3438, 4);
  await auditRegion(
    "Catherby, Camelot Castle & Seers' Village (m42_53, m43_53, m43_54)",
    [
      [2809, 3440, 'Catherby Bank & Shops'],
      [2763, 3443, 'Catherby Flax Field & Beehives'],
      [2757, 3480, 'Camelot Castle Courtyard'],
      [2725, 3485, "Seers' Village Bank & Pub"],
      [2715, 3472, "Seers' Village Spinning Wheel & Houses"],
    ],
    { minX: 2695, maxX: 2835, minZ: 3425, maxZ: 3515 }
  );

  // Region 21: East Ardougne (North/South Banks, Market, Church, Palace) (m40_51, m41_51)
  await auditRegion(
    'East Ardougne Market, Banks, Church & Palace (m40_51 & m41_51)',
    [
      [2662, 3305, 'East Ardougne Market Square'],
      [2655, 3283, 'East Ardougne South Bank'],
      [2615, 3332, 'East Ardougne North Bank'],
      [2614, 3308, 'East Ardougne Church'],
      [2576, 3296, 'Ardougne Palace Courtyard'],
    ],
    { minX: 2565, maxX: 2680, minZ: 3270, maxZ: 3345 }
  );
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
