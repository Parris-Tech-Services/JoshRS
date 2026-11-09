import { Ctx, Quest, has, count, sleep, talk, chat, waitInv, waitCond, step, openNearbyDoors } from '../quest-kit';
import { walkToKandarin } from './monks-friend';
import collisionData from '../../../sdk/collision-data.json';

const N = 'Sheep Herder';

const SHEEP_DEFS = [
  { id: 292, boneId: 280, startX: 2610, startZ: 3344 },
  { id: 293, boneId: 281, startX: 2620, startZ: 3367 },
  { id: 294, boneId: 282, startX: 2561, startZ: 3389 },
  { id: 295, boneId: 283, startX: 2611, startZ: 3391 },
];

const RAW_FLAGS = new Map<string, number>();
for (const [lvl, x, z, f] of (collisionData as any).tiles as [number, number, number, number][]) {
  if (lvl === 0 && x >= 2545 && x <= 2640 && z >= 3330 && z <= 3410) {
    RAW_FLAGS.set(`${x},${z}`, f);
  }
}
const GATE_TILES = new Set<string>();
for (let gx = 2592; gx <= 2594; gx++) {
  for (let gz = 3360; gz <= 3363; gz++) {
    GATE_TILES.add(`${gx},${gz}`);
  }
}
const PEN_TILES = new Set<string>();
for (let px = 2595; px <= 2609; px++) {
  for (let pz = 3351; pz <= 3364; pz++) {
    PEN_TILES.add(`${px},${pz}`);
  }
}
const WALK_BLOCKED = 256 | 262144 | 2097152;

function rawFlags(x: number, z: number): number {
  return RAW_FLAGS.get(`${x},${z}`) ?? 0;
}

function tileOpen(x: number, z: number): boolean {
  return (rawFlags(x, z) & WALK_BLOCKED) === 0;
}

function inPen(x: number, z: number): boolean {
  return PEN_TILES.has(`${x},${z}`);
}

function inGateZone(x: number, z: number): boolean {
  return GATE_TILES.has(`${x},${z}`);
}

function canStep(x: number, z: number, dx: number, dz: number): boolean {
  const nx = x + dx;
  const nz = z + dz;
  if (!tileOpen(x, z) || !tileOpen(nx, nz)) return false;
  if (dx === 1) return (rawFlags(x, z) & 8) === 0 && (rawFlags(nx, nz) & 128) === 0;
  if (dx === -1) return (rawFlags(x, z) & 128) === 0 && (rawFlags(nx, nz) & 8) === 0;
  if (dz === 1) return (rawFlags(x, z) & 2) === 0 && (rawFlags(nx, nz) & 32) === 0;
  if (dz === -1) return (rawFlags(x, z) & 32) === 0 && (rawFlags(nx, nz) & 2) === 0;
  return false;
}

function findCardinalPush(sx: number, sz: number): { first: [number, number]; len: number } | null {
  const visited = new Set<string>([`${sx},${sz}`]);
  const queue: { x: number; z: number; first: [number, number]; len: number }[] = [];
  const cardinals: [number, number][] = [[0, -1], [-1, 0], [1, 0], [0, 1]];
  for (const [dx, dz] of cardinals) {
    if (!canStep(sx, sz, dx, dz) || !canStep(sx, sz, -dx, -dz)) continue;
    const nx = sx + dx;
    const nz = sz + dz;
    if (inGateZone(nx, nz)) return { first: [dx, dz], len: 1 };
    visited.add(`${nx},${nz}`);
    queue.push({ x: nx, z: nz, first: [dx, dz], len: 1 });
  }
  let head = 0;
  while (head < queue.length && head < 6000) {
    const cur = queue[head++]!;
    for (const [dx, dz] of cardinals) {
      if (!canStep(cur.x, cur.z, dx, dz) || !canStep(cur.x, cur.z, -dx, -dz)) continue;
      const nx = cur.x + dx;
      const nz = cur.z + dz;
      if (nx < 2550 || nx > 2635 || nz < 3335 || nz > 3405 || inPen(nx, nz)) continue;
      const key = `${nx},${nz}`;
      if (visited.has(key)) continue;
      if (inGateZone(nx, nz)) return { first: cur.first, len: cur.len + 1 };
      visited.add(key);
      queue.push({ x: nx, z: nz, first: cur.first, len: cur.len + 1 });
    }
  }
  return null;
}

async function crossPenGate(c: Ctx, intoPen: boolean): Promise<boolean> {
  const { bot, sdk } = c;
  for (let i = 0; i < 4; i++) {
    const p = sdk.getState()?.player;
    if (p && inPen(p.worldX, p.worldZ) === intoPen) return true;
    await bot.walkTo(intoPen ? 2593 : 2595, 3361, 1);
    const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 166 || l.id === 167);
    if (gate) {
      await bot.interactLoc(gate, /^open$/i);
      await waitCond(() => {
        const cur = sdk.getState()?.player;
        return !!cur && inPen(cur.worldX, cur.worldZ) === intoPen;
      }, 4000, 300);
      await chat(c);
    }
  }
  const p = sdk.getState()?.player;
  return !!p && inPen(p.worldX, p.worldZ) === intoPen;
}

export const sheepherder: Quest = {
  name: N,
  async run(c: Ctx) {
    const { bot, sdk } = c;

    const startAndGear = () => step(c, N, 'start-and-gear', async () => {
      const wearingSuit = () => {
        const eq = sdk.getState()?.equipment ?? [];
        return eq.some((e: any) => /^plague jacket$/i.test(e.name)) && eq.some((e: any) => /^plague trousers$/i.test(e.name));
      };
      const wearingProd = () => (sdk.getState()?.equipment ?? []).some((e: any) => /^prod$/i.test(e.name));
      if (wearingSuit() && wearingProd() && has(sdk, /^feed$/i)) return true;

      await walkToKandarin(c, 2617, 3299);
      if (!has(sdk, /^feed$/i)) {
        await bot.walkTo(2617, 3299, 2);
        await talk(c, /^councillor halgrive$/i, [/what's wrong/i, /i can do that for you/i]);
      }

      if (!wearingSuit() && (!has(sdk, /^plague jacket$/i) || !has(sdk, /^plague trousers$/i))) {
        if (count(sdk, /^coins$/i) < 100) {
          await bot.walkTo(2615, 3332, 2);
          const ob = await bot.openBank();
          if (ob?.success) {
            const bc = sdk.findBankItem(/^coins$/i);
            if (bc) await sdk.sendBankWithdraw(bc.slot, 200);
            await sleep(500);
            await bot.closeBank();
          }
        }
        const wc = await bot.walkTo(2614, 3306, 2);
        if (!wc?.success) { await openNearbyDoors(c, 2614, 3304, 2); await bot.walkTo(2614, 3306, 2); }
        await talk(c, /^doctor orbon$/i, [/ok, i'll take it/i]);
      }

      if (has(sdk, /^plague jacket$/i)) await bot.equipItem(/^plague jacket$/i);
      if (has(sdk, /^plague trousers$/i)) await bot.equipItem(/^plague trousers$/i);

      if (!wearingProd() && !has(sdk, /^prod$/i)) {
        await crossPenGate(c, true);
        await bot.walkTo(2604, 3357, 2);
        for (let i = 0; i < 6 && !has(sdk, /^prod$/i); i++) {
          const g = (sdk.getState()?.groundItems ?? []).find((it: any) => it.id === 278 || /^prod$/i.test(it.name));
          if (g) {
            await bot.pickupItem(g);
            await waitInv(sdk, /^prod$/i, 3000);
          }
          await sleep(600);
        }
      }
      if (has(sdk, /^prod$/i)) await bot.equipItem(/^prod$/i);
      return wearingSuit() && wearingProd() && has(sdk, /^feed$/i);
    });

    const herdAndIncinerate = () => step(c, N, 'herd-and-incinerate', async () => {
      const disposedIds = new Set<number>();
      for (let pass = 0; pass < 2 && disposedIds.size < 4; pass++) {
        const pInit = sdk.getState()?.player;
        const orderedSheep = [...SHEEP_DEFS]
          .filter(sd => !disposedIds.has(sd.id))
          .sort((a, b) => {
            if (!pInit) return 0;
            return Math.hypot(pInit.worldX - a.startX, pInit.worldZ - a.startZ) - Math.hypot(pInit.worldX - b.startX, pInit.worldZ - b.startZ);
          });
        for (const sd of orderedSheep) {
          let alreadyDisposed = false;
          if (!(sdk.getState()?.inventory ?? []).some((it: any) => it.id === sd.boneId)) {
            await crossPenGate(c, false);

            let targetIdx: number | null = null;
            let missCount = 0;
            for (let iter = 0; iter < 160; iter++) {
              const inPenSheep = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === sd.id && inPen(n.x, n.z));
              if (inPenSheep) break;

              const candidates = (sdk.getState()?.nearbyNpcs ?? [])
                .filter((n: any) => n.id === sd.id && !inPen(n.x, n.z))
                .map((n: any) => ({ n, push: inGateZone(n.x, n.z) ? { first: [1, 0] as [number, number], len: 0 } : findCardinalPush(n.x, n.z) }))
                .filter((x: any) => !!x.push)
                .sort((a: any, b: any) => a.push!.len - b.push!.len);
              const chosenCand = (targetIdx !== null ? candidates.find((x: any) => x.n.index === targetIdx) : undefined) ?? candidates[0];
              const sheep = chosenCand?.n;
              if (!sheep) {
                await bot.walkTo(sd.startX, sd.startZ, 3);
                await sleep(600);
                continue;
              }
              targetIdx = sheep.index;

              if (inGateZone(sheep.x, sheep.z)) {
                const beforeGateTick = sdk.getState()?.tick ?? 0;
                await sdk.sendInteractNpc(sheep.index, 1);
                await waitCond(() => {
                  if (sdk.getState()?.dialog?.isOpen) return true;
                  return !!(sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === sd.id && inPen(n.x, n.z));
                }, 2600, 150);
                const recentDisposed = (sdk.getState()?.recentDialogs ?? []).some((d: any) =>
                  (d.tick ?? 0) >= beforeGateTick && /already disposed/i.test((d.text ?? d.lines ?? []).join(' '))
                );
                if (sdk.getState()?.dialog?.isOpen) await chat(c);
                if (recentDisposed) { alreadyDisposed = true; disposedIds.add(sd.id); break; }
                continue;
              }

              if (iter === 0) {
                const p0 = sdk.getState()?.player;
                if (!p0 || Math.hypot(p0.worldX - sheep.x, p0.worldZ - sheep.z) > 3) {
                  await bot.walkTo(sheep.x, sheep.z, 2);
                }
                const beforeTick0 = sdk.getState()?.tick ?? 0;
                const s0 = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.index === sheep.index);
                if (s0) {
                  const bx0 = s0.x;
                  const bz0 = s0.z;
                  await sdk.sendInteractNpc(s0.index, 1);
                  await waitCond(() => {
                    if (sdk.getState()?.dialog?.isOpen) return true;
                    const rec = (sdk.getState()?.recentDialogs ?? []).some((d: any) =>
                      (d.tick ?? 0) >= beforeTick0 && /already disposed/i.test((d.text ?? d.lines ?? []).join(' '))
                    );
                    if (rec) return true;
                    const cs = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.index === s0.index);
                    return !cs || cs.x !== bx0 || cs.z !== bz0;
                  }, 2400, 150);
                  const recDisposed0 = (sdk.getState()?.recentDialogs ?? []).some((d: any) =>
                    (d.tick ?? 0) >= beforeTick0 && /already disposed/i.test((d.text ?? d.lines ?? []).join(' '))
                  );
                  if (sdk.getState()?.dialog?.isOpen) {
                    const dText = [
                      ...(sdk.getState()?.dialog?.options ?? []).map((o: any) => o.text),
                      ...((sdk.getState()?.recentDialogs ?? []).slice(0, 3).flatMap((d: any) => d.text ?? d.lines ?? [])),
                    ].join(' ');
                    await chat(c);
                    if (/already disposed/i.test(dText) || recDisposed0) { alreadyDisposed = true; disposedIds.add(sd.id); break; }
                  } else if (recDisposed0) {
                    alreadyDisposed = true;
                    disposedIds.add(sd.id);
                    break;
                  }
                }
                continue;
              }

              const [pdx, pdz] = chosenCand!.push!.first;
              const lead = missCount >= 1 && canStep(sheep.x - pdx, sheep.z - pdz, -pdx, -pdz) ? 2 : 1;
              const bx = sheep.x - lead * pdx;
              const bz = sheep.z - lead * pdz;

              const p0 = sdk.getState()?.player;
              if (!p0 || Math.hypot(p0.worldX - bx, p0.worldZ - bz) > 5) {
                await bot.walkTo(bx, bz, 1);
              }
              const p1 = sdk.getState()?.player;
              if (!p1 || p1.worldX !== bx || p1.worldZ !== bz) {
                await sdk.sendWalk(bx, bz, true);
                await waitCond(() => {
                  const cp = sdk.getState()?.player;
                  return !!cp && cp.worldX === bx && cp.worldZ === bz;
                }, 2400, 150);
              }
              if (lead === 2) {
                await waitCond(() => {
                  const cp = sdk.getState()?.player;
                  const cs = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.index === sheep.index);
                  return !!cp && !!cs && cs.x - cp.worldX === pdx && cs.z - cp.worldZ === pdz;
                }, 900, 150);
              }

              const sNow = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.index === sheep.index);
              const pNow = sdk.getState()?.player;
              if (!sNow || !pNow) continue;
              if (sNow.x - pNow.worldX !== pdx || sNow.z - pNow.worldZ !== pdz) {
                missCount = (sNow.x !== sheep.x || sNow.z !== sheep.z) ? 1 : 0;
                continue;
              }
              missCount = 0;
              const beforeX = sNow.x;
              const beforeZ = sNow.z;
              const beforeTick = sdk.getState()?.tick ?? 0;
              await sdk.sendInteractNpc(sNow.index, 1);
              await waitCond(() => {
                if (sdk.getState()?.dialog?.isOpen) return true;
                const rec = (sdk.getState()?.recentDialogs ?? []).some((d: any) =>
                  (d.tick ?? 0) >= beforeTick && /already disposed/i.test((d.text ?? d.lines ?? []).join(' '))
                );
                if (rec) return true;
                const cs = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.index === sNow.index);
                return !cs || cs.x !== beforeX || cs.z !== beforeZ || inPen(cs.x, cs.z);
              }, 2400, 150);

              const recDisposed = (sdk.getState()?.recentDialogs ?? []).some((d: any) =>
                (d.tick ?? 0) >= beforeTick && /already disposed/i.test((d.text ?? d.lines ?? []).join(' '))
              );
              if (sdk.getState()?.dialog?.isOpen) {
                const dText = [
                  ...(sdk.getState()?.dialog?.options ?? []).map((o: any) => o.text),
                  ...((sdk.getState()?.recentDialogs ?? []).slice(0, 3).flatMap((d: any) => d.text ?? d.lines ?? [])),
                ].join(' ');
                await chat(c);
                if (/already disposed/i.test(dText) || recDisposed) { alreadyDisposed = true; disposedIds.add(sd.id); break; }
              } else if (recDisposed) {
                alreadyDisposed = true;
                disposedIds.add(sd.id);
                break;
              }
            }
          }
          if (alreadyDisposed) continue;

          // Poison sheep inside pen and incinerate its bones
          const inPenSheep = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === sd.id && inPen(n.x, n.z));
          if (inPenSheep) {
            await crossPenGate(c, true);
            for (let i = 0; i < 4; i++) {
              const target = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) => n.id === sd.id && inPen(n.x, n.z));
              if (!target) break;
              const feed = sdk.findInventoryItem(/^feed$/i);
              if (!feed) break;
              await bot.walkTo(target.x, target.z, 1);
              await sdk.sendUseItemOnNpc(feed.slot, target.index);
              await sleep(1200);
              await chat(c);
              await sleep(2200);
            }

            for (let i = 0; i < 8 && !(sdk.getState()?.inventory ?? []).some((it: any) => it.id === sd.boneId); i++) {
              const gb = (sdk.getState()?.groundItems ?? []).find((it: any) => it.id === sd.boneId);
              if (gb) {
                await bot.pickupItem(gb);
                await sleep(1000);
              } else {
                await sleep(600);
              }
            }

            const boneInv = (sdk.getState()?.inventory ?? []).find((it: any) => it.id === sd.boneId);
            if (boneInv) {
              await bot.walkTo(2606, 3360, 2);
              const furn = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 165 || /^furnace$/i.test(l.name));
              if (furn) {
                await sdk.sendUseItemOnLoc(boneInv.slot, furn.x, furn.z, furn.id);
                if (await waitCond(() => !(sdk.getState()?.inventory ?? []).some((it: any) => it.id === sd.boneId), 6000, 300)) {
                  disposedIds.add(sd.id);
                }
              }
            }
          }
        }
      }
      await crossPenGate(c, false);
      return true;
    });

    const finishHalgrive = () => step(c, N, 'finish-halgrive', async () => {
      const before = count(sdk, /^coins$/i);
      await bot.walkTo(2617, 3299, 2);
      await talk(c, /^councillor halgrive$/i);
      await bot.dismissBlockingUI();
      return count(sdk, /^coins$/i) >= before + 3000;
    });

    return (await startAndGear()) && (await herdAndIncinerate()) && (await finishHalgrive());
  },
};
