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

  // 1. In Rellekka (2675, 3683): test remaining Rellekka NPCs
  console.log("=== Testing Remaining Rellekka NPCs ===");
  for (const [wx, wz, pat] of [
    [2670, 3675, /freidir|inga|bouncer/i],
    [2661, 3657, /swensen|peer/i],
    [2666, 3693, /thorvald|jarvald|sailor/i],
    [2635, 3675, /fishmonger|skulgrimen/i],
    [2624, 3660, /skulgrimen|asleif/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
      await testNpc(bot, sdk, n);
    }
  }

  // 2. Walk south to Sinclair Mansion (2742, 3560), open interior doors to test Bob (815), Anna (814), Frank (819), Pierre (809), Mary (818), Donovan (810)
  console.log("=== Returning to Sinclair Mansion & Seers' Village ===");
  for (const [wx, wz] of [
    [2660, 3640],
    [2690, 3595],
    [2742, 3558],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 4);
  }
  for (const [wx, wz, pat] of [
    [2745, 3561, /bob/i],
    [2734, 3576, /anna/i],
    [2742, 3577, /frank/i],
    [2741, 3570, /pierre|mary|donovan/i],
  ] as [number, number, RegExp][]) {
    for (let i = 0; i < 2; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 5);
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await bot.walkTo(wx, wz, 2);
    }
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // 3. Walk to Seers' Village: Forester's Arms Bartender (737), Phantuwti (1798), Stankers (383), Thormac (389), Radimus Erkle (400), Galahad (218), Coal Truck / McGrubor's
  console.log("=== Testing Seers' Village, Galahad, Sorcerer's Tower, Legends' Guild ===");
  for (const [wx, wz, pat] of [
    [2741, 3555, null],
    [2695, 3494, /stankers/i],
    [2722, 3492, /bartender/i],
    [2702, 3405, /thormac/i],
    [2728, 3348, /radimus erkle|legends guard/i],
    [2612, 3475, /galahad/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      if (pat.source.includes("thormac")) {
        // Climb Sorcerer's Tower ladder L0 -> L1 -> L2 -> L3
        for (let lv = 0; lv < 3; lv++) {
          const l = sdk.getNearbyLocs().find(x => /ladder|staircase/i.test(x.name) && x.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
          if (l) {
            await bot.interactLoc(l, "Climb-up");
            await sdk.waitForTicks(4);
          }
        }
      }
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name))) {
        await testNpc(bot, sdk, n);
      }
      while ((sdk.getState()?.player?.level || 0) > 0) {
        const down = sdk.getNearbyLocs().find(x => /ladder|staircase/i.test(x.name) && x.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
        if (!down) break;
        await bot.interactLoc(down, "Climb-down");
        await sdk.waitForTicks(4);
      }
    }
  }

  // 4. Walk west to Fishing Guild (2611, 3391), East Ardougne Market (Silver merchant 569, Gem merchant 570, Baker 571, Silk merchant 574), Ardougne Castle (King Lathas 364, Paladin 365), Doctor Orbon (290), Brother Omad (279), Brother Cedric (280)
  console.log("=== Testing Fishing Guild & East Ardougne ===");
  for (const [wx, wz, pat] of [
    [2614, 3385, /master fisher/i],
    [2666, 3303, /silver merchant/i],
    [2668, 3303, /gem merchant/i],
    [2669, 3310, /baker/i],
    [2656, 3315, /silk merchant/i],
    [2616, 3295, /orbon/i],
    [2578, 3296, /paladin|hero|knight/i],
    [2606, 3210, /brother omad/i],
    [2615, 3255, /brother cedric/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
      await testNpc(bot, sdk, n);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
