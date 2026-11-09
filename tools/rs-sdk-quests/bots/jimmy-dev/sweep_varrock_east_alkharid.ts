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

  // 1. In Varrock Palace (3227, 3490): walk to Reldo (647) at (3210, 3494) by opening library door
  console.log("=== Testing Reldo (647), Sir Pryzin, Curator, Apothecary, Baraek ===");
  await bot.walkTo(3211, 3491, 2);
  for (let i = 0; i < 3; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - 3211, l.z - 3491) <= 5);
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(3210, 3494, true);
    await sdk.waitForTicks(3);
  }
  const reldo = sdk.findNearbyNpc(/reldo/i);
  if (reldo) await testNpc(bot, sdk, reldo);

  // Exit library and test Sir Pryzin (883), Baraek (547) at (3217, 3434), Curator (646) at (3256, 3448), Apothecary (638) at (3195, 3404)
  for (const [wx, wz, pat] of [
    [3212, 3475, /sir pryzin/i],
    [3217, 3434, /baraek/i],
    [3256, 3448, /curator/i],
    [3270, 3429, /fancy dress/i],
    [3272, 3412, /tea seller/i],
    [3274, 3390, /bartender/i],
    [3195, 3404, /apothecary/i],
    [3180, 3436, /banker/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 3);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // 2. Walk south along east bank of River Lum into Al Kharid (no toll gate needed!)
  console.log("=== Walking south along east bank of River Lum into Al Kharid ===");
  for (const [wx, wz] of [
    [3245, 3365],
    [3260, 3320],
    [3278, 3275],
    [3292, 3225],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }

  for (const [wx, wz, pat] of [
    [3286, 3211, /gem trader/i],
    [3299, 3204, /silk trader/i],
    [3287, 3189, /zeke/i],
    [3315, 3175, /louie legs/i],
    [3315, 3163, /ranael/i],
    [3273, 3180, /karim/i],
    [3289, 3163, /hassan/i],
    [3286, 3180, /osman/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 3);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
