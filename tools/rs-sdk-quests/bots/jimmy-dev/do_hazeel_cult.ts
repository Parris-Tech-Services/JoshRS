import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  async function talkAndChoose(npcPattern: RegExp, choices: RegExp[]) {
    const npc = sdk.findNearbyNpc(npcPattern);
    if (!npc) {
      console.log(`NPC ${npcPattern} not found! Nearby:`, sdk.getNearbyNpcs().map(n => `${n.name}(${n.id})`));
      return;
    }
    console.log(`Talking to ${npc.name} (id=${npc.id})...`);
    await bot.talkTo(npc);
    let choiceIdx = 0;
    for (let i = 0; i < 40; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      if (d.options && d.options.length > 1) {
        const pat = choices[choiceIdx] ?? choices[choices.length - 1];
        console.log(`Choosing ${pat} from:`, d.options.map(o => o.text));
        await sdk.clickDialogByText(pat);
        choiceIdx++;
      } else {
        await sdk.sendClickDialog(0);
      }
      await sdk.waitForTicks(2);
    }
    await bot.dismissBlockingUI();
  }

  // 1. Climb up stairs from cave if inside cave
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) {
    const stairs = sdk.findNearbyLoc(/stairs/i);
    if (stairs) {
      await bot.interactLoc(stairs, 'Climb-up');
      await sdk.waitForTicks(3);
    }
  }

  // 2. Walk to Carnillean Mansion (2569, 3275) and talk to Sir Ceril Carnillean
  await bot.walkTo(2569, 3275, 2);
  let ceril = sdk.findNearbyNpc(/ceril/i);
  if (ceril && !ceril.reachable) {
    await bot.walkTo(ceril.x, ceril.z, 1);
    ceril = sdk.findNearbyNpc(/ceril/i);
  }
  await talkAndChoose(/ceril/i, [/what's wrong/i, /yes, of course/i]);

  // 3. Walk to Cave entrance (2585, 3234) and talk to Clivet
  await bot.walkTo(2585, 3235, 2);
  const cave = sdk.findNearbyLoc(/cave entrance/i);
  if (cave) {
    await bot.interactLoc(cave, 'Enter');
    await sdk.waitForTicks(3);
  }
  await talkAndChoose(/clivet/i, [/what do you mean/i, /what would i have to do/i, /ok, count me in/i]);
  console.log('Inventory after Clivet:', sdk.getInventory().map(i => i.name));

  // 4. Climb up stairs, walk to Carnillean Mansion basement (ladder at 2570, 3276)
  const stairs = sdk.findNearbyLoc(/stairs/i);
  if (stairs) {
    await bot.interactLoc(stairs, 'Climb-up');
    await sdk.waitForTicks(3);
  }
  await bot.walkTo(2570, 3275, 2);
  const downLadder = sdk.getNearbyLocs().find(l => l.id === 1756 || /ladder/i.test(l.name) && l.options.some(o => /climb-down/i.test(o)));
  console.log('Basement ladder:', downLadder);
  if (downLadder) {
    await bot.interactLoc(downLadder, 'Climb-down');
    await sdk.waitForTicks(3);
  }
  console.log('In basement:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);

  // Search crate (2858) for key and use Poison on Range (2859)
  const crate = sdk.getNearbyLocs().find(l => l.id === 2858 || /crate/i.test(l.name));
  if (crate) {
    await bot.interactLoc(crate, 'Search');
    await sdk.waitForTicks(3);
    await bot.dismissBlockingUI();
  }
  const poison = sdk.findInventoryItem(/poison/i);
  const range = sdk.getNearbyLocs().find(l => l.id === 2859 || /range/i.test(l.name));
  if (poison && range) {
    await bot.useItemOnLoc(poison, range);
    await sdk.waitForTicks(4);
    await bot.dismissBlockingUI();
  }
  console.log('Inventory after basement:', sdk.getInventory().map(i => i.name));

  // Climb back up ladder
  const upLadder = sdk.findNearbyLoc(/ladder/i);
  if (upLadder) {
    await bot.interactLoc(upLadder, 'Climb-up');
    await sdk.waitForTicks(3);
  }

  // 5. Turn the 5 sewer valves
  const valves: [number, number, number, string][] = [
    [2844, 2562, 3247, 'Turn-right'],
    [2845, 2572, 3263, 'Turn-right'],
    [2846, 2585, 3245, 'Turn-left'],
    [2847, 2597, 3263, 'Turn-right'],
    [2848, 2609, 3243, 'Turn-right'],
  ];
  for (const [id, vx, vz, op] of valves) {
    await bot.walkTo(vx, vz, 2);
    const vloc = sdk.getNearbyLocs().find(l => l.id === id);
    console.log(`Valve ${id} at (${vx},${vz}):`, vloc?.name, vloc?.options);
    if (vloc) {
      await bot.interactLoc(vloc, op);
      await sdk.waitForTicks(3);
      await bot.dismissBlockingUI();
    }
  }

  // 6. Enter cave, talk to Clivet, board raft, talk to Alomone
  await bot.walkTo(2585, 3235, 2);
  const cave2 = sdk.findNearbyLoc(/cave entrance/i);
  if (cave2) {
    await bot.interactLoc(cave2, 'Enter');
    await sdk.waitForTicks(3);
  }
  await talkAndChoose(/clivet/i, []);
  const raft = sdk.findNearbyLoc(/raft/i);
  if (raft) {
    await bot.interactLoc(raft, 'Board');
    await sdk.waitForTicks(4);
    await bot.dismissBlockingUI();
  }
  console.log('After raft pos:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  await bot.walkTo(2607, 9672, 3);
  // Test Talk-to on Hazeel Cultist first
  const cultist = sdk.findNearbyNpc(/hazeel cultist/i);
  if (cultist) {
    const cr = await bot.talkTo(cultist);
    await sdk.waitForTicks(2);
    console.log('Talk-to Hazeel Cultist:', cr.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    await bot.dismissBlockingUI();
  }
  await talkAndChoose(/alomone/i, []);
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 240_000,
});
