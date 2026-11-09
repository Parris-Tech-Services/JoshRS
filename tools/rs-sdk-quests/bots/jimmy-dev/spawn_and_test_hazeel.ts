import { runScript } from '../../sdk/runner';

await runScript(async ({ bot, sdk }) => {
  async function clearDialog() {
    for (let i = 0; i < 40; i++) {
      const d = sdk.getDialog();
      if (!d?.isOpen) break;
      const idx = d.options?.[0]?.index ?? 0;
      await sdk.sendClickDialog(idx);
      await sdk.waitForTicks(2);
    }
    await bot.dismissBlockingUI();
  }

  // Currently at (2608, 9672) next to Alomone:
  // Ride raft back -> climb stairs -> climb mansion stairs to L1 -> knock wall -> climb to L2 -> get Scroll of Hazeel
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
  await bot.walkTo(2569, 3272, 1);
  await sdk.sendInteractLoc(2568, 3268, 1722, 1);
  await sdk.waitForTicks(5);
  console.log('On L1:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);

  const doorL1 = sdk.getNearbyLocs().find(l => l.x === 2572 && l.z === 3268 && l.id === 1533);
  if (doorL1) {
    await sdk.sendInteractLoc(2572, 3268, 1533, 1);
    await sdk.waitForTicks(4);
  }
  await sdk.sendInteractLoc(2572, 3270, 2854, 1);
  await sdk.waitForTicks(5);
  console.log('Pos after wall:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);

  await sdk.sendInteractLoc(2573, 3271, 1747, 1);
  await sdk.waitForTicks(4);
  console.log('On L2:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);
  console.log('L2 locs:', sdk.getNearbyLocs().map(l => `${l.name}(id=${l.id}) @ (${l.x},${l.z}) ops=${l.options.join('/')}`));

  const key = sdk.findInventoryItem(/key/i);
  const chest = sdk.getNearbyLocs().find(l => l.id === 2856);
  if (key && chest) {
    await bot.useItemOnLoc(key, chest);
    await sdk.waitForTicks(3);
  }
  const openChest = sdk.getNearbyLocs().find(l => l.id === 2857 || /chest/i.test(l.name));
  console.log('Open chest:', openChest);
  if (openChest) {
    await sdk.sendInteractLoc(openChest.x, openChest.z, openChest.id, 1);
    await sdk.waitForTicks(3);
    await clearDialog();
  }
  console.log('Inventory after chest:', sdk.getInventory().map(i => i.name));

  // Climb down ladder -> knock wall -> open door if needed -> climb down staircase
  const downLadder = sdk.findNearbyLoc(/ladder/i);
  if (downLadder) {
    await sdk.sendInteractLoc(downLadder.x, downLadder.z, downLadder.id, 1);
    await sdk.waitForTicks(4);
  }
  await sdk.sendInteractLoc(2572, 3270, 2854, 1);
  await sdk.waitForTicks(5);
  const doorL1Back = sdk.getNearbyLocs().find(l => l.x === 2572 && l.z === 3268 && l.id === 1533);
  if (doorL1Back) {
    await sdk.sendInteractLoc(2572, 3268, 1533, 1);
    await sdk.waitForTicks(3);
  }
  await sdk.sendInteractLoc(2568, 3268, 1723, 1);
  await sdk.waitForTicks(4);
  console.log('Back on L0:', sdk.getState()?.player?.worldX, sdk.getState()?.player?.worldZ, 'L' + sdk.getState()?.player?.level);

  // Walk to cave -> Clivet -> raft -> Alomone -> spawn Hazeel (892) -> test Talk-to!
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
  const raft = sdk.findNearbyLoc(/raft/i);
  if (raft) {
    await bot.interactLoc(raft, 'Board');
    await sdk.waitForTicks(4);
    await clearDialog();
  }
  await bot.walkTo(2607, 9672, 2);
  const alomone = sdk.findNearbyNpc(/alomone/i);
  if (alomone) {
    await bot.talkTo(alomone);
    for (let i = 0; i < 45; i++) {
      const hazeel = sdk.getNearbyNpcs().find(n => n.id === 892 || /^hazeel$/i.test(n.name));
      if (hazeel) {
        console.log('HAZEEL SPAWNED:', hazeel);
        const hr = await sdk.sendInteractNpc(hazeel.index, 1);
        console.log('sendInteractNpc(Hazeel, 1):', hr);
        await sdk.waitForTicks(5);
        console.log('Recent messages after clicking Hazeel:', sdk.getState()?.gameMessages.slice(-8));
        console.log('Dialog after clicking Hazeel:', sdk.getDialog()?.allComponents?.map(c => c.text).filter(Boolean));
        break;
      }
      const d = sdk.getDialog();
      if (d?.isOpen) {
        await sdk.sendClickDialog(d.options?.[0]?.index ?? 0);
      }
      await sdk.waitForTicks(2);
    }
  }
}, {
  bot: 'jimmy-dev',
  gatewayUrl: 'ws://localhost:7781',
  disconnectAfter: true,
  timeout: 180_000,
});
