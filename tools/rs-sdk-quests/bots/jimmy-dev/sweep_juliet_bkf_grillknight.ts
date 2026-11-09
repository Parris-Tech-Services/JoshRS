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

await runScript(async ({ bot, sdk }) => {
  // 1. Check Juliet on L1 (we are right next to her!)
  const juliet = sdk.findNearbyNpc(/juliet/i);
  if (juliet) {
    if (!sdk.getDialog()?.isOpen) {
      await bot.talkTo(juliet);
      await sdk.waitForTicks(3);
    }
    const dlg = sdk.getDialog();
    const text = getDialogString(dlg);
    recordResult(dlg?.isOpen ? "OK" : "FAIL", juliet.id, juliet.name, juliet.x, juliet.z, 1, `Talk-to -> "${text.slice(0, 120)}"`);
    for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
      await sdk.sendClickDialog(0);
      await sdk.waitForTicks(2);
    }
  }

  // Climb down from Juliet's house L1 -> L0
  if (sdk.getState()?.player?.level === 1) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.findNearbyLoc(/door/i);
      if (d && d.optionsWithIndex.some(o => /open/i.test(o.text))) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(3156, 3435, true);
      await sdk.waitForTicks(3);
    }
    const stairsDown = sdk.findNearbyLoc(/staircase/i);
    if (stairsDown) {
      await bot.interactLoc(stairsDown, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Exit Juliet's house to (3168, 3431)
  for (let i = 0; i < 3; i++) {
    const door = sdk.findNearbyLoc(/^door$/i);
    if (door && door.optionsWithIndex.some(o => /open/i.test(o.text))) {
      await bot.openDoor(door);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(3168, 3431, true);
    await sdk.waitForTicks(3);
  }

  // 2. Walk to Edgeville Monastery / Oziach / Edgeville General Store / Oracle / Ice Mountain / Black Knights' Fortress
  // First visit Gertrude (780) & Shilop/Wilough (781/783) if nearby at (3151, 3413)
  console.log("=== Testing Gertrude's house (3151, 3413) ===");
  await bot.walkTo(3151, 3413, 3);
  for (const pat of [/gertrude/i, /shilop/i, /wilough/i]) {
    const n = sdk.findNearbyNpc(pat);
    if (n) {
      await bot.talkTo(n);
      await sdk.waitForTicks(3);
      const dlg = sdk.getDialog();
      recordResult(dlg?.isOpen ? "OK" : "FAIL", n.id, n.name, n.x, n.z, 0, `Talk-to -> "${getDialogString(dlg).slice(0, 120)}"`);
      for (let i = 0; i < 5 && sdk.getDialog()?.isOpen; i++) {
        await sdk.sendClickDialog(0);
        await sdk.waitForTicks(2);
      }
    }
  }

  // 3. Walk to Edgeville General Store (3079, 3509) & Oziach (3068, 3516) & Black Knights' Fortress (3026, 3507)
  console.log("=== Heading to Edgeville & Black Knights' Fortress ===");
  const edgeWaypoints: [number, number][] = [
    [3135, 3445],
    [3105, 3480],
    [3080, 3508],
  ];
  for (const [wx, wz] of edgeWaypoints) {
    await bot.walkTo(wx, wz, 4);
  }

  // Test Edgeville General Store: Shop keeper (528) & Shop assistant (529) & Banker (494) & Abbot Langley/Monk if not visited
  for (const targetId of [528, 529]) {
    const npc = sdk.getNearbyNpcs().find(n => n.id === targetId);
    if (npc) {
      await bot.talkTo(npc);
      await sdk.waitForTicks(3);
      const dlg = sdk.getDialog();
      const text = getDialogString(dlg);
      for (let i = 0; i < 4 && sdk.getDialog()?.isOpen; i++) {
        await sdk.sendClickDialog(0);
        await sdk.waitForTicks(2);
      }
      if (npc.options.some(o => /trade/i.test(o))) {
        await bot.openShop(npc);
        await sdk.waitForTicks(3);
        const shopOpen = sdk.getState()?.interface?.isOpen;
        recordResult(dlg?.isOpen || shopOpen ? "OK" : "FAIL", npc.id, npc.name, npc.x, npc.z, 0, `Talk-to ("${text.slice(0, 80)}") + Trade (shopOpen=${shopOpen})`);
        await bot.closeInterface();
      } else {
        recordResult(dlg?.isOpen ? "OK" : "FAIL", npc.id, npc.name, npc.x, npc.z, 0, `Talk-to -> "${text.slice(0, 120)}"`);
      }
    }
  }

  // Walk to Oziach (747) at (3068, 3516)
  await bot.walkTo(3068, 3514, 3);
  const oziach = sdk.findNearbyNpc(/oziach/i);
  if (oziach) {
    await bot.talkTo(oziach);
    await sdk.waitForTicks(3);
    const dlg = sdk.getDialog();
    recordResult(dlg?.isOpen ? "OK" : "FAIL", oziach.id, oziach.name, oziach.x, oziach.z, 0, `Talk-to -> "${getDialogString(dlg).slice(0, 120)}"`);
    for (let i = 0; i < 5 && sdk.getDialog()?.isOpen; i++) {
      await sdk.sendClickDialog(0);
      await sdk.waitForTicks(2);
    }
  }

  // Walk to Black Knights' Fortress (3026, 3507)
  await bot.walkTo(3045, 3505, 4);
  await bot.walkTo(3026, 3507, 4);
  const nearBkf = sdk.getNearbyNpcs();
  console.log("Nearby at BKF:", nearBkf.map(n => `${n.id}:${n.name}@(${n.x},${n.z})[${n.options.join(",")}]`).join("; "));

  // Test Fortress Guard (609)
  const fGuard = nearBkf.find(n => n.id === 609);
  if (fGuard) {
    await bot.talkTo(fGuard);
    await sdk.waitForTicks(3);
    const dlg = sdk.getDialog();
    recordResult(dlg?.isOpen ? "OK" : "FAIL", fGuard.id, fGuard.name, fGuard.x, fGuard.z, 0, `Talk-to -> "${getDialogString(dlg).slice(0, 120)}"`);
    for (let i = 0; i < 5 && sdk.getDialog()?.isOpen; i++) {
      await sdk.sendClickDialog(0);
      await sdk.waitForTicks(2);
    }
  }

  // Test Black Knight (610 = grillknight) at (3028, 3508)
  const grillKnight = sdk.getNearbyNpcs().find(n => n.id === 610);
  if (grillKnight) {
    console.log(`Found grillknight (610) at (${grillKnight.x}, ${grillKnight.z}), reachable=${grillKnight.reachable}, options=${grillKnight.options.join(",")}`);
    sdk.getNewChat();
    await sdk.sendInteractNpc(grillKnight.index, 1); // opnpc1 directly in case behind sturdy door/grill
    await sdk.waitForTicks(5);
    const dlg = sdk.getDialog();
    const chat = sdk.getNewChat().map(c => c.text).join(" | ");
    console.log(`grillknight (610) result: dlg=${getDialogString(dlg)}, chat=${chat}`);
  }

  // 4. Walk to Oracle (746) on Ice Mountain (3014, 3501)
  await bot.walkTo(3014, 3501, 3);
  const oracle = sdk.findNearbyNpc(/oracle/i);
  if (oracle) {
    await bot.talkTo(oracle);
    await sdk.waitForTicks(3);
    const dlg = sdk.getDialog();
    recordResult(dlg?.isOpen ? "OK" : "FAIL", oracle.id, oracle.name, oracle.x, oracle.z, 0, `Talk-to -> "${getDialogString(dlg).slice(0, 120)}"`);
    for (let i = 0; i < 5 && sdk.getDialog()?.isOpen; i++) {
      await sdk.sendClickDialog(0);
      await sdk.waitForTicks(2);
    }
  }

  // 5. Walk to Draynor Manor top floor (L2) for Professor Oddenstein (286)
  console.log("=== Heading to Draynor Manor for Professor Oddenstein (286) ===");
  const manorWaypoints: [number, number][] = [
    [3035, 3460],
    [3065, 3420],
    [3090, 3380],
    [3108, 3353],
  ];
  for (const [wx, wz] of manorWaypoints) {
    await bot.walkTo(wx, wz, 4);
  }
  // Open Large door at (3108, 3353) to enter Draynor Manor
  const largeDoor = sdk.findNearbyLoc(/large door/i);
  if (largeDoor) {
    await bot.openDoor(largeDoor);
    await sdk.waitForTicks(4);
  }
  await bot.walkTo(3109, 3361, 2);
  // Test Veronica (285) outside if we passed her, or Ava/stairs inside
  const manorStairsL0 = sdk.findNearbyLoc(/staircase/i);
  if (manorStairsL0) {
    await bot.interactLoc(manorStairsL0, "Climb-up");
    await sdk.waitForTicks(4);
  }
  if (sdk.getState()?.player?.level === 1) {
    await bot.walkTo(3105, 3363, 2);
    const manorStairsL1 = sdk.findNearbyLoc(/staircase|ladder/i);
    if (manorStairsL1) {
      await bot.interactLoc(manorStairsL1, "Climb-up");
      await sdk.waitForTicks(4);
    }
  }
  if (sdk.getState()?.player?.level === 2) {
    for (let i = 0; i < 3; i++) {
      const d = sdk.findNearbyLoc(/door/i);
      if (d && d.optionsWithIndex.some(o => /open/i.test(o.text))) {
        await bot.openDoor(d);
        await sdk.waitForTicks(2);
      }
      await sdk.sendWalk(3110, 3367, true);
      await sdk.waitForTicks(3);
    }
    const oddenstein = sdk.findNearbyNpc(/oddenstein/i);
    if (oddenstein) {
      await bot.talkTo(oddenstein);
      await sdk.waitForTicks(3);
      const dlg = sdk.getDialog();
      recordResult(dlg?.isOpen ? "OK" : "FAIL", oddenstein.id, oddenstein.name, oddenstein.x, oddenstein.z, 2, `Talk-to -> "${getDialogString(dlg).slice(0, 120)}"`);
      for (let i = 0; i < 6 && sdk.getDialog()?.isOpen; i++) {
        await sdk.sendClickDialog(0);
        await sdk.waitForTicks(2);
      }
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
