import { runScript } from '../../sdk/runner';
import { appendFileSync, mkdirSync, writeFileSync } from 'fs';

export type Ctx = { bot: any; sdk: any; dir: string; sleep: (ms: number) => Promise<any> };
export type Quest = { name: string; run: (c: Ctx) => Promise<boolean> };

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const has = (sdk: any, re: RegExp) => !!sdk.findInventoryItem(re);
export const count = (sdk: any, re: RegExp) =>
  (sdk.getState()?.inventory ?? []).filter((i: any) => re.test(i.name)).reduce((a: number, i: any) => a + (i.count ?? 1), 0);
export const xp = (sdk: any, skill: string) => sdk.getSkillXp(skill) ?? 0;
export const lvl = (sdk: any) => sdk.getState()?.player?.level ?? 0;
export const log = (c: Ctx, m: string) => { console.log(m); appendFileSync(`${c.dir}/lab_log.md`, `- ${new Date().toISOString()} ${m}\n`); };

export async function waitInv(sdk: any, re: RegExp, ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (has(sdk, re)) return true; await sleep(300); }
  return false;
}

export async function waitCond(pred: () => boolean, ms: number, interval = 300) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (pred()) return true; await sleep(interval); }
  return pred();
}

// Click through a dialog, choosing the first option matching `want` (in `want` priority order), else "continue".
export async function chat({ sdk }: Ctx, want: RegExp[] = [], max = 100) {
  let closed = 0;
  for (let i = 0; i < max; i++) {
    const d = sdk.getState()?.dialog;
    if (!d?.isOpen) {
      if (++closed >= 5) return;
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

export async function openNearbyDoors(c: Ctx, nearX?: number, nearZ?: number, limit = 3) {
  const me = c.sdk.getState()?.player ?? { worldX: 0, worldZ: 0 };
  const tx = nearX ?? me.worldX, tz = nearZ ?? me.worldZ;
  const doors = (c.sdk.getState()?.nearbyLocs ?? [])
    .filter((l: any) => /door|gate/i.test(l.name) && (l.options ?? []).some((o: string) => /^open$/i.test(o)) && !(l.x === 3108 && l.z === 3353))
    .sort((a: any, b: any) => Math.hypot(a.x - tx, a.z - tz) - Math.hypot(b.x - tx, b.z - tz));
  for (const d of doors.slice(0, limit)) {
    await c.bot.interactLoc(d, /^open$/i);
    await sleep(1000);
  }
}

export async function talk(c: Ctx, npc: RegExp, want: RegExp[] = []) {
  if (c.sdk.getState()?.dialog?.isOpen) await chat(c, want);
  let r = await c.bot.talkTo(npc);
  if (!r.success) {
    const target = c.sdk.findNearbyNpc(npc);
    await openNearbyDoors(c, target?.x, target?.z, 3);
    r = await c.bot.talkTo(npc);
  }
  if (!r.success) { log(c, `talkTo ${npc} failed: ${r.message ?? r.reason}`); return false; }
  await chat(c, want);
  return true;
}

// Climb Lumbridge Castle south spiral staircase at (3204,3207), landing tile (3205,3209).
export async function lumbridgeStairs(c: Ctx, targetLevel: 0 | 1 | 2): Promise<boolean> {
  const { bot, sdk } = c;
  const p0 = sdk.getState()?.player;
  if (p0 && Math.hypot(p0.worldX - 3205, p0.worldZ - 3209) > 35) return false;
  for (let attempt = 0; attempt < 6 && lvl(sdk) !== targetLevel; attempt++) {
    const cur = lvl(sdk);
    const dir = cur < targetLevel ? /climb-?up/i : /climb-?down/i;
    const tiles: [number, number][] = [[3205, 3209], [3206, 3208], [3205, 3210]];
    for (const [x, z] of tiles) {
      if (lvl(sdk) !== cur) break;
      const w = await bot.walkTo(x, z, 1);
      if (!w?.success) {
        await openNearbyDoors(c, x, z, 2);
        await bot.walkTo(x, z, 1);
      }
      const stairs = (sdk.getState()?.nearbyLocs ?? [])
        .filter((l: any) => /stair/i.test(l.name) && Math.hypot(l.x - 3204, l.z - 3207) <= 3)[0] ?? /^staircase$/i;
      const r = await bot.interactLoc(stairs, dir);
      log(c, `lumbridgeStairs L${cur}->L${targetLevel} from (${x},${z}) -> ${JSON.stringify(r)}`);
      if (await waitCond(() => lvl(sdk) !== cur, 8000, 400)) break;
    }
  }
  return lvl(sdk) === targetLevel;
}

// Climb Juliet's house stairs at (3156,3435): bottom landing (3159,3435), top landing (3155,3435).
// Note: Juliet's front door at (3160,3440) is a diagonal door (shape 9), so use sdk.sendWalk across it.
export async function julietStairs(c: Ctx, targetLevel: 0 | 1): Promise<boolean> {
  const { bot, sdk } = c;
  if (targetLevel === 1) {
    if (lvl(sdk) === 0) {
      const p = sdk.getState()?.player;
      if (!p || p.worldX > 3161 || p.worldZ > 3439) {
        await bot.walkTo(3162, 3441, 2);
      }
      for (let i = 0; i < 4 && lvl(sdk) !== 1; i++) {
        const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3160, l.z - 3440) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
        if (d) { await bot.interactLoc(d, /^open$/i); await sleep(900); }
        await sdk.sendWalk(3159, 3435, true);
        await sleep(1600);
        await bot.interactLoc(/^staircase$/i, /climb-?up/i);
        await waitCond(() => lvl(sdk) === 1, 6000, 400);
      }
    }
    return lvl(sdk) === 1;
  }
  for (let i = 0; i < 4 && lvl(sdk) !== 0; i++) {
    const w = await bot.walkTo(3155, 3435, 1);
    if (!w?.success) { await openNearbyDoors(c, 3155, 3435, 2); await bot.walkTo(3155, 3435, 1); }
    await bot.interactLoc(/^staircase$/i, /climb-?down/i);
    await waitCond(() => lvl(sdk) === 0, 6000, 400);
  }
  for (let i = 0; i < 3; i++) {
    const p = sdk.getState()?.player;
    if (!p || p.level !== 0 || p.worldX < 3148 || p.worldX > 3164 || p.worldZ < 3426 || p.worldZ > 3440) break;
    await sdk.sendWalk(3160, 3439, true);
    await sleep(1200);
    const d = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3160, l.z - 3440) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
    if (d) { await bot.interactLoc(d, /^open$/i); await sleep(900); }
    await sdk.sendWalk(3163, 3441, true);
    await sleep(1400);
  }
  return lvl(sdk) === 0;
}

export async function exitWizardsTowerGround(c: Ctx) {
  const { bot, sdk } = c;
  // Also exit Witch's House if inside on L0 (2901..2907, 3466..3476)
  const pw = sdk.getState()?.player;
  if (pw && pw.level === 0 && pw.worldX >= 2901 && pw.worldX <= 2907 && pw.worldZ >= 3466 && pw.worldZ <= 3476) {
    await openNearbyDoors(c, 2902, 3468, 2);
    await sdk.sendWalk(2901, 3473, true);
    await sleep(1600);
    await openNearbyDoors(c, 2902, 3474, 2);
    await sdk.sendWalk(2901, 3473, true);
    await sleep(1200);
    const frontDoor = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2861);
    if (frontDoor) {
      await sdk.sendInteractLoc(frontDoor.x, frontDoor.z, frontDoor.id, 1);
      await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) <= 2900, 4000, 250);
    }
  }
  // Also exit Draynor Manor if inside (front door is one-way from outside; exit via east wing)
  const pm = sdk.getState()?.player;
  if (pm && pm.worldX >= 3090 && pm.worldX <= 3123 && pm.worldZ >= 3354 && pm.worldZ <= 3371) {
    while ((sdk.getState()?.player?.level ?? 0) > 0) {
      const down = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /staircase|ladder/i.test(l.name) && (l.options ?? []).some((o: string) => /climb-?down/i.test(o)));
      if (!down) break;
      await bot.interactLoc(down, /climb-?down/i);
      await sleep(1800);
    }
    await bot.walkTo(3119, 3356, 1);
    await openNearbyDoors(c, 3120, 3356, 2);
    await bot.walkTo(3122, 3360, 1);
    await openNearbyDoors(c, 3123, 3360, 2);
    await sdk.sendWalk(3126, 3360, true);
    await sleep(1800);
  }
  for (let i = 0; i < 4; i++) {
    const p = sdk.getState()?.player;
    if (!p || p.level !== 0 || p.worldX < 3102 || p.worldX > 3112 || p.worldZ < 3155 || p.worldZ > 3166) return;
    const d1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3107, l.z - 3162) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
    if (d1) { await bot.interactLoc(d1, /^open$/i); await sleep(900); }
    await sdk.sendWalk(3108, 3165, true);
    await sleep(1400);
    const d2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3109, l.z - 3166) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
    if (d2) { await bot.interactLoc(d2, /^open$/i); await sleep(900); }
    await sdk.sendWalk(3109, 3168, true);
    await sleep(1400);
  }
  const pa = sdk.getState()?.player;
  if (pa && pa.level === 0 && pa.worldX >= 3268 && pa.worldZ >= 3140 && pa.worldZ <= 3330) {
    await bot.walkTo(3268, 3227, 1);
    const gate = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 2882 || l.id === 2883 || /^gate$/i.test(l.name));
    if (gate) {
      await sdk.sendInteractLoc(gate.x, gate.z, gate.id, 1);
      if (await waitCond(() => !!sdk.getState()?.dialog?.isOpen || (sdk.getState()?.player?.worldX ?? 9999) < 3268, 4000, 200)) {
        if (sdk.getState()?.dialog?.isOpen) await chat(c, [/yes, ok/i], 15);
        await waitCond(() => (sdk.getState()?.player?.worldX ?? 9999) < 3268, 4000, 200);
      }
    }
  }
}

// Enter (down=true) or exit (down=false) the Wizards' Tower basement (cellar z > 9000).
export async function wizardsTowerBasement(c: Ctx, down: boolean): Promise<boolean> {
  const { bot, sdk } = c;
  const inCellar = () => (sdk.getState()?.player?.worldZ ?? 0) > 9000;
  if (down === inCellar()) return true;
  if (!down && inCellar()) {
    for (let i = 0; i < 4 && inCellar(); i++) {
      const w = await bot.walkTo(3104, 9576, 1);
      if (!w?.success) {
        await openNearbyDoors(c, 3108, 9570, 2);
        await bot.walkTo(3104, 9576, 1);
      }
      await bot.interactLoc(/ladder/i, /climb-?up/i);
      await waitCond(() => !inCellar(), 8000, 400);
    }
    if (!inCellar()) await exitWizardsTowerGround(c);
    return !inCellar();
  }
  if (lvl(sdk) > 0) await lumbridgeStairs(c, 0);
  await bot.walkTo(3109, 3168, 2);
  for (let i = 0; i < 4 && !inCellar(); i++) {
    const d2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3109, l.z - 3166) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
    if (d2) { await bot.interactLoc(d2, /^open$/i); await sleep(900); }
    await sdk.sendWalk(3108, 3164, true);
    await sleep(1400);
    const d1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3107, l.z - 3162) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
    if (d1) { await bot.interactLoc(d1, /^open$/i); await sleep(900); }
    await sdk.sendWalk(3105, 3162, true);
    await sleep(1400);
    const r = await bot.interactLoc(/ladder/i, /climb-?down/i);
    log(c, `wizardsTower climb-down -> ${JSON.stringify(r)}`);
    await waitCond(() => inCellar(), 8000, 400);
  }
  return inCellar();
}

export async function walkWaypoints(c: Ctx, pts: readonly (readonly [number, number])[], tol = 3): Promise<boolean> {
  const { bot, sdk } = c;
  await exitWizardsTowerGround(c);
  for (const [x, z] of pts) {
    for (let a = 0; a < 3; a++) {
      const r = await bot.walkTo(x, z, tol);
      const p = sdk.getState()?.player;
      if (p && Math.hypot(p.worldX - x, p.worldZ - z) <= tol + 3) break;
      if (!r?.success) {
        await openNearbyDoors(c, undefined, undefined, 2);
        await openNearbyDoors(c, x, z, 2);
      }
      await sleep(500);
    }
  }
  const [lx, lz] = pts[pts.length - 1];
  const p = sdk.getState()?.player;
  return !!p && Math.hypot(p.worldX - lx, p.worldZ - lz) <= tol + 4;
}

// Safe route from Lumbridge/Draynor to Varrock via the East Gate (avoids Dark Wizards at 3227,3369 and Draynor Manor).
export async function walkToVarrock(c: Ctx, destX = 3253, destZ = 3398): Promise<boolean> {
  const { sdk } = c;
  if (lvl(sdk) > 0) await lumbridgeStairs(c, 0);
  if ((sdk.getState()?.player?.worldZ ?? 0) > 9000) await wizardsTowerBasement(c, false);
  const p = sdk.getState()?.player;
  const wps: [number, number][] = [];
  if (p && p.worldZ >= 3470 && p.worldZ < 3510 && p.worldX >= 3195 && p.worldX <= 3230 && destZ < 3470) {
    wps.push([3212, 3465]);
  }
  if (!p || p.worldZ < 3380) {
    if (!p || p.worldZ < 3350 || p.worldX < 3250) {
      if (p && p.worldX < 3180) wps.push([3222, 3219]);
      wps.push([3260, 3260]);
    }
    wps.push([3285, 3365]);
    if (destZ >= 3380) wps.push([3273, 3428]);
  } else if (destZ < 3380) {
    wps.push([3273, 3428], [3285, 3365]);
  }
  wps.push([destX, destZ]);
  return walkWaypoints(c, wps, 2);
}

export async function walkFromVarrockToLumbridge(c: Ctx, destX = 3222, destZ = 3219): Promise<boolean> {
  const { sdk } = c;
  const p = sdk.getState()?.player;
  const wps: [number, number][] = [];
  if (p && p.worldZ >= 3470 && p.worldZ < 3510 && p.worldX >= 3195 && p.worldX <= 3230) {
    wps.push([3212, 3465]);
  }
  if (p && p.worldZ >= 3350 && p.worldZ < 9000) {
    wps.push([3273, 3428], [3285, 3365], [3260, 3260]);
  }
  wps.push([destX, destZ]);
  return walkWaypoints(c, wps, 2);
}

export async function pickupWithWait(c: Ctx, x: number, z: number, item: RegExp, waitSec = 25): Promise<boolean> {
  const { bot, sdk } = c;
  if (has(sdk, item)) return true;
  await bot.walkTo(x, z, 2);
  for (let i = 0; i < waitSec; i++) {
    const g = (sdk.getState()?.groundItems ?? []).find((it: any) => item.test(it.name));
    if (g) {
      const r = await bot.pickupItem(g);
      if (!r?.success) await openNearbyDoors(c, g.x, g.z, 2);
      if (await waitInv(sdk, item, 5000)) return true;
    }
    await sleep(1000);
  }
  return has(sdk, item);
}

// Everything we used to ask Josh to paste, written to one file.
export function snapshot(c: Ctx, quest: string, stepName: string, err?: any) {
  const { sdk } = c;
  const s = sdk.getState() ?? {};
  const slim = (l: any) => ({ n: l.name, x: l.x, z: l.z, id: l.id, o: l.options });
  const snap: any = {
    quest, step: stepName, time: new Date().toISOString(), error: err ? String(err?.stack ?? err) : undefined,
    player: s.player,
    skills: s.skills,
    inventory: (s.inventory ?? []).map((i: any) => `${i.name}${i.count > 1 ? ` x${i.count}` : ''}`),
    locs: (s.nearbyLocs ?? []).filter((l: any) => !/wheat/i.test(l.name)).slice(0, 60).map(slim),
    npcs: (s.nearbyNpcs ?? []).slice(0, 30).map((n: any) => ({ n: n.name, id: n.id, idx: n.index, x: n.x, z: n.z, o: n.options })),
    ground: s.groundItems,
    dialog: s.dialog,
    recentDialogs: s.recentDialogs,
    interface: s.interface,
    modalOpen: s.modalOpen,
    modalInterface: s.modalInterface,
    messages: (s.gameMessages ?? []).slice(-15),
    opFeedback: s.opFeedback,
  };
  try { snap.chat = sdk.getChat({ limit: 15 }); } catch (e) { snap.chat = String(e); }
  mkdirSync(`${c.dir}/failures`, { recursive: true });
  const f = `${c.dir}/failures/${quest.replace(/\W+/g, '-')}-${stepName.replace(/\W+/g, '-')}-${Date.now()}.json`;
  writeFileSync(f, JSON.stringify(snap, null, 1));
  console.log(`SNAPSHOT: ${f}`);
}

// Run one named step; on failure, snapshot and return false.
export async function step(c: Ctx, quest: string, name: string, fn: () => Promise<boolean>) {
  log(c, `STEP ${name}`);
  let ok = false, err: any;
  try { ok = await fn(); } catch (e) { err = e; }
  try { await c.bot.deactivateAllPrayers(); } catch {}
  if (!ok) { log(c, `STEP FAILED ${name}`); snapshot(c, quest, name, err); }
  return ok;
}

export async function rechargePrayer(c: Ctx, minPoints = 25): Promise<void> {
  const { bot, sdk } = c;
  const pr = sdk.getSkill('Prayer');
  if (!pr || (pr.level ?? 0) >= Math.min(minPoints, pr.baseLevel ?? 1)) return;
  const p = sdk.getState()?.player;
  const altars: [number, number][] = [
    [2606, 3209], // Ardougne Monastery
    [2615, 3304], // East Ardougne Church
    [2694, 3463], // Seers' Village Church
    [2925, 3483], // Taverley Druids' Circle
    [3243, 3207], // Lumbridge Church
    [2997, 3177], // Port Sarim Chapel
    [3254, 3483], // Varrock Church
  ];
  const best = p
    ? altars.slice().sort((a, b) => Math.hypot(a[0] - p.worldX, a[1] - p.worldZ) - Math.hypot(b[0] - p.worldX, b[1] - p.worldZ))[0]
    : altars[0];
  const w = await bot.walkTo(best[0], best[1], 2);
  if (!w?.success) {
    await openNearbyDoors(c, best[0], best[1], 3);
    await bot.walkTo(best[0], best[1], 2);
  }
  const altar = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => l.id === 409 || l.id === 410 || l.id === 411 || /^altar$/i.test(l.name));
  if (altar) {
    await sdk.sendInteractLoc(altar.x, altar.z, altar.id, 1);
    await waitCond(() => (sdk.getSkill('Prayer')?.level ?? 0) >= (sdk.getSkill('Prayer')?.baseLevel ?? 1), 5000, 250);
  }
}

export async function ensureCoins(c: Ctx, minCoins = 30): Promise<boolean> {
  const { bot, sdk } = c;
  const coinsNow = () => count(sdk, /^coins$/i);
  if (coinsNow() >= minCoins) return true;
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline && coinsNow() < minCoins) {
    const npc = (sdk.getState()?.nearbyNpcs ?? []).find((n: any) =>
      /^(man|woman|guard|knight of ardougne|farmer)$/i.test(n.name) &&
      (n.options ?? []).some((o: string) => /^pickpocket$/i.test(o))
    );
    if (npc) {
      const optIdx = (npc.options ?? []).findIndex((o: string) => /^pickpocket$/i.test(o));
      await sdk.sendInteractNpc(npc.index, optIdx >= 0 ? optIdx + 1 : 3);
      await sleep(1200);
    } else {
      await sleep(600);
    }
  }
  return coinsNow() >= minCoins;
}

export async function runQuests(dir: string, quests: any[]) {
  await runScript(async ({ bot, sdk }: any) => {
    if (!bot.attack && bot.attackNpc) bot.attack = bot.attackNpc.bind(bot);
    if (!bot.buyItem && bot.buyFromShop) bot.buyItem = bot.buyFromShop.bind(bot);
    if (!sdk.sendTakeGroundItem && sdk.sendPickup) sdk.sendTakeGroundItem = sdk.sendPickup.bind(sdk);
    if (!bot.useItemOp1) {
      bot.useItemOp1 = async (it: any) => {
        const item = typeof it === 'object' && it && 'slot' in it ? it : sdk.findInventoryItem(it);
        if (!item) return { success: false, message: 'Item not found' };
        return await sdk.sendUseItem(item.slot, 1);
      };
    }
    if (!bot.useItemOnItem) {
      bot.useItemOnItem = async (a: any, b: any) => {
        const ia = typeof a === 'object' && a && 'slot' in a ? a : sdk.findInventoryItem(a);
        const ib = typeof b === 'object' && b && 'slot' in b ? b : sdk.findInventoryItem(b);
        if (!ia || !ib) return { success: false, message: 'Item not found' };
        const beforeSig = JSON.stringify((sdk.getState()?.inventory ?? []).map((i: any) => [i.id, i.count]));
        const r = await sdk.sendUseItemOnItem(ia.slot, ib.slot);
        await sleep(600);
        const afterSig = JSON.stringify((sdk.getState()?.inventory ?? []).map((i: any) => [i.id, i.count]));
        if (afterSig === beforeSig && !sdk.getState()?.dialog?.isOpen) {
          const ia2 = typeof a === 'object' && a && 'slot' in a ? a : sdk.findInventoryItem(a);
          const ib2 = typeof b === 'object' && b && 'slot' in b ? b : sdk.findInventoryItem(b);
          if (ia2 && ib2) return await sdk.sendUseItemOnItem(ib2.slot, ia2.slot);
        }
        return r;
      };
    }
    const c: Ctx = { bot, sdk, dir, sleep };
    await bot.skipTutorial();
    if (sdk.getState()?.modalOpen || sdk.getState()?.interface?.isOpen) await bot.closeInterface();
    for (const q of quests) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        log(c, `START ${q.name} (attempt ${attempt})`);
        let ok = false;
        try {
          if (typeof q.run === 'function') {
            ok = await q.run(c);
          } else if (Array.isArray(q.steps)) {
            if (typeof q.isComplete === 'function' && q.isComplete(c)) {
              ok = true;
            } else {
              ok = true;
              for (const s of q.steps) {
                if (typeof s.isDone === 'function' && s.isDone(c)) continue;
                const stepOk = await step(c, q.name, s.name, () => s.run(c));
                if (!stepOk) { ok = false; break; }
              }
            }
          }
        } catch (e: any) { log(c, `ERROR ${q.name}: ${e?.message ?? e}`); snapshot(c, q.name, 'exception', e); }
        if (sdk.getState()?.modalOpen || sdk.getState()?.interface?.isOpen) await bot.closeInterface();
        if (ok) { log(c, `DONE ${q.name}`); break; }
        await bot.dismissBlockingUI();
      }
    }
  }, { timeout: 8 * 60 * 60_000 });
}

// Empty the inventory into the Draynor bank, keeping only items matching `keep`. Equipment stays on.
export async function bankJunk(c: Ctx, keep: RegExp = /^(coins|shears|wool|ball of wool)$/i) {
  const { bot, sdk } = c;
  const junk = () => (sdk.getState()?.inventory ?? []).filter((i: any) => !keep.test(i.name));
  if (junk().length === 0) return true;
  if (lvl(sdk) > 0) await lumbridgeStairs(c, 0);
  await exitWizardsTowerGround(c);
  const p = sdk.getState()?.player;
  if (p && p.worldZ > 3350 && p.worldZ < 9000 && p.worldX > 3130) {
    await walkFromVarrockToLumbridge(c, 3092, 3243);
  }
  await bot.walkTo(3092, 3243);
  for (let round = 0; round < 6 && junk().length > 0; round++) {
    if (!sdk.isBankOpen()) {
      const r = await bot.openBank();
      log(c, `openBank -> ${JSON.stringify(r)}`);
      if (!r?.success) { await sleep(1000); continue; }
      await sleep(600);
    }
    for (const it of junk()) {
      if (!sdk.isBankOpen()) break;
      await sdk.sendBankDeposit(it.slot, it.count ?? 1);
      await sleep(450);
    }
  }
  if (sdk.isBankOpen()) await bot.closeBank();
  const left = junk().map((i: any) => i.name);
  if (left.length) log(c, `bank: still holding ${left.join(', ')}`);
  return left.length === 0;
}

export async function withdrawFromDraynorBank(c: Ctx, patterns: RegExp[]) {
  const { bot, sdk } = c;
  const missing = () => patterns.filter(p => !has(sdk, p) && !(sdk.getState()?.equipment ?? []).some((e: any) => p.test(e.name)));
  if (missing().length === 0) return;
  if (lvl(sdk) > 0) await lumbridgeStairs(c, 0);
  await exitWizardsTowerGround(c);
  const p = sdk.getState()?.player;
  if (p && p.worldZ > 3350 && p.worldZ < 9000 && p.worldX > 3130) {
    await walkFromVarrockToLumbridge(c, 3092, 3243);
  }
  await bot.walkTo(3092, 3243, 2);
  for (let round = 0; round < 3 && missing().length > 0; round++) {
    if (!sdk.isBankOpen()) {
      const r = await bot.openBank();
      if (!r?.success) { await sleep(800); continue; }
      await sleep(600);
    }
    for (const pat of missing()) {
      const bi = sdk.findBankItem(pat);
      if (bi) {
        await sdk.sendBankWithdraw(bi.slot, bi.count ?? 1);
        await sleep(450);
      }
    }
    break;
  }
  if (sdk.isBankOpen()) await bot.closeBank();
}

export async function combineItems(c: Ctx, a: RegExp, b: RegExp, result: RegExp, waitMs = 3000): Promise<boolean> {
  const { sdk } = c;
  if (has(sdk, result)) return true;
  for (let i = 0; i < 3 && !has(sdk, result); i++) {
    const ia = sdk.findInventoryItem(a);
    const ib = sdk.findInventoryItem(b);
    if (!ia || !ib) return false;
    await sdk.sendUseItemOnItem(ia.slot, ib.slot);
    if (await waitInv(sdk, result, 1200)) return true;
    const ia2 = sdk.findInventoryItem(a);
    const ib2 = sdk.findInventoryItem(b);
    if (ia2 && ib2) await sdk.sendUseItemOnItem(ib2.slot, ia2.slot);
    if (await waitInv(sdk, result, waitMs)) return true;
  }
  return has(sdk, result);
}

// Enter (down=true) or exit (down=false) the Draynor Manor vampire crypt (z > 9700) via the east warehouse doors.
export async function draynorManorCrypt(c: Ctx, down: boolean): Promise<boolean> {
  const { bot, sdk } = c;
  const inCrypt = () => (sdk.getState()?.player?.worldZ ?? 0) > 9700;
  if (down === inCrypt()) return true;
  if (!down && inCrypt()) {
    for (let i = 0; i < 4 && inCrypt(); i++) {
      await bot.walkTo(3077, 9769, 2);
      await bot.interactLoc(/stairs/i, /walk-?up|climb-?up/i);
      await waitCond(() => !inCrypt(), 6000, 400);
    }
    // Exit SE room -> warehouse -> courtyard via (3119,3356) and (3123,3360)
    for (let i = 0; i < 3; i++) {
      const p = sdk.getState()?.player;
      if (!p || p.worldZ > 3360) break;
      await sdk.sendWalk(3119, 3356, true);
      await sleep(1200);
      const d1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3119, l.z - 3356) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
      if (d1) { await bot.interactLoc(d1, /^open$/i); await sleep(900); }
      await sdk.sendWalk(3123, 3359, true);
      await sleep(1400);
      const d2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3123, l.z - 3360) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
      if (d2) { await bot.interactLoc(d2, /^open$/i); await sleep(900); }
      await sdk.sendWalk(3123, 3362, true);
      await sleep(1400);
    }
    return !inCrypt();
  }
  await bot.walkTo(3123, 3361, 1);
  for (let i = 0; i < 4 && !inCrypt(); i++) {
    const d2 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3123, l.z - 3360) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
    if (d2) { await bot.interactLoc(d2, /^open$/i); await sleep(900); }
    await sdk.sendWalk(3120, 3356, true);
    await sleep(1400);
    const d1 = (sdk.getState()?.nearbyLocs ?? []).find((l: any) => /door/i.test(l.name) && Math.hypot(l.x - 3119, l.z - 3356) <= 2 && (l.options ?? []).some((o: string) => /^open$/i.test(o)));
    if (d1) { await bot.interactLoc(d1, /^open$/i); await sleep(900); }
    await sdk.sendWalk(3116, 3356, true);
    await sleep(1400);
    await bot.interactLoc(/stairs/i, /walk-?down|climb-?down/i);
    await waitCond(() => inCrypt(), 6000, 400);
  }
  return inCrypt();
}

export type QuestContext = Ctx;
export type QuestStep = { name: string; isDone?: (c: Ctx) => boolean; run: (c: Ctx) => Promise<boolean> };
export type QuestModule = {
  id: string;
  name: string;
  varpId?: number;
  completedValue?: number;
  isComplete?: (c: Ctx) => boolean;
  steps: QuestStep[];
};

export const getVarp = (c: Ctx, id: number): number => c.sdk.getVarp(id) ?? 0;
export const hasInv = (c: Ctx, re: RegExp): boolean => has(c.sdk, re);
export const findInv = (c: Ctx, re: RegExp): any => c.sdk.findInventoryItem(re);
export const advanceDialogs = (c: Ctx, want: RegExp[] = [], max = 60) => chat(c, want, max);

export async function walkTo(c: Ctx, x: number, z: number, tol = 2): Promise<boolean> {
  const r = await c.bot.walkTo(x, z, tol);
  if (!r?.success) {
    await openNearbyDoors(c, x, z, 3);
    await c.bot.walkTo(x, z, tol);
  }
  const p = c.sdk.getState()?.player;
  return !!p && Math.hypot(p.worldX - x, p.worldZ - z) <= tol + 4;
}

export async function eatIfLow(c: Ctx): Promise<void> {
  const hp = c.sdk.getSkill('Hitpoints');
  if (hp && hp.level < Math.max(10, Math.floor(hp.baseLevel * 0.55))) {
    const food = c.sdk.findInventoryItem(/lobster|salmon|trout|tuna|swordfish|shark|meat|chicken|bread|cake|pie|shrimps/i);
    if (food) await c.bot.eatFood(food);
  }
}

export async function ensureEquipped(c: Ctx, pattern: RegExp, _op = 'wield'): Promise<boolean> {
  if ((c.sdk.getState()?.equipment ?? []).some((e: any) => pattern.test(e.name))) return true;
  if (!has(c.sdk, pattern)) {
    await withdrawFromDraynorBank(c, [pattern]);
  }
  if (has(c.sdk, pattern)) {
    await c.bot.equipItem(pattern);
    await sleep(400);
  }
  return (c.sdk.getState()?.equipment ?? []).some((e: any) => pattern.test(e.name));
}

export async function ensureInInventory(c: Ctx, reqs: { pattern: RegExp; count: number }[], keepList: RegExp[] = []): Promise<boolean> {
  const missing = reqs.filter(r => count(c.sdk, r.pattern) < r.count);
  if (missing.length === 0) return true;
  if (keepList.length > 0) {
    const combined = new RegExp(keepList.map(r => r.source).join('|'), 'i');
    await bankJunk(c, combined);
  }
  await withdrawFromDraynorBank(c, missing.map(m => m.pattern));
  return reqs.every(r => count(c.sdk, r.pattern) >= r.count);
}

export async function interactNpcNear(c: Ctx, npcRe: RegExp, opRe: RegExp, x: number, z: number, _radius = 12): Promise<boolean> {
  await walkTo(c, x, z, 3);
  if (/talk/i.test(opRe.source)) {
    let r = await c.bot.talkTo(npcRe);
    if (!r?.success) {
      const target = c.sdk.findNearbyNpc(npcRe);
      await openNearbyDoors(c, target?.x ?? x, target?.z ?? z, 3);
      r = await c.bot.talkTo(npcRe);
    }
    return !!r?.success;
  }
  const target = c.sdk.findNearbyNpc(npcRe);
  if (!target) return false;
  const r = await c.bot.interactNpc(target, opRe);
  return !!r?.success;
}

export async function interactLocNear(c: Ctx, idOrRe: number | RegExp, opRe: RegExp, x: number, z: number, radius = 10): Promise<boolean> {
  await walkTo(c, x, z, 2);
  const locs = c.sdk.getState()?.nearbyLocs ?? [];
  const loc = locs
    .filter((l: any) => (typeof idOrRe === 'number' ? l.id === idOrRe : idOrRe.test(l.name)) && Math.hypot(l.x - x, l.z - z) <= radius)
    .sort((a: any, b: any) => a.distance - b.distance)[0];
  if (!loc) return false;
  let r = await c.bot.interactLoc(loc, opRe);
  if (!r?.success) {
    await openNearbyDoors(c, loc.x, loc.z, 3);
    r = await c.bot.interactLoc(loc, opRe);
  }
  return !!r?.success;
}

