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

  // 1. Inside Grand Tree (2464, 3497, L0): climb ladder to L1 -> Hudo (600), Heckel Funch (603), Rometti (601), Gulluck (602), Blurberry (848), Gianne jnr (849), Dalila (850), Captain Errdo (381)
  console.log("=== Climbing Grand Tree to L1 & L2 ===");
  const gtLadder0 = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up/i.test(o.text)));
  if (gtLadder0) {
    await bot.interactLoc(gtLadder0, "Climb-up");
    await sdk.waitForTicks(4);
  }
  if (sdk.getState()?.player?.level === 1) {
    for (const [wx, wz, pat] of [
      [2465, 3492, /hudo|gianne/i],
      [2482, 3488, /heckel funch|blurberry/i],
      [2485, 3505, /rometti/i],
      [2450, 3505, /gulluck|dalila/i],
    ] as [number, number, RegExp][]) {
      await bot.walkTo(wx, wz, 4);
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
        await testNpc(bot, sdk, n);
      }
    }
    await bot.walkTo(2466, 3495, 3);
    const down1 = sdk.getNearbyLocs().find(l => /ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
    if (down1) {
      await bot.interactLoc(down1, "Climb-down");
      await sdk.waitForTicks(4);
    }
  }

  // Exit Grand Tree and walk west to Gnome Ball field (2395, 3495) for Referee (635), Cheerleader (636), Gnome Baller
  console.log("=== Walking to Gnome Ball Field (2395, 3495) ===");
  for (let i = 0; i < 2; i++) {
    const d = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
    if (d) {
      await bot.openDoor(d);
      await sdk.waitForTicks(2);
    }
    await sdk.sendWalk(2465, 3489, true);
    await sdk.waitForTicks(3);
  }
  for (const [wx, wz, pat] of [
    [2435, 3485, null],
    [2408, 3488, /gnome coach|referee|cheerleader/i],
    [2395, 3495, /referee|cheerleader/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
        await testNpc(bot, sdk, n);
      }
    }
  }

  // Walk to Anita (672) @ (2390, 3512) and Glough (671) @ (2478, 3463) and Femi (676) @ (2459, 3382)
  await bot.walkTo(2458, 3383, 2);
  const femi = sdk.findNearbyNpc(/femi/i);
  if (femi) await testNpc(bot, sdk, femi);
}, { bot: "jimmy-dev", disconnectAfter: true });
