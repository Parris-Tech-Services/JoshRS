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

      if (movedFloor && (sdk.getState()?.player?.level ?? 0) > 0) {
        const downLoc = (sdk.getState()?.nearbyLocs ?? []).find(
          (l: any) => /ladder|staircase/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down/i.test(o))
        );
        if (downLoc) {
          await testLocOption(downLoc, 'Climb-down', `Climb back down ${downLoc.name} to L0`);
        }
      } else if (movedFloor && (sdk.getState()?.player?.worldZ ?? 0) > 9000) {
        const upLoc = (sdk.getState()?.nearbyLocs ?? []).find(
          (l: any) => /ladder/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?up/i.test(o))
        );
        if (upLoc) {
          await testLocOption(upLoc, 'Climb-up', `Climb back up ${upLoc.name} to surface`);
        }
      }
    };

    const optDesc = (s: string) => s;

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
        if (/tree|plant|ladder|staircase|trapdoor/i.test(loc.name)) continue;
        for (const opt of loc.options ?? []) {
          if (!opt || /^examine$/i.test(opt)) continue;
          if (/^close$/i.test(opt) && /door|gate/i.test(loc.name)) continue;
          if (/climb/i.test(opt)) continue;
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

  // Region 5: Draynor Village, Bank, Market, Aggie's, Ned's & Prison (m48_50 & m49_50)
  await auditRegion(
    'Draynor Village, Bank, Market & Prison (m48_50 & m49_50)',
    [
      [3127, 3244, 'Draynor Prison'],
      [3098, 3268, "Morgan's House"],
      [3098, 3258, "Ned's House"],
      [3086, 3258, "Aggie the Witch's House"],
      [3092, 3243, 'Draynor Bank'],
      [3080, 3250, 'Draynor Market'],
      [3077, 3260, 'Draynor West Wheat Field'],
    ],
    { minX: 3070, maxX: 3135, minZ: 3235, maxZ: 3285 }
  );

  // Region 6: Wizards' Tower Island & Basement (m48_49)
  await auditRegion(
    "Wizards' Tower Island & Ground/Basement (m48_49)",
    [
      [3114, 3190, "Wizards' Tower Bridge North"],
      [3109, 3169, "Wizards' Tower Entrance"],
      [3105, 3162, "Wizards' Tower West Room"],
      [3112, 3156, "Wizards' Tower Island South Coast"],
    ],
    { minX: 3098, maxX: 3122, minZ: 3150, maxZ: 3195 }
  );
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
