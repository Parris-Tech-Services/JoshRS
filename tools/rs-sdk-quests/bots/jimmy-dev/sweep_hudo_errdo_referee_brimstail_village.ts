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

  // 1. Climb Grand Tree (2466, 3495, L0) -> L1 -> test Hudo (600), Gulluck (602), Gnome banker (166 via openBank), then climb to L2 -> L3 for Captain Errdo (381)
  const gtLadder0 = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (gtLadder0) {
    await bot.interactLoc(gtLadder0, "Climb-up");
    await sdk.waitForTicks(4);
  }
  if (sdk.getState()?.player?.level === 1) {
    for (const [wx, wz, pat] of [
      [2449, 3502, /hudo/i],
      [2465, 3505, /gulluck/i],
    ] as [number, number, RegExp][]) {
      await bot.walkTo(wx, wz, 3);
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
    // Test Gnome banker (166) via booth at (2445, 3488, L1)
    await bot.walkTo(2445, 3488, 3);
    const bankRes = await bot.openBank();
    await sdk.waitForTicks(3);
    const gBanker = sdk.findNearbyNpc(/gnome banker/i);
    if (gBanker && (bankRes.success || sdk.getState()?.interface?.isOpen || sdk.getDialog()?.isOpen)) {
      recordResult("OK", gBanker.id, gBanker.name, gBanker.x, gBanker.z, 1, `Bank booth / Talk-to verified (openBank=${bankRes.success})`);
      await bot.closeInterface();
      await clearDialog(sdk);
    }

    // Climb to L2 -> L3 for Captain Errdo (381)
    await bot.walkTo(2466, 3495, 3);
    for (let lv = 0; lv < 2; lv++) {
      const up = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
      if (up) {
        await bot.interactLoc(up, "Climb-up");
        await sdk.waitForTicks(4);
      }
    }
    if (sdk.getState()?.player?.level === 3) {
      await bot.walkTo(2464, 3500, 3);
      const pilot = sdk.findNearbyNpc(/errdo|pilot|dalila/i);
      if (pilot) await testNpc(bot, sdk, pilot);
    }
    while ((sdk.getState()?.player?.level || 0) > 0) {
      const down = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
      if (!down) break;
      await bot.interactLoc(down, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Exit Grand Tree Tree Door at (2465, 3492)
  for (let i = 0; i < 3; i++) {
    const td = sdk.getNearbyLocs().find(l => /tree door|door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
    if (td) {
      await bot.openDoor(td);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(2465, 3489, true);
    await sdk.waitForTicks(3);
  }
  console.log(`Outside Grand Tree at (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ})`);

  // 2. Walk to Gnome Ball Gate (2395, 3480), enter pitch, test Gnome ball referee (635), exit pitch
  console.log("=== Walking to Gnome Ball Pitch (2395, 3480) ===");
  for (const [wx, wz] of [
    [2445, 3480],
    [2415, 3480],
    [2398, 3485],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }
  const gbGate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.optionsWithIndex.length > 0);
  if (gbGate) {
    await bot.interactLoc(gbGate, gbGate.optionsWithIndex[0].text);
    await sdk.waitForTicks(5);
    const ref = sdk.findNearbyNpc(/referee/i);
    if (ref) await testNpc(bot, sdk, ref);
    // Walk back to gate to exit pitch
    await bot.walkTo(gbGate.x, gbGate.z, 2);
    const gbGateExit = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.optionsWithIndex.length > 0);
    if (gbGateExit) {
      await bot.interactLoc(gbGateExit, gbGateExit.optionsWithIndex[0].text);
      await sdk.waitForTicks(5);
    }
  }

  // 3. Walk to Brimstail's cave (2403, 3419), enter cave, test Brimstail (171), exit cave
  console.log("=== Walking to Brimstail's Cave (2403, 3419) ===");
  for (const [wx, wz] of [
    [2415, 3450],
    [2403, 3419],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
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

  // 4. Exit Tree Gnome Stronghold gate at (2461, 3383) and test Elkoy (473), Bolkoy (597), King Bolren (469), Commander Montai (669)
  console.log("=== Exiting Stronghold & Testing Tree Gnome Village / Battlefield ===");
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
    [2504, 3192, /elkoy/i],
    [2525, 3205, /commander montai/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
      await testNpc(bot, sdk, n);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
