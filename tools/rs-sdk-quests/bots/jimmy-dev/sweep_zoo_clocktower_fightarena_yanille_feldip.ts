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

  // 1. Test Ardougne Zoo: Zoo keeper (28), Charlie (1214), Larry (1215)
  console.log("=== Testing Ardougne Zoo, Clock Tower, Hazeel Cult, Fight Arena ===");
  for (const [wx, wz, pat] of [
    [2613, 3268, /zoo keeper|charlie|larry/i],
    [2568, 3249, /brother kojo/i],
    [2565, 3270, /alrena|edmond/i],
    [2607, 3274, /ceril|butler|henryeta|philip/i],
    [2569, 3148, /lady servil|jeremy servil|local|justin servil/i],
    [2584, 3141, /hengrad|kelvin|joe|general khazard|bouncer|khazard guard/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
      await testNpc(bot, sdk, n);
    }
  }

  // 2. Walk to Yanille: Wizard Frumscone (460), Zavistic Rarve (2058?), Aleck (1593?), Leon (1594?), Colonel Radick (255), Watchtower Wizard (471), Rantz (1010), Bugs (1011), Fycie (1012)
  console.log("=== Testing Yanille & Feldip Hills ===");
  for (const [wx, wz, pat] of [
    [2606, 3093, /aleck|wizard|clerk|banker/i],
    [2591, 3087, /wizard|zavistic/i],
    [2546, 3092, /watchman|treznor/i],
    [2531, 3061, /bolkoy|local|gnome/i],
    [2630, 2981, /rantz/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    for (const n of sdk.getNearbyNpcs().filter((x: any) => pat.test(x.name) && x.options.some((o: string) => /talk-to|trade/i.test(o)))) {
      await testNpc(bot, sdk, n);
    }
  }

  // Enter Rantz's cave at (2630, 2996) for Bugs (1011) & Fycie (1012)
  await bot.walkTo(2630, 2995, 3);
  const cave = sdk.getNearbyLocs().find(l => /cave/i.test(l.name) && l.optionsWithIndex.some(o => /enter/i.test(o.text)));
  if (cave) {
    await bot.interactLoc(cave, "Enter");
    await sdk.waitForTicks(4);
    for (const pat of [/bugs/i, /fycie/i]) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
    const exitCave = sdk.getNearbyLocs().find(l => /cave/i.test(l.name) && l.optionsWithIndex.some(o => /exit|leave/i.test(o.text)));
    if (exitCave) {
      const opt = exitCave.optionsWithIndex[0]?.text;
      if (opt) {
        await bot.interactLoc(exitCave, opt);
        await sdk.waitForTicks(4);
      }
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
