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
  const tea = sdk.findInventoryItem(/cup of tea/i);
  if (tea) {
    await bot.eatFood(tea);
    await sdk.waitForTicks(2);
  }

  // 1. Exit Rantz's cave (2638, 9389) -> (2630, 2995) and test Rantz (1010) at (2630, 2975)
  console.log("=== Exiting Rantz's cave and testing Rantz (1010) ===");
  if ((sdk.getState()?.player?.worldZ || 0) > 9000) {
    await bot.walkTo(2638, 9389, 3);
    const caveExit = sdk.getNearbyLocs().find(l => /cave|tunnel/i.test(l.name) && l.optionsWithIndex.length > 0);
    if (caveExit) {
      await bot.interactLoc(caveExit, caveExit.optionsWithIndex[0].text);
      await sdk.waitForTicks(5);
    }
  }
  await bot.walkTo(2630, 2978, 4);
  const rantz = sdk.findNearbyNpc(/rantz/i);
  if (rantz) await testNpc(bot, sdk, rantz);

  // 2. Walk to Yanille: Colonel Radick (255) @ (2505, 3076), Watchtower Wizard (471), Leon (1594), Aleck (1593)
  console.log("=== Testing Yanille & Watchtower ===");
  for (const [wx, wz, pat] of [
    [2580, 3080, null],
    [2531, 3092, /watchman|treznor/i],
    [2505, 3076, /colonel radick/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name))) {
        await testNpc(bot, sdk, n);
      }
    }
  }

  // 3. Walk north to Fight Arena (Lady Servil 262, Jeremy Servil 265), Edmond (319) & Alrena (320), Elena (335), Jethick (334), Mourner (347), Bravek (342)
  console.log("=== Testing Fight Arena, Edmond/Alrena, West Ardougne ===");
  for (const [wx, wz, pat] of [
    [2569, 3198, /lady servil|local/i],
    [2591, 3142, /joe|kelvin/i],
    [2566, 3332, /edmond|alrena/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
      await testNpc(bot, sdk, n);
    }
  }

  // 4. Walk to Tree Gnome Stronghold (2461, 3382): Femi (676), Heckel Funch (603), Hudo (600), Rometti (601), Gulluck (602), King Narnode Shareen (670),Blurberry (848), Gianne jnr (849), Dalila, Anita, Glough, Trainer, Cheerleader (636), Referee (635)
  console.log("=== Entering Tree Gnome Stronghold ===");
  await bot.walkTo(2515, 3365, 4);
  await bot.walkTo(2461, 3380, 3);
  const femi = sdk.findNearbyNpc(/femi/i);
  if (femi) await testNpc(bot, sdk, femi);

  // Open Tree Gnome Stronghold gate at (2461, 3382)
  const gate = sdk.getNearbyLocs().find(l => /gate/i.test(l.name) && Math.hypot(l.x - 2461, l.z - 3382) <= 6);
  if (gate) {
    const opt = gate.optionsWithIndex[0]?.text;
    if (opt) {
      await bot.interactLoc(gate, opt);
      await sdk.waitForTicks(6);
      await clearDialog(sdk);
    }
  }

  if ((sdk.getState()?.player?.worldZ || 0) >= 3383) {
    for (const [wx, wz, pat] of [
      [2465, 3415, /trainer|gnome/i],
      [2465, 3495, /king narnode|glough/i],
      [2395, 3495, /referee|cheerleader/i],
    ] as [number, number, RegExp][]) {
      await bot.walkTo(wx, wz, 4);
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
        await testNpc(bot, sdk, n);
      }
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
