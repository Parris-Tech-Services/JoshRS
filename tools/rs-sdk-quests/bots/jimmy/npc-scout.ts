/**
 * Disposable RS-SDK walk-up NPC scout.
 * This is NOT a revision-377 verifier. Run with a disposable SDK bot on an isolated
 * RS-SDK sandbox only; never against a live family world or personal accounts.
 *
 * bun bots/jimmy/npc-scout.ts  (from rs-sdk engine root after copying this file)
 * A configured sandbox bot/SDK runner must already exist.
 */
import { runScript } from '../../sdk/runner';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

const DIR = new URL('./npc-scout-results/', import.meta.url).pathname;
const LIMIT = Math.max(1, Math.min(100, Number(process.env.NPC_SCOUT_LIMIT || 30)));
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const WAYS: [number, number][] = [
  [3222, 3218], [3209, 3214], [3231, 3225],
  [3232, 3295], [3253, 3270], [3260, 3260],
];
const seen = new Set<string>();
mkdirSync(DIR, { recursive: true });
const log = (row: Record<string, unknown>) =>
  appendFileSync(DIR + '/observations.jsonl', JSON.stringify({ at: new Date().toISOString(), engine: 'rs-sdk', ...row }) + '\n');

function key(n: any) { return [n.id ?? n.name, n.x, n.z].join(':'); }
function state(sdk: any) { return sdk.getState() ?? {}; }
function recent(s: any) { return (s.gameMessages ?? []).slice(-10).map((m: any) => String(m?.text ?? m)); }
function evidence(s: any) {
  return { player: s.player && { worldX: s.player.worldX, worldZ: s.player.worldZ, level: s.player.level },
    dialog: s.dialog, messages: recent(s), opFeedback: s.opFeedback };
}
function classify(before: any, after: any, result: any): string {
  const dialog = after.dialog?.isOpen;
  const messages = recent(after).join(' ');
  const oldMessages = recent(before).join(' ');
  if (dialog) return 'DIALOG_OBSERVED';
  if (/nothing interesting happens/i.test(messages) && messages !== oldMessages) return 'POSSIBLE_MISSING_HANDLER';
  if (!result?.success) return 'ACTION_FAILED';
  if (messages !== oldMessages) return 'MESSAGE_OBSERVED_REVIEW';
  return 'UNVERIFIED_NO_VISIBLE_RESPONSE';
}
await runScript(async ({ bot, sdk }: any) => {
  await bot.skipTutorial();
  let inspected = 0;
  for (const [x, z] of WAYS) {
    if (inspected >= LIMIT) break;
    const move = await bot.walkTo(x, z, 3);
    if (!move?.success) {
      log({ type: 'ROUTE_BLOCKED', x, z, result: move });
      continue;
    }
    await sleep(800);
    const targets = [...(state(sdk).nearbyNpcs ?? [])]
      .filter((n: any) => (n.options ?? []).some((o: string) => /talk-to/i.test(o)))
      .sort((a: any, b: any) =>
        Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z));
    for (const npc of targets) {
      if (inspected >= LIMIT) break;
      const id = key(npc);
      if (seen.has(id)) continue;
      seen.add(id);
      inspected++;
      const before = state(sdk);
      let result: any;
      try { result = await bot.talkTo(new RegExp('^' + String(npc.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')); }
      catch (e: any) { result = { success: false, reason: String(e?.message ?? e) }; }
      await sleep(950);
      const after = state(sdk);
      const status = classify(before, after, result);
      log({ type: 'NPC_PROBE', npc: { name: npc.name, id: npc.id, x: npc.x, z: npc.z },
        status, result, before: evidence(before), after: evidence(after) });
      // Never blindly click dialogue options: they may accept quests or spend items.
      if (after.dialog?.isOpen) {
        try { await bot.dismissBlockingUI(); } catch { /* recorded state remains authoritative */ }
      }
    }
  }
  writeFileSync(DIR + '/summary.json', JSON.stringify({
    engine: 'rs-sdk', inspected, statuses: 'Read observations.jsonl; no 377 status implied',
    note: 'Each possible failure needs manual reproduction, source comparison, patch and fresh account retest.'
  }, null, 2) + '\n');
}, { timeout: 15 * 60_000 });
