import { runScript } from "../../sdk/runner";
import * as fs from "fs";

const REPORT_PATH = "/home/josh/dev/jimmy-sandbox/REPORT.md";
const LOG_PATH = "/home/josh/dev/jimmy-sandbox/rs-sdk/bots/jimmy-dev/lab_log.md";

function recordResult(status: string, id: number | string, name: string, x: number, z: number, level: number, notes: string) {
  let report = fs.readFileSync(REPORT_PATH, "utf8");
  const line = `- **${status}** | \`${id}\` (${name}) @ (${x}, ${z}, L${level}) — ${notes}\n`;
  const failRegex = new RegExp(`^- \\*\\*FAIL\\*\\* \\| \`${id}\`.*$`, "m");
  if (status === "OK" && failRegex.test(report)) {
    report = report.replace(failRegex, line.trim());
    fs.writeFileSync(REPORT_PATH, report);
  } else if (!report.includes(`\`${id}\` (${name})`)) {
    fs.appendFileSync(REPORT_PATH, line);
  }
  fs.appendFileSync(LOG_PATH, line);
  console.log(line.trim());
}

function getDialogString(dlg: any): string {
  if (!dlg || !dlg.isOpen) return "";
  const lines = dlg.lines || dlg.text || (dlg.options ? dlg.options.map((o: any) => o.text) : []);
  return Array.isArray(lines) ? lines.join(" ") : String(lines || "Dialog open");
}

async function clearDialog(sdk: any) {
  for (let i = 0; i < 8; i++) {
    const dlg = sdk.getDialog();
    if (!dlg || !dlg.isOpen) break;
    const opts = dlg.options || [];
    if (opts.length >= 2) {
      const cancelOpt = opts.find((o: any) => /nevermind|no|goodbye|bye|nothing|leave|dangerous/i.test(o.text)) || opts[opts.length - 1];
      await sdk.sendClickDialog(cancelOpt.index ?? 1);
    } else {
      await sdk.sendClickDialog(0);
    }
    await sdk.waitForTicks(2);
  }
}

async function testNpc(bot: any, sdk: any, npc: any) {
  await clearDialog(sdk);
  const level = sdk.getState()?.player?.level || 0;
  sdk.getNewChat();
  await bot.talkTo(npc);
  await sdk.waitForTicks(3);
  const dlg = sdk.getDialog();
  const text = getDialogString(dlg);
  const chat = sdk.getNewChat().map((c: any) => c.text).join(" | ");
  await clearDialog(sdk);
  if (npc.options.some((o: string) => /trade/i.test(o))) {
    await bot.openShop(npc);
    await sdk.waitForTicks(3);
    const shopOpen = sdk.getState()?.interface?.isOpen;
    recordResult(dlg?.isOpen || shopOpen ? "OK" : "FAIL", npc.id, npc.name, npc.x, npc.z, level, `Talk-to ("${(text || chat).slice(0, 80)}") + Trade (shopOpen=${shopOpen})`);
    await bot.closeInterface();
  } else {
    recordResult(dlg?.isOpen || chat ? "OK" : "FAIL", npc.id, npc.name, npc.x, npc.z, level, `Talk-to -> "${(text || chat || "No response").slice(0, 120)}"`);
  }
}

await runScript(async ({ bot, sdk }) => {
  await clearDialog(sdk);

  // 1. Open Tree Door at (2465, 3492) to exit Grand Tree!
  console.log("=== Exiting Grand Tree via Tree Door ===");
  for (let i = 0; i < 3; i++) {
    const td = sdk.getNearbyLocs().find(l => /tree door/i.test(l.name));
    if (td && td.optionsWithIndex.length > 0) {
      await bot.interactLoc(td, td.optionsWithIndex[0].text);
      await sdk.waitForTicks(4);
    }
    if ((sdk.getState()?.player?.worldZ || 0) <= 3491) break;
  }
  console.log(`Now at (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

  // 2. Walk to Gnome Ball Gate (2395, 3485), enter pitch, test Gnome ball referee (635), exit pitch
  console.log("=== Testing Gnome Ball Referee (635) ===");
  for (const [wx, wz] of [
    [2445, 3475],
    [2415, 3475],
    [2394, 3485],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }
  const gbGate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.optionsWithIndex.length > 0);
  if (gbGate) {
    await bot.interactLoc(gbGate, gbGate.optionsWithIndex[0].text);
    await sdk.waitForTicks(5);
    const ref = sdk.findNearbyNpc(/referee/i);
    if (ref) await testNpc(bot, sdk, ref);
    const gbGateExit = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.optionsWithIndex.length > 0);
    if (gbGateExit) {
      await bot.interactLoc(gbGateExit, gbGateExit.optionsWithIndex[0].text);
      await sdk.waitForTicks(5);
    }
  }

  // 3. Walk to Brimstail's cave (2403, 3419), enter cave, test Brimstail (171), exit cave
  console.log("=== Testing Brimstail (171) ===");
  for (const [wx, wz] of [
    [2415, 3450],
    [2403, 3419],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }
  const bCave = sdk.getNearbyLocs().find(l => /cave/i.test(l.name) && l.optionsWithIndex.length > 0);
  if (bCave) {
    await bot.interactLoc(bCave, bCave.optionsWithIndex[0].text);
    await sdk.waitForTicks(5);
    const brim = sdk.findNearbyNpc(/brimstail/i);
    if (brim) await testNpc(bot, sdk, brim);
    const bExit = sdk.getNearbyLocs().find(l => /cave|tunnel/i.test(l.name) && l.optionsWithIndex.length > 0);
    if (bExit) {
      await bot.interactLoc(bExit, bExit.optionsWithIndex[0].text);
      await sdk.waitForTicks(5);
    }
  }

  // 4. Exit Stronghold at (2461, 3383) and walk to Kennith / Caroline / Holgart at Witchaven (2715, 3303) & Fishing Platform
  console.log("=== Exiting Stronghold & Walking to Witchaven (2715, 3303) ===");
  for (const [wx, wz] of [
    [2435, 3405],
    [2461, 3384],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  const sGate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && Math.hypot(l.x - 2461, l.z - 3382) <= 6);
  if (sGate) {
    await bot.interactLoc(sGate, sGate.optionsWithIndex[0].text);
    await sdk.waitForTicks(6);
    await clearDialog(sdk);
  }

  for (const [wx, wz, pat] of [
    [2515, 3365, null],
    [2575, 3330, /holgart|caroline|ezekial/i],
    [2635, 3315, null],
    [2716, 3303, /caroline|holgart|ezekial/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
        await testNpc(bot, sdk, n);
      }
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
