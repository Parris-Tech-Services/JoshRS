import { runScript } from "../../sdk/runner";
import * as fs from "fs";

const REPORT_PATH = "/home/josh/dev/jimmy-sandbox/REPORT.md";
const LOG_PATH = "/home/josh/dev/jimmy-sandbox/rs-sdk/bots/jimmy-dev/lab_log.md";

function recordResult(status: string, id: number | string, name: string, x: number, z: number, level: number, notes: string) {
  const report = fs.readFileSync(REPORT_PATH, "utf8");
  const line = `- **${status}** | \`${id}\` (${name}) @ (${x}, ${z}, L${level}) — ${notes}\n`;
  if (!report.includes(`\`${id}\` (${name})`)) {
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

async function testNpc(bot: any, sdk: any, npc: any) {
  const level = sdk.getState()?.player?.level || 0;
  sdk.getNewChat();
  await bot.talkTo(npc);
  await sdk.waitForTicks(3);
  const dlg = sdk.getDialog();
  const text = getDialogString(dlg);
  const chat = sdk.getNewChat().map((c: any) => c.text).join(" | ");
  for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
    await sdk.sendClickDialog(0);
    await sdk.waitForTicks(2);
  }
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
  await bot.dismissBlockingUI();
  while (sdk.getDialog()?.isOpen) {
    await sdk.sendClickDialog(0);
    await sdk.waitForTicks(2);
  }

  // 1. Walk to Wizard's Tower (3109, 3167)
  console.log("=== Walking to Wizards' Tower (3109, 3167) ===");
  for (const [wx, wz] of [
    [3060, 3240],
    [3095, 3230],
    [3110, 3200],
    [3109, 3167],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }

  // Open outer and diagonal doors of Wizards' Tower
  for (const [wx, wz] of [[3109, 3165], [3107, 3162], [3104, 3162]] as [number, number][]) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 5);
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(wx, wz, true);
      await sdk.waitForTicks(3);
    }
  }

  // Climb down ladder at (3104, 3162) to basement for Sedridor (300)
  const bsmLadder = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
  if (bsmLadder) {
    await bot.interactLoc(bsmLadder, "Climb-down");
    await sdk.waitForTicks(4);
    await bot.walkTo(3104, 9571, 3);
    const sed = sdk.findNearbyNpc(/sedridor/i);
    if (sed) await testNpc(bot, sdk, sed);
    await bot.walkTo(3104, 9576, 2);
    const upLadder = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (upLadder) {
      await bot.interactLoc(upLadder, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }

  // Climb staircase at (3104, 3160) to L1 -> Traiborn (881), then L2 -> Wizard Mizgog (706) & Wizard Grayzag (707)
  const st0 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (st0) {
    await bot.interactLoc(st0, "Climb-up");
    await sdk.waitForTicks(4);
  }
  if (sdk.getState()?.player?.level === 1) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(3112, 3162, true);
      await sdk.waitForTicks(3);
    }
    const traiborn = sdk.findNearbyNpc(/traiborn/i);
    if (traiborn) await testNpc(bot, sdk, traiborn);

    await sdk.sendWalk(3105, 3160, true);
    await sdk.waitForTicks(3);
    const st1 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (st1) {
      await bot.interactLoc(st1, "Climb-up");
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
      await sdk.sendWalk(3106, 3163, true);
      await sdk.waitForTicks(3);
    }
    for (const pat of [/mizgog/i, /grayzag/i]) {
      const w = sdk.findNearbyNpc(pat);
      if (w) await testNpc(bot, sdk, w);
    }

    // Climb back down L2 -> L1 -> L0
    await sdk.sendWalk(3105, 3160, true);
    await sdk.waitForTicks(3);
    const d2 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (d2) {
      await bot.interactLoc(d2, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }
  if (sdk.getState()?.player?.level === 1) {
    const d1 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (d1) {
      await bot.interactLoc(d1, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Exit Wizards' Tower to (3109, 3168)
  for (const [wx, wz] of [[3107, 3162], [3109, 3165], [3109, 3168]] as [number, number][]) {
    for (let i = 0; i < 2; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 5);
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(wx, wz, true);
      await sdk.waitForTicks(3);
    }
  }

  // 2. Walk to Father Aereck (456) in Lumbridge Church (3243, 3206) and pickpocket Men in Lumbridge until we have >= 120gp for ships
  console.log("=== Heading to Father Aereck (456) in Lumbridge (3243, 3206) ===");
  for (const [wx, wz] of [
    [3112, 3205],
    [3160, 3220],
    [3215, 3218],
    [3243, 3206],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  const aereck = sdk.findNearbyNpc(/father aereck/i);
  if (aereck) await testNpc(bot, sdk, aereck);

  // Pickpocket Man/Woman for 90gp so we can sail to Karamja and Brimhaven/Ardougne
  console.log("=== Getting coins for ship fares ===");
  for (let i = 0; i < 40; i++) {
    const coins = sdk.findInventoryItem(/coins/i);
    if (coins && coins.count >= 90) break;
    const man = sdk.findNearbyNpc(/^(man|woman)$/i);
    if (man) {
      await bot.pickpocketNpc(man);
      await sdk.waitForTicks(2);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
