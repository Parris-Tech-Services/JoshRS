import { BotSDK } from '/home/josh/dev/JoshRS-source/rs-sdk/sdk/index';
import { BotActions } from '/home/josh/dev/JoshRS-source/rs-sdk/sdk/actions';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';

function getPassword(botName: string): string {
  const envPath = `/home/josh/dev/JoshRS-source/rs-sdk/bots/${botName}/bot.env`;
  const envText = readFileSync(envPath, 'utf-8');
  const pwMatch = envText.match(/PASSWORD=(.+)/);
  return pwMatch ? pwMatch[1].trim() : '';
}

async function moveManorBot(botName: string) {
  const sdk = new BotSDK({
    botUsername: botName,
    password: getPassword(botName),
    gatewayUrl: 'ws://localhost:7780',
    connectionMode: 'control',
    autoLaunchBrowser: false
  });
  const bot = new BotActions(sdk);
  try {
    await sdk.connect();
    await sdk.waitForCondition(() => sdk.getState() !== null, 5000);
    let st = sdk.getState()!;
    console.log(`[${botName}] Start: (${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})`);
    if (st.player.level === 1) {
      await bot.walkTo(3108, 3364);
      const down = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
      if (down) {
        console.log(`[${botName}] Climbing down staircase at (${down.x},${down.z}) id=${down.id}`);
        await bot.interactLoc(down, 'climb-down');
        await sdk.waitForCondition(() => sdk.getState()?.player.level === 0, 6000);
      }
    }
    st = sdk.getState()!;
    if (st.player.level === 0 && st.player.worldZ >= 3353 && st.player.worldX <= 3124) {
      await bot.walkTo(3119, 3356);
      const d1 = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && Math.abs(l.x - 3120) <= 1 && Math.abs(l.z - 3356) <= 1);
      if (d1 && d1.optionsWithIndex.some(o => /open/i.test(o.text))) {
        await sdk.sendInteractLoc(d1.x, d1.z, d1.id, 1);
        await sdk.waitForTicks(3);
      }
      await bot.walkTo(3122, 3360);
      const d2 = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && Math.abs(l.x - 3123) <= 1 && Math.abs(l.z - 3360) <= 1);
      if (d2 && d2.optionsWithIndex.some(o => /open/i.test(o.text))) {
        await sdk.sendInteractLoc(d2.x, d2.z, d2.id, 1);
        await sdk.waitForTicks(3);
      }
      await sdk.sendWalk(3126, 3360, true);
      await sdk.waitForTicks(4);
    }
    await bot.walkTo(3223, 3218, 2);
    st = sdk.getState()!;
    console.log(`[${botName}] End: (${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})`);
  } finally {
    sdk.disconnect();
  }
}

async function moveKaramjaBot(botName: string) {
  const sdk = new BotSDK({
    botUsername: botName,
    password: getPassword(botName),
    gatewayUrl: 'ws://localhost:7780',
    connectionMode: 'control',
    autoLaunchBrowser: false
  });
  const bot = new BotActions(sdk);
  try {
    await sdk.connect();
    await sdk.waitForCondition(() => sdk.getState() !== null, 5000);
    let st = sdk.getState()!;
    console.log(`[${botName}] Start: (${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level}) inv=${sdk.getInventory().map(i => `${i.name}x${i.count}`).join(',')}`);

    if (st.player.worldX < 2965 && st.player.worldZ < 3180) {
      // Fastest way from Karamja to Lumbridge with 0 coins or low HP: attack Customs Officer / Guard / Luthas or pickpocket Man!
      // Wait: let's check coins first!
      let coins = sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
      if (coins < 30) {
        // Sell items to Karamja General Store at (2908, 3151) or pickpocket Man at (2939, 3151)
        await bot.walkTo(2939, 3151);
        for (let i = 0; i < 20; i++) {
          coins = sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
          if (coins >= 30) break;
          const man = sdk.findNearbyNpc(/^man$/i, { reachable: true });
          if (!man) break;
          const pp = await bot.pickpocketNpc(man);
          if (!pp.success) await sdk.waitForTicks(8);
          else await sdk.waitForTicks(2);
        }
      }
      await bot.walkTo(2954, 3147);
      const officer = sdk.findNearbyNpc(/customs officer/i);
      if (officer) {
        await sdk.sendInteractNpc(officer.index, 1);
        for (let i = 0; i < 15; i++) {
          await sdk.waitForTicks(2);
          const d = sdk.getDialog();
          if (!d || !d.isOpen) break;
          if (d.options.length <= 1) await sdk.sendClickDialog(0);
          else {
            const r = await sdk.clickDialogByText(/can i journey|search away|ok/i);
            if (!r.success) await sdk.sendClickDialog(1);
          }
        }
        await sdk.waitForCondition(() => (sdk.getState()?.player.worldX ?? 0) > 3020, 15000);
        await bot.closeInterface();
        const plank = sdk.findNearbyLoc(/gangplank/i);
        if (plank) {
          await sdk.sendInteractLoc(plank.x, plank.z, plank.id, 1);
          await sdk.waitForTicks(4);
        }
      }
    }
    await bot.walkTo(3223, 3218, 2);
    st = sdk.getState()!;
    console.log(`[${botName}] End: (${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})`);
  } finally {
    sdk.disconnect();
  }
}

await Promise.all([
  moveManorBot('qb153449'),
  moveManorBot('qb154433'),
  moveKaramjaBot('qb162829')
]);

// Finally ensure all 34 bots have an active runner
const res = await fetch('http://localhost:7780/status');
const data: any = await res.json();
const dead = Object.keys(data.bots || {}).filter(n => data.bots[n].status !== 'active');
for (const b of dead) {
  const child = spawn('bun', ['src/lite/runner.ts', b], {
    cwd: '/home/josh/dev/JoshRS-source/rs-sdk/server/webclient',
    env: { ...process.env, GATEWAY_URL: 'ws://localhost:7780' },
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}
console.log('ALL 34 COMPLETE');
