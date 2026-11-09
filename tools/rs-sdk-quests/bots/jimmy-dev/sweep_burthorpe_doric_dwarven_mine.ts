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

  // 1. Inside Burthorpe Castle (2899, 3560): test Servant, Eadburg, Guard, then climb stairs to L1 for Eohric (1060)
  console.log("=== Testing Burthorpe Castle NPCs ===");
  for (const pat of [/servant/i, /eadburg/i, /guard/i]) {
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
  const st = sdk.getNearbyLocs().find(l => /staircase|stairs/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (st) {
    await bot.interactLoc(st, "Climb-up");
    await sdk.waitForTicks(4);
    const eohric = sdk.findNearbyNpc(/eohric/i);
    if (eohric) await testNpc(bot, sdk, eohric);
    const down = sdk.getNearbyLocs().find(l => /staircase|stairs/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down) {
      await bot.interactLoc(down, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // 2. Test Toad and Chicken Inn (2908, 3538) -> Bartender / Harold, then Turael (70) / Penda, then Doric (284) inside his hut (2951, 3451)
  for (const [wx, wz, pat] of [
    [2908, 3538, /bartender|ostler/i],
    [2925, 3536, /turael|penda/i],
    [2930, 3515, /bernald/i],
    [2935, 3451, null],
    [2953, 3450, null],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 3);
    if (pat) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
  }
  // Open Doric's door at (2953, 3450) and walk inside to (2951, 3451)
  for (let i = 0; i < 3; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - 2953, l.z - 3450) <= 5);
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(2951, 3451, true);
    await sdk.waitForTicks(3);
  }
  const doric = sdk.findNearbyNpc(/doric/i);
  if (doric) await testNpc(bot, sdk, doric);

  // Exit Doric's hut
  for (let i = 0; i < 2; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - 2953, l.z - 3450) <= 5);
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(2954, 3450, true);
    await sdk.waitForTicks(3);
  }

  // 3. Walk to Dwarven Mine entrance on Ice Mountain (3018, 3450) -> Drogo (579), Boot (665), Nurmof (594), General store (582)
  console.log("=== Testing Dwarven Mine NPCs ===");
  await bot.walkTo(2985, 3450, 4);
  await bot.walkTo(3018, 3450, 3);
  const mineLadder = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)) && Math.hypot(l.x - 3019, l.z - 3450) <= 6);
  if (mineLadder) {
    await bot.interactLoc(mineLadder, "Climb-down");
    await sdk.waitForTicks(4);
    for (const [wx, wz, pat] of [
      [3033, 9846, /drogo/i],
      [2997, 9845, /dwarf/i],
      [2984, 9811, /boot/i],
      [3014, 9816, /nurmof/i],
    ] as [number, number, RegExp][]) {
      await bot.walkTo(wx, wz, 4);
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
    // Climb back up at (3019, 9850)
    await bot.walkTo(3019, 9850, 3);
    const up = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (up) {
      await bot.interactLoc(up, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
