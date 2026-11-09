import { runScript } from '../../sdk/runner';
import { gobdip } from './quests/goblin-diplomacy';
import { vampire } from './quests/vampyre-slayer';
import { haunted } from './quests/ernest-the-chicken';

await runScript(
  async ({ bot, sdk }) => {
    const c = { bot, sdk, dir: 'bots/bot3' };

    const t1 = Date.now();
    const startCraftXp = sdk.getSkill('Crafting')?.experience ?? 0;
    const startDefXp = sdk.getSkill('Defence')?.experience ?? 0;
    const startDefLvl = sdk.getSkill('Defence')?.baseLevel ?? 1;
    console.log(`[M16] Starting Goblin Diplomacy finish... Defence Lv ${startDefLvl} (${startDefXp} XP)`);
    const ok1 = await gobdip.run(c);
    const dt1 = ((Date.now() - t1) / 1000).toFixed(1);
    const endCraftXp = sdk.getSkill('Crafting')?.experience ?? 0;
    const endDefXp = sdk.getSkill('Defence')?.experience ?? 0;
    const endDefLvl = sdk.getSkill('Defence')?.baseLevel ?? 1;
    console.log(`[M16] Goblin Diplomacy result=${ok1} in ${dt1}s | Crafting +${endCraftXp - startCraftXp} XP | Defence Lv ${startDefLvl} -> ${endDefLvl} (+${endDefXp - startDefXp} XP)`);

    const t2 = Date.now();
    const startAtkXp = sdk.getSkill('Attack')?.experience ?? 0;
    const startAtkLvl = sdk.getSkill('Attack')?.baseLevel ?? 1;
    console.log(`[M17] Starting Vampyre Slayer... Attack Lv ${startAtkLvl} (${startAtkXp} XP)`);
    const ok2 = await vampire.run(c);
    const dt2 = ((Date.now() - t2) / 1000).toFixed(1);
    const endAtkXp = sdk.getSkill('Attack')?.experience ?? 0;
    const endAtkLvl = sdk.getSkill('Attack')?.baseLevel ?? 1;
    console.log(`[M17] Vampyre Slayer result=${ok2} in ${dt2}s | Attack Lv ${startAtkLvl} -> ${endAtkLvl} (+${endAtkXp - startAtkXp} XP)`);

    const t3 = Date.now();
    console.log(`[M18] Starting Ernest the Chicken...`);
    const ok3 = await haunted.run(c);
    const dt3 = ((Date.now() - t3) / 1000).toFixed(1);
    console.log(`[M18] Ernest the Chicken result=${ok3} in ${dt3}s`);
  },
  { bot: 'bot3', timeout: 780_000, disconnectAfter: true }
);
