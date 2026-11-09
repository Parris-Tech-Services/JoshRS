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

  // 1. Climb down from L1 in White Knights' Castle to L0
  if (sdk.getState()?.player?.level === 1) {
    const down = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down) {
      await bot.interactLoc(down, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Test Squire (606) in courtyard (2975, 3343)
  await bot.walkTo(2975, 3343, 3);
  const squire = sdk.findNearbyNpc(/squire/i);
  if (squire) await testNpc(bot, sdk, squire);

  // Climb east tower staircase at (2984, 3338) -> L1 -> L2 for Sir Vyvin (605)
  await bot.walkTo(2984, 3338, 3);
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
      await sdk.sendWalk(2982, 3336, true);
      await sdk.waitForTicks(3);
    }
    const vyvin = sdk.findNearbyNpc(/sir vyvin/i);
    if (vyvin) await testNpc(bot, sdk, vyvin);
    for (let lv = 0; lv < 2; lv++) {
      const down = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
      if (down) {
        await bot.interactLoc(down, "Climb-down");
        await sdk.waitForTicks(4);
      }
    }
  }

  // 2. Test Gardener (1217) in Falador Park (2999, 3383)
  await bot.walkTo(2999, 3383, 2);
  const gardener = sdk.findNearbyNpc(/gardener/i);
  if (gardener) await testNpc(bot, sdk, gardener);

  // 3. Walk to southern Dwarven Mine stairs at (3060, 3377) and test Nurmof (594), Boot (665), General Store Dwarf (582)
  console.log("=== Entering Southern Dwarven Mine (3060, 3377) ===");
  await bot.walkTo(3060, 3377, 3);
  for (let i = 0; i < 2; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - 3061, l.z - 3375) <= 5);
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
  }
  const mineStairs = sdk.getNearbyLocs().find(l => /staircase|stairs/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
  if (mineStairs) {
    await bot.interactLoc(mineStairs, "Climb-down");
    await sdk.waitForTicks(4);
  }
  if ((sdk.getState()?.player?.worldZ || 0) > 9000) {
    for (const [wx, wz, pat] of [
      [3035, 9775, null],
      [3014, 9816, /nurmof/i],
      [2984, 9811, /boot/i],
      [2997, 9826, /dwarf/i],
    ] as [number, number, RegExp | null][]) {
      await bot.walkTo(wx, wz, 4);
      if (pat) {
        const n = sdk.getNearbyNpcs().find((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)));
        if (n) await testNpc(bot, sdk, n);
      }
    }
    // Climb back up at (3019, 9850)
    await bot.walkTo(3019, 9850, 3);
    const up = sdk.findNearbyLoc(/ladder/i);
    if (up) {
      await bot.interactLoc(up, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }

  // 4. Walk to Goblin Village -> Taverley -> White Wolf Mountain -> Catherby (Harry 576, Hickton 575, Vanessa, Chef) -> Seers' Village (Stankers, Poison salesman, Phantuwti, Bartender, Party Pete)
  console.log("=== Walking across White Wolf Mountain to Catherby & Seers' Village ===");
  for (const [wx, wz, pat] of [
    [2935, 3451, null],
    [2880, 3465, null],
    [2855, 3485, /captain|grimgnash/i],
    [2845, 3435, null],
    [2834, 3445, /harry/i],
    [2820, 3460, /vanessa/i],
    [2760, 3475, /phantuwti/i],
    [2725, 3491, /bartender|poison salesman/i],
    [2725, 3491, /poison salesman/i],
    [2737, 3468, /party pete|megan|lucy/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
