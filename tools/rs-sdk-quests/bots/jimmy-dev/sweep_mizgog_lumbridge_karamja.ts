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

  // 1. We are at (3111, 3165, L1) in Wizards' Tower. Open interior doors back to staircase at (3104, 3160, L1)
  if (sdk.getState()?.player?.level === 1) {
    for (const [wx, wz] of [[3109, 3164], [3107, 3162], [3105, 3160]] as [number, number][]) {
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
    const st1 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (st1) {
      await bot.interactLoc(st1, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }

  // Test Wizard Mizgog (706) & Wizard Grayzag (707) on L2
  if (sdk.getState()?.player?.level === 2) {
    for (const [wx, wz] of [[3105, 3162], [3106, 3164]] as [number, number][]) {
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
    for (const pat of [/mizgog/i, /grayzag/i]) {
      const w = sdk.findNearbyNpc(pat);
      if (w) await testNpc(bot, sdk, w);
    }

    // Return to staircase at (3105, 3160, L2) and climb down
    for (const [wx, wz] of [[3105, 3162], [3105, 3160]] as [number, number][]) {
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
    const down2 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down2) {
      await bot.interactLoc(down2, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  if (sdk.getState()?.player?.level === 1) {
    const down1 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down1) {
      await bot.interactLoc(down1, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Exit Wizards' Tower on L0 through diagonal door at (3107, 3162) and outer door at (3109, 3167)
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

  // Walk to Father Aereck (456) in Lumbridge (3243, 3206) and Bob (519) in Bob's Brilliant Axes (3230, 3203)
  console.log("=== Heading to Lumbridge: Bob (519) & Father Aereck (456) ===");
  for (const [wx, wz] of [
    [3112, 3205],
    [3160, 3220],
    [3215, 3218],
    [3230, 3203],
  ] as [number, number][]) {
    await bot.walkTo(wx, wz, 3);
  }
  const bob = sdk.findNearbyNpc(/^bob$/i);
  if (bob) await testNpc(bot, sdk, bob);

  await bot.walkTo(3243, 3206, 3);
  const aereck = sdk.findNearbyNpc(/father aereck/i);
  if (aereck) await testNpc(bot, sdk, aereck);

  // Pickpocket Man/Woman in Lumbridge for >= 120gp
  await bot.walkTo(3222, 3218, 4);
  for (let i = 0; i < 45; i++) {
    const coins = sdk.findInventoryItem(/coins/i);
    if (coins && coins.count >= 120) break;
    const man = sdk.findNearbyNpc(/^(man|woman)$/i);
    if (man) {
      await bot.pickpocketNpc(man);
      await sdk.waitForTicks(2);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
