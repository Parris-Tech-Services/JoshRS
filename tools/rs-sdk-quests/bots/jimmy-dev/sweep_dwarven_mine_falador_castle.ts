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

  // Update Guard (1076) in REPORT.md since game message said "The guard won't talk whilst on duty."
  recordResult("OK", 1076, "Guard", 2897, 3556, 0, 'Talk-to -> game message: "The guard won\'t talk whilst on duty."');

  // 1. Climb down trapdoor at (3019, 3450) into Dwarven Mine
  console.log("=== Entering Dwarven Mine via Trapdoor at (3019, 3450) ===");
  await bot.walkTo(3018, 3450, 2);
  const td = sdk.findNearbyLoc(/trapdoor|ladder/i);
  if (td) {
    const opt = td.optionsWithIndex.find(o => /open|climb-down/i.test(o.text))?.text;
    if (opt) {
      await bot.interactLoc(td, opt);
      await sdk.waitForTicks(4);
    }
    const td2 = sdk.findNearbyLoc(/trapdoor|ladder/i);
    const opt2 = td2?.optionsWithIndex.find(o => /climb-down/i.test(o.text))?.text;
    if (td2 && opt2) {
      await bot.interactLoc(td2, opt2);
      await sdk.waitForTicks(4);
    }
  }

  if ((sdk.getState()?.player?.worldZ || 0) > 9000) {
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

    // Climb back up to Falador (3061, 3377) via southern stairs at (3060, 9776) or ladder at (3019, 9850)
    await bot.walkTo(3019, 9850, 3);
    const up = sdk.findNearbyLoc(/ladder/i);
    if (up) {
      await bot.interactLoc(up, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }

  // 2. Walk to Falador Castle & White Knights: Sir Amik Varze (608), Sir Vyvin (605), Squire (606), Sir Tiffy Cashien (2290?), Gardener (1217), Redbeard/Party Pete
  console.log("=== Testing Falador Castle & Park NPCs ===");
  for (const [wx, wz, pat] of [
    [2997, 3375, /sir tiffy/i],
    [3002, 3383, /gardener/i],
    [2965, 3365, /squire/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // Climb west tower of White Knights' Castle (2955, 3339) -> L1 -> L2 for Sir Amik Varze (608), and east tower (2984, 3338) -> L2 for Sir Vyvin (605)
  await bot.walkTo(2957, 3339, 3);
  for (let lv = 0; lv < 2; lv++) {
    const st = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (st) {
      await bot.interactLoc(st, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }
  if (sdk.getState()?.player?.level === 2) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(2961, 3339, true);
      await sdk.waitForTicks(3);
    }
    const amik = sdk.findNearbyNpc(/sir amik/i);
    if (amik) await testNpc(bot, sdk, amik);
    for (let lv = 0; lv < 2; lv++) {
      const down = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
      if (down) {
        await bot.interactLoc(down, "Climb-down");
        await sdk.waitForTicks(4);
      }
    }
  }

  // Climb east tower (2984, 3338) -> L2 for Sir Vyvin (605)
  await bot.walkTo(2984, 3338, 3);
  for (let lv = 0; lv < 2; lv++) {
    const st = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (st) {
      await bot.interactLoc(st, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }
  if (sdk.getState()?.player?.level === 2) {
    const vyvin = sdk.findNearbyNpc(/sir vyvin/i);
    if (vyvin) await testNpc(bot, sdk, vyvin);
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
