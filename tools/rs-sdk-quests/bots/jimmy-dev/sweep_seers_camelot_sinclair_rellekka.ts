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

  // 1. In Seers' Party Hall (2733, 3472): test Megan, Lucy, Knight, then climb to L1
  console.log("=== Testing Seers' Party Hall & Village NPCs ===");
  for (const pat of [/megan/i, /lucy/i]) {
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
  const pStairs = sdk.getNearbyLocs().find(l => /staircase|stairs/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (pStairs) {
    await bot.interactLoc(pStairs, "Climb-up");
    await sdk.waitForTicks(4);
    for (const pat of [/megan/i, /lucy/i, /knight/i]) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
    const down = sdk.getNearbyLocs().find(l => /staircase|stairs/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down) {
      await bot.interactLoc(down, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Test Seers' Village Forester Arms Bartender (737), Phantuwti (1798?), Stankers (383)
  for (const [wx, wz, pat] of [
    [2722, 3492, /bartender/i],
    [2702, 3473, /seer/i],
    [2695, 3494, /stankers/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 3);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // 2. Walk to Camelot Castle (2757, 3482) and test Sir Kay (241), Sir Gawain (240), Sir Lancelot (239), Sir Lucan (245), Sir Palomedes (3787?), Sir Bedivere (242), Sir Tristram (243), Sir Pelleas (244), Merlin (249)
  console.log("=== Testing Camelot Castle Knights ===");
  await bot.walkTo(2757, 3480, 3);
  const camGate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
  if (camGate) {
    await bot.openDoor(camGate);
    await sdk.waitForTicks(3);
  }
  await bot.walkTo(2758, 3502, 4);
  for (const pat of [/sir kay/i, /sir lucan/i, /sir bedivere/i, /sir tristram/i, /sir pelleas/i]) {
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // Enter Camelot Castle interior and climb to L1 for Sir Gawain, Sir Lancelot
  await bot.walkTo(2757, 3512, 3);
  for (const pat of [/sir gawain/i, /sir lancelot/i, /sir palomedes/i]) {
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
  const cStairs = sdk.getNearbyLocs().find(l => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (cStairs) {
    await bot.interactLoc(cStairs, "Climb-up");
    await sdk.waitForTicks(4);
    for (const pat of [/sir gawain/i, /sir lancelot/i, /merlin/i]) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
    const cDown = sdk.getNearbyLocs().find(l => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (cDown) {
      await bot.interactLoc(cDown, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // 3. Walk to Sinclair Mansion (2742, 3555) -> Guard, Stanford, Pierre, Donovan, Mary, Louisa, Anna, Bob, Carol, David, Elizabeth, Frank
  console.log("=== Testing Sinclair Mansion NPCs ===");
  for (const [wx, wz, pat] of [
    [2757, 3480, null],
    [2741, 3555, /guard/i],
    [2741, 3562, /pierre|hobbes|stanford|donovan|mary|louisa|anna|bob|carol|david|elizabeth|frank/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name))) {
        await testNpc(bot, sdk, n);
      }
    }
  }

  // 4. Walk north to Rellekka (2660, 3655): Brundt the Chieftain (1294), Yrsa (1301), Skulgrimen (1303), Sigmund the Merchant (1282), Fishmonger (1315), Fur trader (1316), Swensen the Navigator, Bjorn, Eldgrim, Styrmir, Olaf the Bard, Peer the Seer, Thorvald, Manni the Reveller, Thora the Barkeep
  console.log("=== Walking to Rellekka ===");
  for (const [wx, wz, pat] of [
    [2710, 3580, null],
    [2680, 3615, /olan|blanin|lalli/i],
    [2660, 3655, /brundt|sigmund|peksa|peer/i],
    [2658, 3672, /brundt|manni|thora|bjorn|eldgrim|styrmir/i],
    [2625, 3662, /yrsa|skulgrimen/i],
    [2643, 3678, /fishmonger|fur trader|sigmund/i],
    [2673, 3672, /olaf|thorvald|swensen/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
        await testNpc(bot, sdk, n);
      }
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
