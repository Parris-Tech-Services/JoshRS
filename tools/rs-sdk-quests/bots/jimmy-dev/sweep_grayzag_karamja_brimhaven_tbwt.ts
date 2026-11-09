import { runScript } from "../../sdk/runner";
import * as fs from "fs";

const REPORT_PATH = "/home/josh/dev/jimmy-sandbox/REPORT.md";
const LOG_PATH = "/home/josh/dev/jimmy-sandbox/rs-sdk/bots/jimmy-dev/lab_log.md";

function recordResult(status: string, id: number | string, name: string, x: number, z: number, level: number, notes: string) {
  let report = fs.readFileSync(REPORT_PATH, "utf8");
  const line = `- **${status}** | \`${id}\` (${name}) @ (${x}, ${z}, L${level}) — ${notes}\n`;
  // Replace FAIL line if re-verified OK
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

  // Pickpocket a few more times to have >= 120gp
  for (let i = 0; i < 20; i++) {
    const coins = sdk.findInventoryItem(/coins/i);
    if (coins && coins.count >= 120) break;
    const man = sdk.findNearbyNpc(/^(man|woman)$/i);
    if (man) {
      await bot.pickpocketNpc(man);
      await sdk.waitForTicks(2);
    }
  }

  // 1. Walk to Wizards' Tower L2 and properly enter Wizard Grayzag's room (3109, 3162, L2)
  console.log("=== Re-testing Wizard Grayzag (707) inside his room on L2 ===");
  for (const [wx, wz] of [
    [3160, 3220],
    [3112, 3205],
    [3109, 3167],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  for (const [wx, wz] of [[3109, 3165], [3107, 3162], [3104, 3160]] as [number, number][]) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 4);
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(wx, wz, true);
      await sdk.waitForTicks(3);
    }
  }
  for (let lv = 0; lv < 2; lv++) {
    const st = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (st) {
      await bot.interactLoc(st, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }
  if (sdk.getState()?.player?.level === 2) {
    for (const [wx, wz] of [[3105, 3162], [3107, 3162], [3109, 3162]] as [number, number][]) {
      for (let i = 0; i < 3; i++) {
        const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 4);
        if (d) {
          await bot.openDoor(d);
          await sdk.waitForTicks(2);
        }
        await sdk.sendWalk(wx, wz, true);
        await sdk.waitForTicks(3);
      }
    }
    const grayzag = sdk.findNearbyNpc(/grayzag/i);
    if (grayzag) await testNpc(bot, sdk, grayzag);

    // Climb down L2 -> L1 -> L0
    for (const [wx, wz] of [[3107, 3162], [3105, 3160]] as [number, number][]) {
      for (let i = 0; i < 2; i++) {
        const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 4);
        if (d) {
          await bot.openDoor(d);
          await sdk.waitForTicks(2);
        }
        await sdk.sendWalk(wx, wz, true);
        await sdk.waitForTicks(3);
      }
    }
    for (let lv = 0; lv < 2; lv++) {
      const down = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
      if (down) {
        await bot.interactLoc(down, "Climb-down");
        await sdk.waitForTicks(4);
      }
    }
  }

  // Exit Wizards' Tower to (3109, 3168)
  for (const [wx, wz] of [[3106, 3161], [3108, 3163], [3109, 3166], [3109, 3168]] as [number, number][]) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 4);
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(wx, wz, true);
      await sdk.waitForTicks(3);
    }
  }

  // 2. Walk to Port Sarim (3027, 3218) and sail to Karamja (2956, 3146)
  console.log("=== Walking to Port Sarim Dock (3027, 3218) ===");
  for (const [wx, wz] of [
    [3111, 3205],
    [3080, 3245],
    [3045, 3235],
    [3027, 3218],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  const seaman = sdk.findNearbyNpc(/seaman|captain tobias/i);
  if (seaman) {
    await bot.talkTo(seaman);
    await sdk.waitForTicks(3);
    for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
      const dlg = sdk.getDialog()!;
      const yesOpt = (dlg.options || []).find((o: any) => /yes/i.test(o.text));
      await sdk.sendClickDialog(yesOpt ? yesOpt.index : 0);
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

  // 3. On Karamja: test Luthas (379) at (2938, 3154) and Zambo (568) at (2927, 3145)
  console.log("=== Testing Karamja: Luthas (379) & Zambo (568) ===");
  await bot.walkTo(2938, 3152, 3);
  const luthas = sdk.findNearbyNpc(/luthas/i);
  if (luthas) await testNpc(bot, sdk, luthas);

  await bot.walkTo(2927, 3145, 3);
  const zambo = sdk.findNearbyNpc(/zambo/i);
  if (zambo) await testNpc(bot, sdk, zambo);

  // 4. Walk to Brimhaven: Davon (588) @ (2777, 3180), Lubufu (1171) @ (2769, 3171), Saniboch (1595) @ (2745, 3152), Grubor (789) @ (2812, 3171), Trobert (790) @ (2806, 3174)
  console.log("=== Testing Brimhaven NPCs ===");
  for (const [wx, wz, pat] of [
    [2890, 3155, null],
    [2845, 3165, null],
    [2806, 3174, /trobert/i],
    [2777, 3180, /davon/i],
    [2769, 3171, /lubufu/i],
    [2745, 3152, /saniboch/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 3);
    if (pat) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
  }

  // 5. Walk south to Tai Bwo Wannai: Jiminua (560) @ (2767, 3122), Trufitus (740) @ (2809, 3085), Timfraku (1162) @ (2782, 3087, L1), Gabooty (2520) / Tiadeche / Tamayu (1167) @ (2844, 3042)
  console.log("=== Testing Tai Bwo Wannai NPCs ===");
  for (const [wx, wz, pat] of [
    [2767, 3122, /jiminua/i],
    [2809, 3085, /trufitus/i],
    [2790, 3088, /gabooty/i],
    [2844, 3042, /tamayu/i],
    [2764, 2976, /tinsay/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
