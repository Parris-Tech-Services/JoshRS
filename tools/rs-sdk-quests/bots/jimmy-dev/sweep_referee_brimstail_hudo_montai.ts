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
  // Update Femi (676) in REPORT.md since game message said "The little gnome is too busy to talk."
  recordResult("OK", 676, "Femi", 2460, 3382, 0, 'Talk-to -> game message: "The little gnome is too busy to talk."');

  // 1. Walk to Gnome Ball Gate (2393, 3488), open gate to enter pitch, test Gnome ball referee (635) & Gnome Coach (2802?) & Damwin
  console.log("=== Entering Gnome Ball Pitch (2393, 3488) ===");
  for (const [wx, wz] of [
    [2445, 3425],
    [2415, 3465],
    [2393, 3488],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  const coach = sdk.findNearbyNpc(/coach|damwin/i);
  if (coach) await testNpc(bot, sdk, coach);

  const gbGate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && Math.hypot(l.x - 2392, l.z - 3488) <= 5);
  if (gbGate) {
    const opt = gbGate.optionsWithIndex[0]?.text;
    if (opt) {
      await bot.interactLoc(gbGate, opt);
      await sdk.waitForTicks(4);
    }
  }
  const ref = sdk.findNearbyNpc(/referee/i);
  if (ref) await testNpc(bot, sdk, ref);

  // Exit Gnome Ball Pitch back through gate at (2392, 3488)
  await bot.walkTo(2391, 3488, 2);
  const gbGateExit = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && Math.hypot(l.x - 2392, l.z - 3488) <= 5);
  if (gbGateExit) {
    const opt = gbGateExit.optionsWithIndex[0]?.text;
    if (opt) {
      await bot.interactLoc(gbGateExit, opt);
      await sdk.waitForTicks(4);
    }
  }

  // 2. Test Brimstail (171) inside his cave at (2402, 3419)
  console.log("=== Testing Brimstail (171) & Grand Tree West ===");
  await bot.walkTo(2402, 3419, 3);
  const bCave = sdk.getNearbyLocs().find(l => /cave/i.test(l.name) && l.optionsWithIndex.length > 0);
  if (bCave) {
    await bot.interactLoc(bCave, bCave.optionsWithIndex[0].text);
    await sdk.waitForTicks(4);
    const brim = sdk.findNearbyNpc(/brimstail/i);
    if (brim) await testNpc(bot, sdk, brim);
    const bExit = sdk.getNearbyLocs().find(l => /cave|tunnel/i.test(l.name) && l.optionsWithIndex.length > 0);
    if (bExit) {
      await bot.interactLoc(bExit, bExit.optionsWithIndex[0].text);
      await sdk.waitForTicks(4);
    }
  }

  // 3. Climb Grand Tree (2466, 3495) to L1 for Hudo (600), Gulluck (602), Gianne jnr (849), Dalila (850), Gnome waiter (851)
  console.log("=== Testing Remaining Grand Tree L1 NPCs ===");
  await bot.walkTo(2466, 3495, 3);
  const gtLadder0 = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (gtLadder0) {
    await bot.interactLoc(gtLadder0, "Climb-up");
    await sdk.waitForTicks(4);
  }
  if (sdk.getState()?.player?.level === 1) {
    for (const [wx, wz, pat] of [
      [2465, 3492, /hudo|gianne|waiter/i],
      [2450, 3505, /gulluck|dalila/i],
      [2445, 3488, /banker/i],
    ] as [number, number, RegExp][]) {
      await bot.walkTo(wx, wz, 4);
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
        await testNpc(bot, sdk, n);
      }
    }
    await bot.walkTo(2466, 3495, 3);
    const down1 = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down1) {
      await bot.interactLoc(down1, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Exit Tree Gnome Stronghold gate at (2461, 3383) and walk to Battlefield (Commander Montai 669), Tree Gnome Village (Elkoy 473, Bolkoy 597, King Bolren 469, Remsai 472)
  console.log("=== Exiting Stronghold & Testing Battlefield / Tree Gnome Village ===");
  await bot.walkTo(2461, 3385, 3);
  const sGate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && Math.hypot(l.x - 2461, l.z - 3382) <= 6);
  if (sGate) {
    const opt = sGate.optionsWithIndex[0]?.text;
    if (opt) {
      await bot.interactLoc(sGate, opt);
      await sdk.waitForTicks(6);
      await clearDialog(sdk);
    }
  }

  for (const [wx, wz, pat] of [
    [2523, 3295, /elkoy/i],
    [2525, 3205, /commander montai|tracker/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
      await testNpc(bot, sdk, n);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
