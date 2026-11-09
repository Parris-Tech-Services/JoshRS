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

  // 1. Walk to Al Kharid Palace & Gem Trader & Silk Trader & Louie Legs
  console.log("=== Walking to Al Kharid ===");
  for (const [wx, wz] of [
    [3253, 3225],
    [3267, 3227],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  // Open Al Kharid toll gate or walk around north at (3260, 3280) -> (3280, 3270)
  for (const [wx, wz] of [
    [3260, 3275],
    [3282, 3270],
    [3293, 3210],
    [3292, 3175],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }

  for (const [wx, wz, pat] of [
    [3289, 3163, /hassan|osman/i],
    [3289, 3163, /osman/i],
    [3286, 3211, /gem trader/i],
    [3299, 3204, /silk trader/i],
    [3315, 3175, /louie legs/i],
    [3286, 3189, /zeke/i],
    [3305, 3194, /ranael/i],
    [3273, 3180, /ellis|karim/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 3);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // 2. Walk north to Varrock East: Lowe (550), Horvik (549), Aubury (553), Father Lawrence (640), Reldo (647), King Roald (648)
  console.log("=== Walking to Varrock ===");
  for (const [wx, wz] of [
    [3285, 3240],
    [3275, 3310],
    [3253, 3395],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }

  for (const [wx, wz, pat] of [
    [3253, 3401, /aubury/i],
    [3233, 3423, /lowe/i],
    [3229, 3437, /horvik/i],
    [3216, 3415, /zaff/i],
    [3204, 3433, /baraek/i],
    [3254, 3482, /father lawrence/i],
    [3210, 3494, /reldo/i],
    [3221, 3473, /king roald/i],
    [3212, 3475, /sir pryzin/i],
    [3226, 3488, /aeonisig/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 3);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
