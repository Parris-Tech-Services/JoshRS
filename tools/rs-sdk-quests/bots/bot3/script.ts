import { runScript } from '../../sdk/runner';
import { gobdip } from './quests/goblin-diplomacy';

await runScript(async ({ bot, sdk }) => {
    const startTime = Date.now();
    await bot.dismissBlockingUI();
    await bot.closeInterface();

    const pos = sdk.getState()?.player;
    console.log(`[Start] Pos: (${pos?.worldX}, ${pos?.worldZ}), Coins: ${sdk.findInventoryItem(/^coins$/i)?.count ?? 0}, HP: ${pos?.hp}/${pos?.maxHp}`);

    // Complete Quest #8: Goblin Diplomacy (5 QP, +5,000 Crafting XP + Gold bar)
    console.log('\n--- Completing Quest #8: Goblin Diplomacy (5 QP) ---');
    const gdStartMs = Date.now();
    const gdOk = await gobdip.run({ bot, sdk, dir: 'bots/bot3' });
    const gdSec = Math.round((Date.now() - gdStartMs) / 1000);
    console.log(`[Quest Result] Goblin Diplomacy: ${gdOk} in ${gdSec}s | Crafting Lv: ${sdk.getSkill('Crafting')?.baseLevel}`);

    const totalSec = Math.round((Date.now() - startTime) / 1000);
    const endPos = sdk.getState()?.player;
    console.log(`[Done] Total time: ${totalSec}s | Pos: (${endPos?.worldX}, ${endPos?.worldZ}) | Combat Lv: ${endPos?.combatLevel} | HP: ${endPos?.hp}/${endPos?.maxHp} | Coins: ${sdk.findInventoryItem(/^coins$/i)?.count ?? 0}`);
    console.log(`[Final Inv]`, sdk.getInventory().map(i => `${i.name} x${i.count}`).join(', '));
}, {
    bot: 'bot3',
    disconnectAfter: true,
    timeout: 540_000,
});
