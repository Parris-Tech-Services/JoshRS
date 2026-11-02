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
      await new Promise(r => setTimeout(r, 350));
    }
    // Wait up to 8s for them to register on gateway
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
  return level === 0 && x >= 3217 && x <= 3227 && z >= 3214 && z <= 3224;
}

async function moveOneBotToLumbridge(botName: string) {
  if (botName === 'jimmy' || botName === 'bob') {
    return { botName, status: 'already_in_lumbridge' };
  }
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
      console.log(`[${botName}] Already in Lumbridge at ${startPos}`);
      return { botName, startPos, endPos: startPos, ok: true };
    }

    await bot.dismissBlockingUI();
    await bot.closeInterface();

    // 1. Underground (Wizards' Tower basement, Draynor Manor basement, etc.)
    st = sdk.getState()!;
    if (st.player.worldZ > 9000) {
      const up = sdk.findNearbyLoc(/ladder|stairs|staircase/i);
      if (up) {
        await bot.interactLoc(up);
        await sdk.waitForCondition(() => (sdk.getState()?.player.worldZ ?? 9999) < 4000, 6000);
      }
    }

    // 2. Inside Draynor Manor (3090..3124, 3354..3372)
    st = sdk.getState()!;
    if (st.player.worldX >= 3090 && st.player.worldX <= 3124 && st.player.worldZ >= 3354 && st.player.worldZ <= 3372) {
      if (st.player.level === 2) {
        const s2 = sdk.findNearbyLoc(/staircase/i);
        if (s2) {
          await bot.interactLoc(s2, 'climb-down');
          await sdk.waitForCondition(() => sdk.getState()?.player.level === 1, 5000);
        }
      }
      st = sdk.getState()!;
      if (st.player.level === 1) {
        await bot.walkTo(3108, 3363, 2);
        const s1 = sdk.findNearbyLoc(/staircase/i);
        if (s1) {
          await bot.interactLoc(s1, 'climb-down');
          await sdk.waitForCondition(() => sdk.getState()?.player.level === 0, 5000);
        }
      }
      // Exit Draynor Manor via East Wing (3119, 3356) -> (3123, 3360) -> (3126, 3360)
      st = sdk.getState()!;
      if (st.player.level === 0 && st.player.worldX <= 3123) {
        await bot.walkTo(3119, 3356);
        const d1 = sdk.findNearbyLoc(/^door$/i);
        if (d1) await bot.openDoor(d1);
        await bot.walkTo(3122, 3360);
        const d2 = sdk.findNearbyLoc(/^door$/i);
        if (d2) await bot.openDoor(d2);
        await bot.walkTo(3126, 3360);
      }
    }

    // 3. Other upper-level buildings
    st = sdk.getState()!;
    for (let lvl = st.player.level; lvl > 0; lvl--) {
      const plank = sdk.findNearbyLoc(/gangplank/i);
      if (plank) {
        await bot.interactLoc(plank, 'cross');
        await sdk.waitForTicks(3);
        break;
      }
      const down = sdk.findNearbyLoc(/staircase|stairs|ladder/i);
      if (down) {
        await bot.interactLoc(down, 'climb-down');
        await sdk.waitForTicks(3);
      }
    }

    // 4. Karamja (x < 2965 && z < 3180)
    st = sdk.getState()!;
    if (st.player.worldX < 2965 && st.player.worldZ < 3180) {
      // Ensure >= 30 coins
      let coins = sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
      if (coins < 30) {
        await bot.walkTo(2940, 3150);
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
        await sdk.waitForCondition(() => (sdk.getState()?.player.worldX ?? 0) > 3020, 12000);
        await bot.closeInterface();
        const plank = sdk.findNearbyLoc(/gangplank/i);
        if (plank) {
          await bot.interactLoc(plank, 'cross');
          await sdk.waitForTicks(3);
        }
      }
    }

    // 5. Al Kharid east of toll gate (x >= 3268 && z < 3320)
    st = sdk.getState()!;
    if (st.player.worldX >= 3268 && st.player.worldZ < 3320) {
      await bot.walkTo(3277, 3325);
      await bot.walkTo(3255, 3325);
    }

    // 6. Walk to Lumbridge Courtyard (3221..3225, 3217..3220)
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

// Process in batches of 8
const summary = [];
for (let i = 0; i < qbBots.length; i += 8) {
  const batch = qbBots.slice(i, i + 8);
  console.log(`Processing batch ${i / 8 + 1}: ${batch.join(', ')}`);
  const batchRes = await Promise.all(batch.map(b => moveOneBotToLumbridge(b)));
  summary.push(...batchRes);
}

// Re-check any bots that logged out during the run
await ensureAllBotsActive();

console.log('SUMMARY:', JSON.stringify(summary, null, 2));
