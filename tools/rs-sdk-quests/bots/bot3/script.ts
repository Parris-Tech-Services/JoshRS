import { runScript } from '../../sdk/runner';
import { blackknight } from './quests/black-knights-fortress';
import { hunt } from './quests/pirates-treasure';

await runScript(
  async ({ bot, sdk }) => {
    const c = { bot, sdk, dir: 'bots/bot3' };

    const t1 = Date.now();
    const coins0 = sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
    console.log(`[M19] Starting Black Knights' Fortress... Coins=${coins0}`);
    const ok1 = await blackknight.run(c);
    const dt1 = ((Date.now() - t1) / 1000).toFixed(1);
    const coins1 = sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
    console.log(`[M19] Black Knights' Fortress result=${ok1} in ${dt1}s | Coins=${coins1}`);

    const t2 = Date.now();
    console.log(`[M20] Starting Pirate's Treasure...`);
    const ok2 = await hunt.run(c);
    const dt2 = ((Date.now() - t2) / 1000).toFixed(1);
    const coins2 = sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
    console.log(`[M20] Pirate's Treasure result=${ok2} in ${dt2}s | Coins=${coins2}`);
  },
  { bot: 'bot3', timeout: 780_000, disconnectAfter: true }
);
