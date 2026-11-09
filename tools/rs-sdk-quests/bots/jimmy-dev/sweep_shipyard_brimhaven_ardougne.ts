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
      const cancelOpt = opts.find((o: any) => /nevermind|no|goodbye|bye|nothing|leave/i.test(o.text)) || opts[opts.length - 1];
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
  // Drink beer if we have one for +1 HP
  const beer = sdk.findInventoryItem(/^beer$/i);
  if (beer) {
    await bot.eatFood(beer);
    await sdk.waitForTicks(2);
  }

  // 1. Walk east to Karamja Shipyard: Shipyard worker (675) @ (2944, 3040), G.L.O. Caranock (1427) @ (2956, 3025), Foreman (674) @ (2999, 3043)
  console.log("=== Testing Karamja Shipyard ===");
  await bot.walkTo(2944, 3040, 3);
  const sw = sdk.findNearbyNpc(/shipyard worker/i);
  if (sw) await testNpc(bot, sdk, sw);

  // Open gate if needed or test Caranock / Foreman
  const gate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && Math.hypot(l.x - 2945, l.z - 3041) <= 5);
  if (gate) {
    await bot.openDoor(gate);
    await sdk.waitForTicks(4);
    await clearDialog(sdk);
  }

  // 2. Walk back to Brimhaven: test Trobert (790) inside (2807, 3174), Davon (588) inside (2777, 3180)
  console.log("=== Returning to Brimhaven ===");
  for (const [wx, wz] of [
    [2900, 3055],
    [2860, 3110],
    [2830, 3155],
    [2808, 3170],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }
  // Open Trobert's house door at (2808, 3171)
  for (let i = 0; i < 3; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - 2808, l.z - 3171) <= 5);
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(2807, 3173, true);
    await sdk.waitForTicks(3);
  }
  const trobert = sdk.findNearbyNpc(/trobert/i);
  if (trobert) await testNpc(bot, sdk, trobert);

  // Exit Trobert's house and go to Davon (588) at (2777, 3180)
  for (let i = 0; i < 2; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - 2808, l.z - 3171) <= 5);
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(2808, 3169, true);
    await sdk.waitForTicks(3);
  }
  await bot.walkTo(2777, 3179, 3);
  const davon = sdk.findNearbyNpc(/davon/i);
  if (davon) await testNpc(bot, sdk, davon);

  // 3. Walk to Brimhaven dock (2772, 3225) and sail to Ardougne via Customs officer (380)
  console.log("=== Sailing Brimhaven -> Ardougne via Customs officer (380) ===");
  await bot.walkTo(2772, 3225, 3);
  const customs = sdk.findNearbyNpc(/customs officer/i);
  if (customs) {
    await bot.talkTo(customs);
    await sdk.waitForTicks(3);
    for (let i = 0; i < 12 && sdk.getDialog()?.isOpen; i++) {
      const dlg = sdk.getDialog()!;
      const opts = dlg.options || [];
      if (opts.length >= 2) {
        const match = opts.find((o: any) => /journey|search away|ok/i.test(o.text)) || opts[0];
        await sdk.sendClickDialog(match.index);
      } else {
        await sdk.sendClickDialog(0);
      }
      await sdk.waitForTicks(3);
    }
    await sdk.waitForTicks(6);
  }
  if (sdk.getState()?.player?.level === 1) {
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
      await bot.interactLoc(plank, "Cross");
      await sdk.waitForTicks(4);
    }
  }
  console.log(`Arrived at (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  // 4. In East Ardougne: test Silver merchant (569), Gem merchant (570), Baker (571), Silk merchant (574), Doctor Orbon (290), Brother Omad (279), Brother Cedric (280)
  console.log("=== Testing Ardougne Market & Monastery NPCs ===");
  for (const [wx, wz, pat] of [
    [2666, 3303, /silver merchant/i],
    [2668, 3303, /gem merchant/i],
    [2669, 3310, /baker/i],
    [2656, 3315, /silk merchant/i],
    [2616, 3295, /orbon/i],
    [2606, 3210, /brother omad/i],
    [2615, 3255, /brother cedric/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
