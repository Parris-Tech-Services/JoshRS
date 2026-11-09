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

  // 1. Test Shantay (836) at Shantay Pass (3304, 3120)
  console.log("=== Testing Shantay (836) at Shantay Pass (3304, 3120) ===");
  for (const [wx, wz] of [
    [3293, 3145],
    [3304, 3122],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  const shantay = sdk.findNearbyNpc(/^shantay$/i);
  if (shantay) await testNpc(bot, sdk, shantay);

  // 2. Walk north through Al Kharid -> Varrock East -> Paterdomus -> Canifis
  console.log("=== Walking to Paterdomus & Canifis ===");
  for (const [wx, wz] of [
    [3295, 3180],
    [3290, 3235],
    [3285, 3290],
    [3290, 3350],
    [3315, 3405],
    [3360, 3450],
    [3402, 3485],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }

  // Test Drezel / Monk of Zamorak at Paterdomus (3405, 3489) or underground (3439, 9896)
  const trapdoor = sdk.getNearbyLocs().find(l => /trapdoor/i.test(l.name) && Math.hypot(l.x - 3405, l.z - 3507) <= 15);
  await bot.walkTo(3405, 3505, 3);
  const td = sdk.findNearbyLoc(/trapdoor/i);
  if (td) {
    if (td.optionsWithIndex.some(o => /open/i.test(o.text))) {
      await bot.interactLoc(td, "Open");
      await sdk.waitForTicks(3);
    }
    const tdOpen = sdk.findNearbyLoc(/trapdoor/i);
    if (tdOpen && tdOpen.optionsWithIndex.some(o => /climb-down/i.test(o.text))) {
      await bot.interactLoc(tdOpen, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }
  if ((sdk.getState()?.player?.worldZ || 0) > 9000) {
    await bot.walkTo(3422, 9889, 4);
    // Open gate to Morytania if reachable
    for (const [wx, wz] of [[3438, 9896], [3440, 9887]] as [number, number][]) {
      for (let i = 0; i < 3; i++) {
        const g = sdk.getNearbyLocs().find(l => /gate|door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
        if (g) {
          await bot.openDoor(g);
          await sdk.waitForTicks(2);
        }
        await sdk.sendWalk(wx, wz, true);
        await sdk.waitForTicks(3);
      }
    }
    const drezel = sdk.findNearbyNpc(/drezel/i);
    if (drezel) await testNpc(bot, sdk, drezel);

    // Climb holy barrier / well out to Morytania (3423, 3485)
    await bot.walkTo(3442, 9887, 3);
    const portalOrLadder = sdk.getNearbyLocs().find(l => /holy barrier|ladder|portal/i.test(l.name));
    if (portalOrLadder) {
      const opt = portalOrLadder.optionsWithIndex[0]?.text;
      if (opt) {
        await bot.interactLoc(portalOrLadder, opt);
        await sdk.waitForTicks(5);
      }
    }
  }

  // If in Morytania (x >= 3420, z < 4000), walk to Canifis (3495, 3478) and test Fidelio, Barker, Rufus, Roavar, Sbott, Taxidermist, Mazchna
  const px = sdk.getState()?.player?.worldX || 0;
  const pz = sdk.getState()?.player?.worldZ || 0;
  console.log(`After Paterdomus: at (${px}, ${pz})`);
  if (px >= 3420 && pz < 4000) {
    for (const [wx, wz, pat] of [
      [3444, 3458, /ulizius/i],
      [3468, 3485, null],
      [3505, 3505, /mazchna/i],
      [3495, 3478, /fidelio/i],
      [3497, 3471, /barker/i],
      [3507, 3494, /rufus/i],
      [3494, 3474, /roavar/i],
      [3491, 3486, /sbott/i],
    ] as [number, number, RegExp | null][]) {
      await bot.walkTo(wx, wz, 4);
      if (pat) {
        const n = sdk.findNearbyNpc(pat);
        if (n) await testNpc(bot, sdk, n);
      }
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
