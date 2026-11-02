import { BotSDK } from '/home/josh/dev/JoshRS-source/rs-sdk/sdk/index';
import { BotActions } from '/home/josh/dev/JoshRS-source/rs-sdk/sdk/actions';
import { readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';

function ensureBotEnvServer(botName: string): string {
  const envPath = `/home/josh/dev/JoshRS-source/rs-sdk/bots/${botName}/bot.env`;
  let envText = readFileSync(envPath, 'utf-8');
  if (/^SERVER=$/m.test(envText)) {
    envText = envText.replace(/^SERVER=$/m, 'SERVER=localhost:8888');
    writeFileSync(envPath, envText);
  }
  const pwMatch = envText.match(/PASSWORD=(.+)/);
  return pwMatch ? pwMatch[1].trim() : '';
}

async function ensureAllBotsActive(): Promise<string[]> {
  const res = await fetch('http://localhost:7780/status');
  const data: any = await res.json();
  const bots = data.bots || {};
  const allNames = Object.keys(bots);
  const deadNames = allNames.filter(n => bots[n].status !== 'active' || !bots[n].inGame);

  if (deadNames.length > 0) {
    console.log(`Starting lite runners for ${deadNames.length} dead bots: ${deadNames.join(', ')}`);
    for (const b of deadNames) {
      ensureBotEnvServer(b);
      const child = spawn('bun', ['src/lite/runner.ts', b], {
        cwd: '/home/josh/dev/JoshRS-source/rs-sdk/server/webclient',
        env: { ...process.env, GATEWAY_URL: 'ws://localhost:7780' },
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      await new Promise(r => setTimeout(r, 300));
    }
    for (let i = 0; i < 16; i++) {
      await new Promise(r => setTimeout(r, 500));
      const r2 = await fetch('http://localhost:7780/status');
      const d2: any = await r2.json();
      const stillDead = Object.keys(d2.bots || {}).filter(n => d2.bots[n].status !== 'active');
      if (stillDead.length === 0) break;
    }
  }
  return allNames;
}

function isInLumbridge(x: number, z: number, level: number): boolean {
  return level === 0 && x >= 3217 && x <= 3227 && z >= 3213 && z <= 3225;
}

async function moveStraggler(botName: string) {
  const password = ensureBotEnvServer(botName);
  const sdk = new BotSDK({
    botUsername: botName,
    password,
    gatewayUrl: 'ws://localhost:7780',
    connectionMode: 'control',
    autoLaunchBrowser: false
  });
  const bot = new BotActions(sdk);

  try {
    await sdk.connect();
    await sdk.waitForCondition(() => sdk.getState() !== null, 6000);
    let st = sdk.getState()!;
    const startPos = `(${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})`;

    if (isInLumbridge(st.player.worldX, st.player.worldZ, st.player.level)) {
      return { botName, startPos, endPos: startPos, ok: true };
    }

    console.log(`[${botName}] Moving from ${startPos}...`);
    await bot.dismissBlockingUI();
    await bot.closeInterface();

    // 0. Tutorial Island (z < 3135 && x >= 3050 && x <= 3150)
    st = sdk.getState()!;
    if (st.player.worldZ < 3135 && st.player.worldX >= 3050 && st.player.worldX <= 3150) {
      console.log(`[${botName}] On Tutorial Island — calling skipTutorial()...`);
      await bot.skipTutorial();
      await sdk.waitForTicks(3);
    }

    // 1. Underground
    st = sdk.getState()!;
    if (st.player.worldZ > 9000) {
      const up = sdk.getNearbyLocs().find(l => /ladder|stairs|staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-up|walk-up/i.test(o.text)));
      if (up) {
        await sdk.sendInteractLoc(up.x, up.z, up.id, 1);
        await sdk.waitForCondition(() => (sdk.getState()?.player.worldZ ?? 9999) < 4000, 8000);
      }
    }

    // 2. Wizards' Tower ground floor inner ring (3103..3114, 3155..3166)
    st = sdk.getState()!;
    if (st.player.worldX >= 3102 && st.player.worldX <= 3115 && st.player.worldZ >= 3154 && st.player.worldZ <= 3167) {
      while (sdk.getState()!.player.level > 0) {
        const down = sdk.getNearbyLocs().find(l => /staircase/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
        if (!down) break;
        const op = down.optionsWithIndex.find(o => /climb-down/i.test(o.text))!.opIndex;
        await sdk.sendInteractLoc(down.x, down.z, down.id, op);
        await sdk.waitForTicks(4);
      }
      // Open inner & outer doors of Wizards' Tower
      for (let i = 0; i < 3; i++) {
        const door = sdk.getNearbyLocs().find(l => /door/i.test(l.name) && l.optionsWithIndex.some(o => /open/i.test(o.text)));
        if (door) {
          await sdk.sendInteractLoc(door.x, door.z, door.id, 1);
          await sdk.waitForTicks(3);
        }
      }
      await sdk.sendWalk(3109, 3168, true);
      await sdk.waitForTicks(5);
    }

    // 3. Draynor Manor (3090..3124, 3353..3372)
    st = sdk.getState()!;
    if (st.player.worldX >= 3090 && st.player.worldX <= 3124 && st.player.worldZ >= 3353 && st.player.worldZ <= 3372) {
      while (sdk.getState()!.player.level > 0) {
        const down = sdk.getNearbyLocs().find(l => /staircase|ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down/i.test(o.text)));
        if (!down) break;
        const op = down.optionsWithIndex.find(o => /climb-down/i.test(o.text))!.opIndex;
        await sdk.sendInteractLoc(down.x, down.z, down.id, op);
        await sdk.waitForTicks(5);
      }
      // Exit via East Wing (3119, 3356) -> (3123, 3360) -> (3126, 3360)
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

    // 4. Ship gangplank or upper level
    st = sdk.getState()!;
    if (st.player.level > 0) {
      const plank = sdk.findNearbyLoc(/gangplank/i);
      if (plank) {
        await sdk.sendInteractLoc(plank.x, plank.z, plank.id, 1);
        await sdk.waitForTicks(4);
      } else {
        const down = sdk.getNearbyLocs().find(l => /staircase|stairs|ladder/i.test(l.name) && l.optionsWithIndex.some(o => /climb-down|walk-down/i.test(o.text)));
        if (down) {
          const op = down.optionsWithIndex.find(o => /climb-down|walk-down/i.test(o.text))!.opIndex;
          await sdk.sendInteractLoc(down.x, down.z, down.id, op);
          await sdk.waitForTicks(4);
        }
      }
    }

    // 5. Karamja (x < 2965 && z < 3180)
    st = sdk.getState()!;
    if (st.player.worldX < 2965 && st.player.worldZ < 3180) {
      let coins = sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
      if (coins < 30) {
        await bot.walkTo(2940, 3151);
        for (let i = 0; i < 25; i++) {
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

    // 6. Walk to Lumbridge Courtyard
    const tx = 3221 + (Math.abs(botName.charCodeAt(6)) % 4);
    const tz = 3217 + (Math.abs(botName.charCodeAt(7)) % 4);
    const res = await bot.walkTo(tx, tz, 2);
    st = sdk.getState()!;
    const endPos = `(${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})`;
    console.log(`[${botName}] ${startPos} -> ${endPos} (${res.message})`);
    return { botName, startPos, endPos, ok: isInLumbridge(st.player.worldX, st.player.worldZ, st.player.level) };
  } catch (err: any) {
    const st = sdk.getState();
    const curPos = st ? `(${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})` : 'unknown';
    console.log(`[${botName}] ERROR at ${curPos}: ${err.message}`);
    return { botName, startPos: curPos, endPos: curPos, ok: false, error: err.message };
  } finally {
    sdk.disconnect();
  }
}

const allBots = await ensureAllBotsActive();
const qbBots = allBots.filter(b => b.startsWith('qb'));
const results = await Promise.all(qbBots.map(b => moveStraggler(b)));
await ensureAllBotsActive();
console.log('STRAGGLERS DONE:', JSON.stringify(results.filter(r => !r.ok), null, 2));
