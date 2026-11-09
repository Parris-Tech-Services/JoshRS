import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  async function clearDialog() {
    for (let i = 0; i < 30; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      await sdk.sendClickDialog(0);
      await sdk.waitForTicks(2);
    }
    await bot.dismissBlockingUI();
  }

  await clearDialog();

  // 1. In basement (2570, 9670): talk to Claus, search Crate (2858), use Poison on Range (2859)
  const claus = sdk.findNearbyNpc(/claus/i);
  if (claus) {
    const r = await bot.talkTo(claus);
    await sdk.waitForTicks(2);
    console.log('Talk-to Claus:', r.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    await clearDialog();
  }

  const crate = sdk.getNearbyLocs().find(l => l.id === 2858);
  if (crate) {
    await bot.interactLoc(crate, 'Search');
    await sdk.waitForTicks(3);
    await clearDialog();
  }
  await bot.walkTo(2565, 9672, 2);
  const poison = sdk.findInventoryItem(/poison/i);
  const range = sdk.getNearbyLocs().find(l => l.id === 2859 || /range/i.test(l.name));
  console.log('Poison:', poison?.name, 'Range:', range?.name, range?.id);
  if (poison && range) {
    await bot.useItemOnLoc(poison, range);
    await sdk.waitForTicks(4);
    await clearDialog();
  }
  console.log('Inventory after basement:', sdk.getInventory().map(i => i.name));

  // Climb up ladder to mansion ground floor
  const upLadder = sdk.findNearbyLoc(/ladder/i);
  if (upLadder) {
    await bot.interactLoc(upLadder, 'Climb-up');
    await sdk.waitForTicks(3);
  }
  console.log('On surface:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);

  // 2. Turn the 5 sewer valves (walk to adjacent tile, not the valve tile itself)
  const valves: [number, number, number, string][] = [
    [2844, 2562, 3246, 'Turn-right'],
    [2845, 2572, 3262, 'Turn-right'],
    [2846, 2585, 3244, 'Turn-left'],
    [2847, 2597, 3262, 'Turn-right'],
    [2848, 2609, 3242, 'Turn-right'],
  ];
  for (const [id, vx, vz, op] of valves) {
    await bot.walkTo(vx, vz, 2);
    const vloc = sdk.getNearbyLocs().find(l => l.id === id);
    console.log(`Valve ${id}:`, vloc?.name, vloc?.options);
    if (vloc) {
      await bot.interactLoc(vloc, op);
      await sdk.waitForTicks(3);
      await clearDialog();
    }
  }

  // 3. Enter cave (2585, 3235), talk to Clivet, board raft, talk to Hazeel Cultist & Alomone
  await bot.walkTo(2585, 3235, 2);
  const cave = sdk.findNearbyLoc(/cave entrance/i);
  if (cave) {
    await bot.interactLoc(cave, 'Enter');
    await sdk.waitForTicks(3);
  }
  const clivet = sdk.findNearbyNpc(/clivet/i);
  if (clivet) {
    await bot.talkTo(clivet);
    await clearDialog();
  }
  console.log('Inventory after Clivet 2:', sdk.getInventory().map(i => i.name));

  const raft = sdk.findNearbyLoc(/raft/i);
  if (raft) {
    await bot.interactLoc(raft, 'Board');
    await sdk.waitForTicks(4);
    await clearDialog();
  }
  console.log('After raft pos:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ);
  await bot.walkTo(2607, 9672, 3);
  const cultist = sdk.findNearbyNpc(/hazeel cultist/i);
  if (cultist) {
    const cr = await bot.talkTo(cultist);
    await sdk.waitForTicks(2);
    console.log('Talk-to Hazeel Cultist (id=' + cultist.id + '):', cr.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    await clearDialog();
  }
  const alomone = sdk.findNearbyNpc(/alomone/i);
  if (alomone) {
    const ar = await bot.talkTo(alomone);
    await sdk.waitForTicks(2);
    console.log('Talk-to Alomone (id=' + alomone.id + '):', ar.message, '| dialog:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
    await clearDialog();
  }

  // 4. Return via raft -> stairs -> mansion upstairs -> get Scroll of Hazeel
  await bot.walkTo(2606, 9692, 2);
  const raftBack = sdk.findNearbyLoc(/raft/i);
  if (raftBack) {
    await bot.interactLoc(raftBack, 'Board');
    await sdk.waitForTicks(4);
    await clearDialog();
  }
  const stairs = sdk.findNearbyLoc(/stairs/i);
  if (stairs) {
    await bot.interactLoc(stairs, 'Climb-up');
    await sdk.waitForTicks(3);
  }
  await bot.walkTo(2569, 3269, 2);
  const mansionStairs = sdk.findNearbyLoc(/staircase|stairs/i);
  console.log('Mansion stairs:', mansionStairs);
  if (mansionStairs) {
    await bot.interactLoc(mansionStairs, 'Climb-up');
    await sdk.waitForTicks(3);
  }
  console.log('On mansion L1:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);
  const secretWall = sdk.getNearbyLocs().find(l => l.id === 2854 || /wall/i.test(l.name));
  console.log('Secret wall:', secretWall);
  if (secretWall) {
    await bot.interactLoc(secretWall, 'Knock-at');
    await sdk.waitForTicks(4);
  }
  const l1Ladder = sdk.findNearbyLoc(/ladder/i);
  console.log('L1 ladder to L2:', l1Ladder);
  if (l1Ladder) {
    await bot.interactLoc(l1Ladder, 'Climb-up');
    await sdk.waitForTicks(3);
  }
  console.log('On mansion L2:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);
  const key = sdk.findInventoryItem(/key/i);
  const shutChest = sdk.getNearbyLocs().find(l => l.id === 2856 || /closed chest/i.test(l.name));
  if (key && shutChest) {
    await bot.useItemOnLoc(key, shutChest);
    await sdk.waitForTicks(3);
  }
  const openChest = sdk.findNearbyLoc(/open chest/i);
  if (openChest) {
    await bot.interactLoc(openChest, 'Search');
    await sdk.waitForTicks(3);
    await clearDialog();
  }
  console.log('Inventory on L2:', sdk.getInventory().map(i => i.name));
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 240_000,
});
