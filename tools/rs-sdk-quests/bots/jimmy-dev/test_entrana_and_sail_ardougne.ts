import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  const getCoins = () => sdk.findInventoryItem(/^coins$/i)?.count ?? 0;
  const getHp = () => (sdk.getSkill('Hitpoints') || sdk.getSkill('HP'))?.level ?? 10;

  // Drop bronze sword and bronze axe so Monk of Entrana lets us board
  for (const pat of [/bronze sword/i, /bronze axe/i]) {
    const it = sdk.findInventoryItem(pat);
    if (it) {
      await sdk.sendDropItem(it.slot);
      await sdk.waitForTicks(2);
    }
  }

  console.log('Starting coins:', getCoins());
  while (getCoins() < 60 && getHp() > 2) {
    const man = sdk.findNearbyNpc(/^man|woman$/i, 15);
    if (!man) {
      await sdk.waitForTicks(2);
      continue;
    }
    const r = await bot.pickpocketNpc(man);
    console.log(`Pickpocket: ${r.message} (Coins=${getCoins()}, HP=${getHp()})`);
  }

  // Walk to Port Sarim Entrana docks (3046, 3235)
  for (const [wx, wz] of [[3160, 3235], [3100, 3250], [3046, 3235]]) {
    await bot.walkTo(wx, wz, 3);
  }

  // Talk to Monk of Entrana (657) to sail to Entrana
  const monk = sdk.findNearbyNpc(/monk of entrana/i);
  if (monk) {
    console.log('Found Port Sarim Monk of Entrana:', monk.id, monk.optionsWithIndex.map(o => o.text));
    await bot.talkTo(monk);
    for (let i = 0; i < 15; i++) {
      const d = sdk.getDialog();
      if (d?.isOpen) {
        if (d.options && d.options.length > 1) {
          await sdk.clickDialogByText(/yes|okay|take me/i);
        } else {
          await sdk.sendClickDialog(0);
        }
      }
      await sdk.waitForTicks(2);
      if ((sdk.getState()?.player?.worldX ?? 3046) < 2860) break;
    }
    await sdk.waitForTicks(3);
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
      await bot.interactLoc(plank, 'Cross');
      await sdk.waitForTicks(3);
    }
  }

  console.log('Pos on Entrana:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);
  // Test Monk of Entrana (658, shipmonk2) on Entrana docks (2835, 3336) and (2839, 3335)
  const entranaMonks = sdk.getNearbyNpcs().filter(n => /monk of entrana/i.test(n.name));
  console.log('Entrana Monks:', entranaMonks.map(m => `${m.name} (id=${m.id}) @ (${m.x},${m.z}) ops=${m.options.join('/')}`));
  if (entranaMonks.length > 0) {
    const em = entranaMonks[0];
    const tr = await bot.talkTo(em);
    console.log('Talk-to Entrana Monk (658):', tr.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    // Sail back to Port Sarim!
    for (let i = 0; i < 15; i++) {
      const d = sdk.getDialog();
      if (d?.isOpen) {
        if (d.options && d.options.length > 1) {
          await sdk.clickDialogByText(/yes|leave|ready/i);
        } else {
          await sdk.sendClickDialog(0);
        }
      }
      await sdk.waitForTicks(2);
      if ((sdk.getState()?.player?.worldX ?? 2834) > 3000) break;
    }
    await sdk.waitForTicks(3);
    const plank2 = sdk.findNearbyLoc(/gangplank/i);
    if (plank2) {
      await bot.interactLoc(plank2, 'Cross');
      await sdk.waitForTicks(3);
    }
  }

  console.log('Pos back in Port Sarim:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);

  // Now walk to Karamja sailor (3027, 3217)
  await bot.walkTo(3027, 3217, 3);
  const sailor = sdk.findNearbyNpc(/captain tobias|seaman lorris|seaman thresnor/i);
  if (sailor) {
    await bot.talkTo(sailor);
    for (let i = 0; i < 15; i++) {
      const d = sdk.getDialog();
      if (d?.isOpen) {
        if (d.options && d.options.length > 1) {
          await sdk.clickDialogByText(/yes/i);
        } else {
          await sdk.sendClickDialog(0);
        }
      }
      await sdk.waitForTicks(2);
      if ((sdk.getState()?.player?.worldX ?? 3027) < 2970) break;
    }
    await sdk.waitForTicks(3);
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
      await bot.interactLoc(plank, 'Cross');
      await sdk.waitForTicks(3);
    }
  }
  console.log('Pos on Karamja:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);

  // Walk across Karamja to Brimhaven docks (2772, 3227)
  for (const [wx, wz] of [[2900, 3172], [2835, 3185], [2772, 3227]]) {
    await bot.walkTo(wx, wz, 4);
  }
  const customs = sdk.findNearbyNpc(/customs officer|captain barnaby/i);
  if (customs) {
    await bot.talkTo(customs);
    for (let i = 0; i < 20; i++) {
      const d = sdk.getDialog();
      if (d?.isOpen) {
        if (d.options && d.options.length > 1) {
          await sdk.clickDialogByText(/can i journey|search away|ok/i);
        } else {
          await sdk.sendClickDialog(0);
        }
      }
      await sdk.waitForTicks(2);
      if ((sdk.getState()?.player?.worldZ ?? 3225) > 3260) break;
    }
    await sdk.waitForTicks(4);
    await bot.closeInterface();
    const plank = sdk.findNearbyLoc(/gangplank/i);
    if (plank) {
      await bot.interactLoc(plank, 'Cross');
      await sdk.waitForTicks(4);
    }
  }
  console.log('Pos in East Ardougne:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 240_000,
});
