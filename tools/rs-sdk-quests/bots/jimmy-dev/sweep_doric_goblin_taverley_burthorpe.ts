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

  // 1. From Paterdomus (3405, 3506), walk west to Lumber Yard / Jolly Boar Inn (3275, 3490) -> Doric (284) @ (2951, 3451) -> Goblin Generals (298, 299) @ (2957, 3512)
  console.log("=== Walking from Paterdomus to Jolly Boar Inn, Doric, Goblin Village, and Taverley ===");
  for (const [wx, wz, pat] of [
    [3360, 3480, null],
    [3305, 3490, /sawmill|serf/i],
    [3285, 3495, null],
    [3275, 3490, /bartender/i],
    [3225, 3450, null],
    [3165, 3440, null],
    [3105, 3450, null],
    [3050, 3450, null],
    [2995, 3450, null],
    [2951, 3451, /doric/i],
    [2957, 3512, /general wartface/i],
    [2957, 3512, /general bentnoze/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
  }

  // 2. Walk through Taverley Gate (2935, 3451) into Taverley: Gaius (587), Jatix (586), Lady of the Lake (250), Sanfew (454), Kaqemeex (455), Boy (895), Tegid (1213), Pikkupstix (1592)
  console.log("=== Testing Taverley NPCs ===");
  for (const [wx, wz, pat] of [
    [2935, 3451, null],
    [2925, 3480, /kaqemeex/i],
    [2885, 3460, /gaius/i],
    [2898, 3428, /jatix/i],
    [2899, 3429, /sanfew/i],
    [2908, 3417, /tegid/i],
    [2924, 3403, /lady of the lake/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      // If Sanfew is on L1 of Jatix's house (2899, 3429), climb staircase
      if (pat.source.includes("sanfew")) {
        const st = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
        if (st) {
          await bot.interactLoc(st, "Climb-up");
          await sdk.waitForTicks(4);
        }
      }
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
      if (sdk.getState()?.player?.level === 1) {
        const down = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
        if (down) {
          await bot.interactLoc(down, "Climb-down");
          await sdk.waitForTicks(4);
        }
      }
    }
  }

  // 3. Walk north to Burthorpe: Eohric (1060), Dunstan (1082), Turael (70), Achietties (796), Helemos (797)
  console.log("=== Testing Burthorpe & Heroes' Guild NPCs ===");
  for (const [wx, wz, pat] of [
    [2900, 3510, /achietties/i],
    [2919, 3535, /turael/i],
    [2919, 3574, /dunstan/i],
    [2898, 3562, /eohric|harold/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
