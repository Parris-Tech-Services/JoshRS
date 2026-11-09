import { runScript } from '../../sdk/runner';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const count = (sdk: any, re: RegExp) =>
  (sdk.getState()?.inventory ?? []).filter((i: any) => re.test(i.name)).reduce((a: number, i: any) => a + (i.count ?? 1), 0);

async function chat(sdk: any, want: RegExp[] = [], max = 30) {
  let closed = 0;
  for (let i = 0; i < max; i++) {
    const d = sdk.getState()?.dialog;
    if (!d?.isOpen) {
      if (++closed >= 4) return;
      await sleep(250);
      continue;
    }
    closed = 0;
    let opt: any;
    for (const w of want) {
      opt = d.options.find((o: any) => w.test(o.text));
      if (opt) break;
    }
    await sdk.sendClickDialog(opt ? opt.index : 0);
    await sleep(350);
  }
}

await runScript(async ({ bot, sdk }) => {
  await bot.dismissBlockingUI();

  // Drop empty cup if holding
  if (sdk.findInventoryItem(/^empty cup$/i)) {
    await bot.dropItem(/^empty cup$/i, 'all');
  }

  // 1. Survey Gem Trader (3286, 3211)
  console.log('=== Step 1: Survey Gem Trader ===');
  await bot.walkTo(3286, 3211, 2);
  if ((await bot.openShop(/^gem trader$/i)).success) {
    const items = sdk.getState()?.shop?.shopItems ?? [];
    console.log('Gem Trader stock:', JSON.stringify(items.map(i => ({ name: i.name, count: i.count, buy: i.buyPrice, sell: i.sellPrice }))));
    await bot.closeShop();
  }

  // 2. Dommik's Crafting Store (3320, 3194) — buy Needle, Thread, Leather/Moulds
  console.log('=== Step 2: Dommik\'s Crafting Store ===');
  await bot.walkTo(3320, 3194, 2);
  if ((await bot.openShop(/^dommik$/i)).success) {
    const items = sdk.getState()?.shop?.shopItems ?? [];
    console.log('Dommik\'s Crafting Store stock:', JSON.stringify(items.map(i => ({ name: i.name, count: i.count, buy: i.buyPrice, sell: i.sellPrice }))));
    const gpB = count(sdk, /^coins$/i);
    if (!sdk.findInventoryItem(/^needle$/i)) await bot.buyFromShop(/^needle$/i, 1);
    if (count(sdk, /^thread$/i) < 5) await bot.buyFromShop(/^thread$/i, 5);
    const gpA = count(sdk, /^coins$/i);
    console.log(`Bought Needle & Thread at Dommik's: GP ${gpB} -> ${gpA}`);
    await bot.closeShop();
  }

  // 3. Smelt 5 Iron Ore at Al Kharid Furnace (3273, 3184) (Smithing Method 1b)
  console.log('=== Step 3: Smelt 5 Iron Ore at Al Kharid Furnace ===');
  if (sdk.findInventoryItem(/^iron ore$/i)) {
    await bot.walkTo(3274, 3186, 2);
    const smXp0 = sdk.getSkill('Smithing')?.experience ?? 0;
    const tSmeltStart = Date.now();
    let tries = 0, bars = 0;
    while (sdk.findInventoryItem(/^iron ore$/i) && tries < 8) {
      tries++;
      await bot.dismissBlockingUI();
      const beforeOre = count(sdk, /^iron ore$/i);
      const beforeBar = count(sdk, /^iron bar$/i);
      const furnace = sdk.findNearbyLoc(/furnace/i, { withOption: /smelt/i }) ?? /^furnace$/i;
      await bot.useItemOnLoc(/^iron ore$/i, furnace);
      for (let w = 0; w < 12 && count(sdk, /^iron ore$/i) === beforeOre; w++) await sleep(350);
      if (count(sdk, /^iron bar$/i) > beforeBar) bars++;
      console.log(`Iron Smelt ${tries}: bars=${count(sdk, /^iron bar$/i)} | Smithing Lv ${sdk.getSkill('Smithing')?.baseLevel} (${sdk.getSkill('Smithing')?.experience} xp)`);
    }
    const smSec = (Date.now() - tSmeltStart) / 1000;
    const smXp1 = sdk.getSkill('Smithing')?.experience ?? 0;
    console.log(`Smithing Method 1b (Smelting Iron Ore at Al Kharid) summary: ${bars}/${tries} bars in ${smSec.toFixed(1)}s, +${smXp1 - smXp0} XP (~${Math.round(((smXp1 - smXp0) * 3600) / Math.max(1, smSec))} XP/hr) | Smithing Lv ${sdk.getSkill('Smithing')?.baseLevel}`);
  }

  // 4. Survey Zeke's Superior Scimitars (3287, 3187) & Louie's Armoured Legs (3315, 3175)
  console.log('=== Step 4: Survey Zeke & Louie Legs ===');
  await bot.walkTo(3287, 3187, 2);
  if ((await bot.openShop(/^zeke$/i)).success) {
    const items = sdk.getState()?.shop?.shopItems ?? [];
    console.log('Zeke\'s Superior Scimitars stock:', JSON.stringify(items.map(i => ({ name: i.name, count: i.count, buy: i.buyPrice, sell: i.sellPrice }))));
    if (count(sdk, /^coins$/i) >= 32 && !sdk.findInventoryItem(/scimitar/i)) {
      const b = await bot.buyFromShop(/^bronze scimitar$/i, 1);
      console.log('Bought Bronze scimitar:', b.message);
    }
    await bot.closeShop();
  }
  if (sdk.findInventoryItem(/scimitar/i)) await bot.equipItem(/scimitar/i);

  await bot.walkTo(3315, 3175, 2);
  if ((await bot.openShop(/^louie legs$/i)).success) {
    const items = sdk.getState()?.shop?.shopItems ?? [];
    console.log('Louie\'s Armoured Legs stock:', JSON.stringify(items.map(i => ({ name: i.name, count: i.count, buy: i.buyPrice, sell: i.sellPrice }))));
    await bot.closeShop();
  }

  // 5. Combat Method 2: Al-Kharid Warriors (3293, 3174) OR Lumbridge Cows!
  // Let's buy 5 Kebabs from Karim (3273, 3180) first (1 GP each), then fight 3 Al-Kharid Warriors (Combat Method 2a) and/or pickpocket them, then go to Lumbridge Cows (Combat Method 2b) + tan Cowhides at Ellis!
  console.log('=== Step 5: Buy Kebabs from Karim & Combat/Thieving at Al Kharid ===');
  await bot.walkTo(3273, 3180, 2);
  const gpBeforeKebab = count(sdk, /^coins$/i);
  for (let i = 0; i < 4 && count(sdk, /^coins$/i) >= 1 && count(sdk, /^kebab$/i) < 4; i++) {
    const r = await bot.talkTo(/^karim$/i);
    if (r.success) await chat(sdk, [/yes please/i]);
    await sleep(400);
  }
  console.log(`Bought ${count(sdk, /^kebab$/i)} Kebabs, GP ${gpBeforeKebab} -> ${count(sdk, /^coins$/i)}`);

  // Cross Al Kharid Gate or walk to Lumbridge East Cow Field (3255, 3278) to kill 5 Cows, get 5 Cowhides, tan them with Ellis, and Craft Leather!
  // Wait — East of the river at (3255, 3278) is reachable from Al Kharid via the north desert pass (3268, 3332) without even paying 10 GP toll! Or if we have >= 10 GP, or we can pickpocket 2 Men right here at (3295, 3207) for 6 GP first!
  console.log('=== Step 6: Pickpocket Men in Al Kharid for Toll + Upgrade Money ===');
  await bot.walkTo(3294, 3204, 3);
  for (let i = 0; i < 8 && count(sdk, /^coins$/i) < 25; i++) {
    await bot.dismissBlockingUI();
    if ((sdk.getState()?.player?.hp ?? 10) <= 5) {
      const kb = sdk.findInventoryItem(/^kebab$/i);
      if (kb) await bot.eatFood(kb);
      else break;
    }
    const m = sdk.findNearbyNpc(/^man$/i, { reachable: true });
    if (!m) { await sleep(600); continue; }
    const r = await bot.pickpocketNpc(m);
    if (!r.success) await sleep(4500);
    else await sleep(600);
  }

  // Pass toll gate (3268, 3227) into Lumbridge
  await bot.walkTo(3268, 3227, 1);
  const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2882 || l.id === 2883 || /gate/i.test(l.name));
  if (gate && (sdk.getState()?.player?.worldX ?? 0) >= 3268) {
    await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
    await sleep(1200);
    await chat(sdk, [/yes, ok/i]);
    await sleep(1500);
  }

  // 7. Combat Method 2: Lumbridge Cows (3255, 3278) — kill 5 Cows, loot 5 Cowhides + Bury Bones
  console.log('=== Step 7: Combat Method 2 (Lumbridge Cows) & Loot 5 Cowhides ===');
  await bot.walkTo(3255, 3278, 3);
  const atk0 = sdk.getSkill('Attack')?.experience ?? 0;
  const str0 = sdk.getSkill('Strength')?.experience ?? 0;
  const def0 = sdk.getSkill('Defence')?.experience ?? 0;
  const hp0 = sdk.getSkill('Hitpoints')?.experience ?? 0;
  const pray0 = sdk.getSkill('Prayer')?.experience ?? 0;
  const tCowStart = Date.now();
  let cowKills = 0;

  for (let i = 0; i < 5 && (Date.now() - tCowStart) < 120_000; i++) {
    await bot.dismissBlockingUI();
    if ((sdk.getState()?.player?.hp ?? 10) <= 6) {
      const kb = sdk.findInventoryItem(/^kebab$/i);
      if (kb) await bot.eatFood(kb);
    }
    const style = i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 3;
    await sdk.sendSetCombatStyle(style);
    const cow = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => /^cow$/i.test(n.name) && !n.inCombat && n.reachable !== false);
    if (!cow) {
      await bot.walkTo(3255, 3282, 3);
      await sleep(800);
      continue;
    }
    const r = await bot.attack(cow);
    if (r.success) {
      const waitEnd = Date.now() + 25_000;
      while (Date.now() < waitEnd && sdk.getState()?.player?.combat?.inCombat) {
        await sleep(500);
      }
      cowKills++;
      await sleep(600);
      const ground = await sdk.scanGroundItems();
      for (const pat of [/cow\s*hide/i, /^bones$/i]) {
        const g = ground.find(it => pat.test(it.name) && it.distance <= 5 && it.reachable !== false);
        if (g && (sdk.getInventory()?.length ?? 0) < 26) {
          await bot.pickupItem(g);
          await sleep(400);
        }
      }
      const bone = sdk.findInventoryItem(/^bones$/i);
      if (bone) { await sdk.sendUseItem(bone.slot); await sleep(800); }
    }
  }
  const cowSec = (Date.now() - tCowStart) / 1000;
  const atk1 = sdk.getSkill('Attack')?.experience ?? 0;
  const str1 = sdk.getSkill('Strength')?.experience ?? 0;
  const def1 = sdk.getSkill('Defence')?.experience ?? 0;
  const hp1 = sdk.getSkill('Hitpoints')?.experience ?? 0;
  const pray1 = sdk.getSkill('Prayer')?.experience ?? 0;
  const cowMeleeXp = (atk1 - atk0) + (str1 - str0) + (def1 - def0);
  console.log(`Combat Method 2 (Cows) summary: ${cowKills} kills in ${cowSec.toFixed(1)}s | Melee +${cowMeleeXp} XP (~${Math.round((cowMeleeXp * 3600) / Math.max(1, cowSec))} XP/hr), HP +${hp1 - hp0} XP, Prayer +${pray1 - pray0} XP, Cowhides: ${count(sdk, /cow\s*hide/i)}`);

  // 8. Tan Cowhides at Ellis (3275, 3191) via north desert pass (3268, 3332 -> 3283, 3332 -> 3275, 3191) or toll gate, then Craft Leather (Crafting Method 2)!
  console.log('=== Step 8: Tan Cowhides with Ellis & Craft Leather (Crafting Method 2) ===');
  if (count(sdk, /cow\s*hide/i) > 0) {
    // Walk around north pass so we keep our coins for tanning!
    await bot.walkTo(3268, 3332, 2);
    await bot.walkTo(3283, 3332, 2);
    await bot.walkTo(3285, 3260, 3);
    await bot.walkTo(3275, 3191, 2);

    // Inspect Ellis trade/tan interface or dialog
    const ellis = sdk.findNearbyNpc(/^ellis$/i);
    console.log('Ellis options:', ellis ? JSON.stringify(ellis.options) : 'not found');
    const rT = await bot.interactNpc(/^ellis$/i, /trade/i);
    console.log('Interact Ellis Trade:', rT.message, 'interface:', JSON.stringify(sdk.getState()?.interface), 'modal:', sdk.getState()?.modalInterface);
    if (sdk.getState()?.interface?.isOpen || sdk.getState()?.modalOpen) {
      // Try clicking Soft leather option or component 14804 / 14796
      const opts = sdk.getState()?.interface?.options ?? [];
      console.log('Tanning interface options:', JSON.stringify(opts));
      await sdk.sendClickComponent(14793); // Tan All Soft leather or Tan 5
      await sleep(600);
      await sdk.sendClickComponent(14801);
      await sleep(600);
      await sdk.sendClickComponent(14809);
      await sleep(600);
      await bot.closeInterface();
    }
    if (count(sdk, /^leather$/i) === 0 && count(sdk, /cow\s*hide/i) > 0) {
      const rTalk = await bot.talkTo(/^ellis$/i);
      if (rTalk.success) {
        await chat(sdk, [/yes please/i, /soft leather/i]);
      }
      await sleep(800);
      if (sdk.getState()?.interface?.isOpen || sdk.getState()?.modalOpen) {
        await sdk.sendClickComponent(14793);
        await sleep(600);
        await sdk.sendClickComponent(14817);
        await sleep(600);
        await bot.closeInterface();
      }
    }
    console.log(`After Ellis: Cowhides=${count(sdk, /cow\s*hide/i)}, Leather=${count(sdk, /^leather$/i)}`);

    if (sdk.findInventoryItem(/^leather$/i)) {
      const crXp0 = sdk.getSkill('Crafting')?.experience ?? 0;
      const tCrStart = Date.now();
      let crafted = 0;
      while (sdk.findInventoryItem(/^leather$/i) && (Date.now() - tCrStart) < 40_000) {
        await bot.dismissBlockingUI();
        const r = await bot.craftLeather('cowl');
        if (r.success) crafted++;
        console.log(`Craft Leather ${crafted}: ${r.success} (${r.message}) | Crafting Lv ${sdk.getSkill('Crafting')?.baseLevel} (${sdk.getSkill('Crafting')?.experience} xp)`);
      }
      const crSec = (Date.now() - tCrStart) / 1000;
      const crXp1 = sdk.getSkill('Crafting')?.experience ?? 0;
      console.log(`Crafting Method 2 (Leather Crafting) summary: ${crafted} items in ${crSec.toFixed(1)}s, +${crXp1 - crXp0} XP (~${Math.round(((crXp1 - crXp0) * 3600) / Math.max(1, crSec))} XP/hr) | Crafting Lv ${sdk.getSkill('Crafting')?.baseLevel}`);
    }
  }

  // Park safely at Al Kharid Bank (3269, 3167)
  await bot.walkTo(3269, 3167, 2);
}, { timeout: 7 * 60_000, disconnectAfter: true });
process.exit(0);
