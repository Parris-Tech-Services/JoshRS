import { runScript } from '../../sdk/runner';
import { gobdip } from './quests/goblin-diplomacy';
import { squire } from './quests/the-knights-sword';

await runScript(async ({ bot, sdk }) => {
    const startTime = Date.now();
    await bot.dismissBlockingUI();
    await bot.closeInterface();

    const pos = sdk.getState()?.player;
    console.log(`[Start] Pos: (${pos?.worldX}, ${pos?.worldZ}), Coins: ${sdk.findInventoryItem(/^coins$/i)?.count ?? 0}, HP: ${pos?.hp}/${pos?.maxHp}`);

    // 1. Finish Quest #8: Goblin Diplomacy (5 QP, +5,000 Crafting XP + Gold bar)
    console.log('\n--- 1. Finishing Quest #8: Goblin Diplomacy (5 QP) ---');
    const gdStartMs = Date.now();
    const gdOk = await gobdip.run({ bot, sdk, dir: 'bots/bot3' });
    const gdSec = Math.round((Date.now() - gdStartMs) / 1000);
    console.log(`[Quest Result] Goblin Diplomacy: ${gdOk} in ${gdSec}s | Crafting Lv: ${sdk.getSkill('Crafting')?.baseLevel} | Attack Lv: ${sdk.getSkill('Attack')?.baseLevel}`);

    // 2. Complete Quest #9: The Knight's Sword (1 QP, +318,125 Smithing XP -> Smithing Lv 61!)
    console.log('\n--- 2. Completing Quest #9: The Knights Sword (1 QP) ---');
    const ksStartMs = Date.now();
    const ksOk = await squire.run({ bot, sdk, dir: 'bots/bot3' });
    const ksSec = Math.round((Date.now() - ksStartMs) / 1000);
    console.log(`[Quest Result] The Knight's Sword: ${ksOk} in ${ksSec}s | Smithing Lv: ${sdk.getSkill('Smithing')?.baseLevel}`);

    const totalSec = Math.round((Date.now() - startTime) / 1000);
    const endPos = sdk.getState()?.player;
    console.log(`[Done] Total time: ${totalSec}s | Pos: (${endPos?.worldX}, ${endPos?.worldZ}) | Combat Lv: ${endPos?.combatLevel} | HP: ${endPos?.hp}/${endPos?.maxHp} | Coins: ${sdk.findInventoryItem(/^coins$/i)?.count ?? 0}`);
    console.log(`[Final Inv]`, sdk.getInventory().map(i => `${i.name} x${i.count}`).join(', '));
}, {
    bot: 'bot3',
    disconnectAfter: true,
    timeout: 600_000,
});
