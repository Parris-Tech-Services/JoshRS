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
  // 1. Inside Draynor Manor (3108, 3354): open interior doors, climb staircase at (3109, 3362) -> L1 -> ladder at (3105, 3363) -> L2
  console.log("=== Climbing Draynor Manor to Professor Oddenstein (286) ===");
  for (let i = 0; i < 3; i++) {
    const d = sdk.getNearbyLocs().find(l => /^door$/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(3108, 3361, true);
    await sdk.waitForTicks(3);
  }
  const s0 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (s0) {
    await bot.interactLoc(s0, "Climb-up");
    await sdk.waitForTicks(4);
  }
  if (sdk.getState()?.player?.level === 1) {
    await sdk.sendWalk(3105, 3363, true);
    await sdk.waitForTicks(4);
    const s1 = sdk.getNearbyLocs().find(l => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
    if (s1) {
      await bot.interactLoc(s1, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }
  if (sdk.getState()?.player?.level === 2) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.getNearbyLocs().find(l => /^door$/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(3110, 3367, true);
      await sdk.waitForTicks(3);
    }
    const odd = sdk.findNearbyNpc(/oddenstein/i);
    if (odd) await testNpc(bot, sdk, odd);

    // Climb back down L2 -> L1 -> L0
    await sdk.sendWalk(3105, 3363, true);
    await sdk.waitForTicks(3);
    const down2 = sdk.getNearbyLocs().find(l => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down2) {
      await bot.interactLoc(down2, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }
  if (sdk.getState()?.player?.level === 1) {
    await sdk.sendWalk(3109, 3366, true);
    await sdk.waitForTicks(3);
    const down1 = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down1) {
      await bot.interactLoc(down1, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Exit Draynor Manor via back door at (3123, 3361)
  console.log("=== Exiting Draynor Manor via East Door (3123, 3361) ===");
  for (const [wx, wz] of [[3115, 3361], [3123, 3361], [3126, 3361]] as [number, number][]) {
    for (let i = 0; i < 2; i++) {
      const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)) && Math.hypot(l.x - wx, l.z - wz) <= 6);
      if (d) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(wx, wz, true);
      await sdk.waitForTicks(4);
    }
  }

  // Walk around to Veronica (285) at (3110, 3330)
  await bot.walkTo(3110, 3330, 3);
  const veronica = sdk.findNearbyNpc(/veronica/i);
  if (veronica) await testNpc(bot, sdk, veronica);

  // Walk to Draynor Village: Aggie (922), Ned (918), Fortunato (369), Miss Schism (2634?), Morgan (283)
  console.log("=== Testing Draynor Village NPCs ===");
  for (const [wx, wz, pat] of [
    [3086, 3258, /aggie/i],
    [3097, 3257, /ned/i],
    [3085, 3250, /fortunato/i],
    [3098, 3268, /morgan/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 3);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // Walk to Port Sarim: Brian (559), Betty (583), Redbeard Frank (375), Monk of Entrana (2728/657), Klarense (744), Cabin Boy Jenkins (754)
  console.log("=== Testing Port Sarim NPCs ===");
  for (const [wx, wz, pat] of [
    [3027, 3249, /brian/i],
    [3014, 3258, /betty/i],
    [3053, 3251, /redbeard frank/i],
    [3046, 3235, /monk of entrana/i],
    [3041, 3205, /klarense/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 3);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
