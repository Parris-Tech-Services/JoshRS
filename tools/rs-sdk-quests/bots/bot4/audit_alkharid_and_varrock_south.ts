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

  // Region 7: Al Kharid Town, Palace, Bank, Shops & Shantay Pass (m51_49 & m51_50)
  await auditRegion(
    'Al Kharid Town, Palace, Bank, Furnace & Shantay Pass (m51_49 & m51_50)',
    [
      [3293, 3174, 'Al Kharid Palace Courtyard'],
      [3269, 3167, 'Al Kharid Bank'],
      [3275, 3186, 'Al Kharid Furnace & Tanning'],
      [3301, 3195, 'Al Kharid Gem Stall & Shops'],
      [3315, 3179, 'Al Kharid Zeke/Louie Shops'],
      [3304, 3124, 'Shantay Pass'],
    ],
    { minX: 3266, maxX: 3328, minZ: 3115, maxZ: 3215 }
  );
}, {
  bot: 'bot4',
  disconnectAfter: true,
});
