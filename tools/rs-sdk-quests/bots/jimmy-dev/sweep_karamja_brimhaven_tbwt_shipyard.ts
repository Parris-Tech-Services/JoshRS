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

  // 1. Cross gangplank off Karamja ship if on L1
  if (sdk.getState()?.player?.level === 1) {
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
      await bot.interactLoc(plank, "Cross");
      await sdk.waitForTicks(5);
    }
  }
  console.log(`Now at (${sdk.getState()?.player?.worldX}, ${sdk.getState()?.player?.worldZ}, L${sdk.getState()?.player?.level})`);

  // 2. Test Luthas (379) & Zambo (568) in Musa Point
  console.log("=== Testing Musa Point: Luthas (379) & Zambo (568) ===");
  await bot.walkTo(2938, 3152, 3);
  const luthas = sdk.findNearbyNpc(/luthas/i);
  if (luthas) await testNpc(bot, sdk, luthas);

  await bot.walkTo(2927, 3145, 3);
  const zambo = sdk.findNearbyNpc(/zambo/i);
  if (zambo) await testNpc(bot, sdk, zambo);

  // 3. Walk to Brimhaven and test Trobert (790), Grubor (789), Grip (792), Davon (588), Lubufu (1171), Saniboch (1595)
  console.log("=== Walking to Brimhaven ===");
  for (const [wx, wz, pat] of [
    [2900, 3155, null],
    [2860, 3165, null],
    [2825, 3172, null],
    [2806, 3174, /trobert/i],
    [2777, 3180, /davon/i],
    [2769, 3171, /lubufu/i],
    [2745, 3152, /saniboch/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
  }

  // 4. Walk south to Tai Bwo Wannai: Jiminua (560), Trufitus (740), Gabooty (2520), Tiadeche, Tamayu (1167), Tinsay (1165)
  console.log("=== Walking to Tai Bwo Wannai ===");
  for (const [wx, wz, pat] of [
    [2767, 3122, /jiminua/i],
    [2809, 3085, /trufitus/i],
    [2790, 3088, /gabooty/i],
    [2844, 3042, /tamayu/i],
    [2764, 2976, /tinsay/i],
  ] as [number, number, RegExp][]) {
    await bot.walkTo(wx, wz, 4);
    const n = sdk.findNearbyNpc(pat);
    if (n) await testNpc(bot, sdk, n);
  }

  // 5. Walk east to Karamja Shipyard: Foreman (674) @ (2999, 3043), Shipyard worker (675) @ (2944, 3040), G.L.O. Caranock (1427) @ (2956, 3025)
  console.log("=== Walking to Karamja Shipyard ===");
  for (const [wx, wz, pat] of [
    [2830, 3020, null],
    [2890, 3035, null],
    [2944, 3040, /shipyard worker/i],
  ] as [number, number, RegExp | null][]) {
    await bot.walkTo(wx, wz, 4);
    if (pat) {
      const n = sdk.findNearbyNpc(pat);
      if (n) await testNpc(bot, sdk, n);
    }
  }
}, { bot: "jimmy-dev", disconnectAfter: true });
