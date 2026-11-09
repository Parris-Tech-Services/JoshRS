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

  // 1. Walk to Brimstail's cave entrance (2403, 3419) -> enter cave -> test Brimstail (171) -> exit
  console.log("=== Testing Brimstail (171) ===");
  for (const [wx, wz] of [
    [2445, 3415],
    [2403, 3419],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
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

  // 2. Walk to Gnome Ball Gate (2395, 3480) -> open gate -> test Gnome ball referee (635) -> exit
  console.log("=== Testing Gnome Ball Referee (635) ===");
  for (const [wx, wz] of [
    [2415, 3455],
    [2398, 3478],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  const gbGate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.optionsWithIndex.length > 0);
  if (gbGate) {
    await bot.interactLoc(gbGate, gbGate.optionsWithIndex[0].text);
    await sdk.waitForTicks(4);
    const ref = sdk.findNearbyNpc(/referee/i);
    if (ref) await testNpc(bot, sdk, ref);
    const gbGate2 = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.optionsWithIndex.length > 0);
    if (gbGate2) {
      await bot.interactLoc(gbGate2, gbGate2.optionsWithIndex[0].text);
      await sdk.waitForTicks(4);
    }
  }

  // 3. Walk to Grand Tree (2465, 3490), open double door, climb ladder to L1 -> Hudo (600), Gulluck (602), Gianne jnr (849), Dalila (850), Gnome waiter (851), Gnome banker (166), then L2 -> L3 for Captain Errdo (381)
  console.log("=== Testing Grand Tree L1/L3 NPCs ===");
  await bot.walkTo(2465, 3491, 3);
  for (let i = 0; i < 2; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(2466, 3495, true);
    await sdk.waitForTicks(3);
  }
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
}, { bot: "jimmy-dev", disconnectAfter: true });
