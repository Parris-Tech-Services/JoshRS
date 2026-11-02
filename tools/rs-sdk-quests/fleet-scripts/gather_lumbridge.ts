import { BotSDK } from '/home/josh/dev/JoshRS-source/rs-sdk/sdk/index';
import { BotActions } from '/home/josh/dev/JoshRS-source/rs-sdk/sdk/actions';
import { readFileSync } from 'fs';

const activeQbBots = [
  'qb123333', 'qb144315', 'qb145109', 'qb145614', 'qb150126', 'qb150144',
  'qb151011', 'qb152703', 'qb152711', 'qb152909', 'qb153449', 'qb153456',
  'qb154427', 'qb154433', 'qb155732', 'qb155734', 'qb155749', 'qb161228',
  'qb161242', 'qb161707', 'qb162829', 'qb162834'
];

async function moveBotToLumbridge(botName: string) {
  const envPath = `/home/josh/dev/JoshRS-source/rs-sdk/bots/${botName}/bot.env`;
  const envText = readFileSync(envPath, 'utf-8');
  const pwMatch = envText.match(/PASSWORD=(.+)/);
  const password = pwMatch ? pwMatch[1].trim() : '';

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
    await sdk.waitForCondition(() => sdk.getState() !== null, 5000);
    let st = sdk.getState()!;
    const startPos = `(${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})`;

    await bot.dismissBlockingUI();
    await bot.closeInterface();

    // If on upper floor, climb down staircase or ladder
    for (let lvl = st.player.level; lvl > 0; lvl--) {
      const down = sdk.findNearbyLoc(/staircase|stairs|ladder/i);
      if (down) {
        await bot.interactLoc(down, 'climb-down');
        await sdk.waitForTicks(3);
      }
    }

    // If in underground dungeon (z > 9000), climb up ladder/stairs
    st = sdk.getState()!;
    if (st.player.worldZ > 9000) {
      const up = sdk.findNearbyLoc(/ladder|stairs|staircase/i);
      if (up) {
        await bot.interactLoc(up);
        await sdk.waitForTicks(4);
      }
    }

    // If on Karamja (x < 2965 && z < 3180), board ship with Customs Officer at (2954, 3147)
    st = sdk.getState()!;
    if (st.player.worldX < 2965 && st.player.worldZ < 3180) {
      await bot.walkTo(2954, 3147);
      const officer = sdk.findNearbyNpc(/customs officer/i);
      if (officer) {
        await bot.talkTo(officer);
        for (let i = 0; i < 12; i++) {
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

    // Spread slightly in Lumbridge Courtyard around (3221..3224, 3217..3220)
    const tx = 3221 + (Math.abs(botName.charCodeAt(6)) % 4);
    const tz = 3217 + (Math.abs(botName.charCodeAt(7)) % 4);
    const res = await bot.walkTo(tx, tz, 2);
    st = sdk.getState()!;
    const endPos = `(${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})`;
    console.log(`[${botName}] ${startPos} -> ${endPos} (${res.message})`);
    return { botName, startPos, endPos, ok: res.success };
  } catch (err: any) {
    const st = sdk.getState();
    const curPos = st ? `(${st.player.worldX}, ${st.player.worldZ}, lvl ${st.player.level})` : 'unknown';
    console.log(`[${botName}] ERROR at ${curPos}: ${err.message}`);
    return { botName, startPos: curPos, endPos: curPos, ok: false, error: err.message };
  } finally {
    sdk.disconnect();
  }
}

const results = await Promise.all(activeQbBots.map(b => moveBotToLumbridge(b)));
console.log('Done:', JSON.stringify(results, null, 2));
