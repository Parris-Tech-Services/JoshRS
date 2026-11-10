// Runs playtest scenarios against the dev world. Prints one PASS/FAIL line per step and exits 1 on any
// failure, so an agent can loop on it. See README.md.
//
//   cd ~/dev274/engine && npx tsx <joshrs>/tools/questops/playtest/run.ts <scenario.json>... [--dump]
import { readFileSync } from 'node:fs';
import { validateScenario } from './scenario.mjs';
import { boot } from './harness.ts';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dumpAll = process.argv.includes('--dump');
if (!files.length) { console.error('usage: run.ts <scenario.json>... [--dump]'); process.exit(2); }

const scenarios = files.map((f) => ({ f, s: JSON.parse(readFileSync(f, 'utf8')) }));
let bad = 0;
for (const { f, s } of scenarios) for (const e of validateScenario(s)) { console.log(`INVALID ${f}: ${e}`); bad++; }
if (bad) process.exit(2);

const h = await boot();
let failed = 0;

function dump() {
    const p = h.player;
    console.log(`    at ${p.x},${p.z},${p.level}; dialogue waiting: ${h.waiting()}`);
    for (const l of h.lines()) console.log(`    ${l.kind === 'mes' ? 'mes ' : `${h.comName(l.com!)}:`} ${l.text}`);
    if (h.waiting()) console.log(`    options: ${h.options().join(' | ') || '(continue)'}`);
}

for (const { f, s } of scenarios) {
    console.log(`\n# ${s.name} (${f})`);
    h.login();
    for (const [i, st] of s.steps.entries()) {
        const label = `${String(i + 1).padStart(2)} ${st.do} ${JSON.stringify({ ...st, do: undefined }).replace(/"do":undefined,?/, '')}`;
        try {
            switch (st.do) {
                case 'teleport': h.teleport(st.x, st.z, st.level ?? 0); break;
                case 'expectNpcNear': {
                    const p = h.player, r = st.radius ?? 3;
                    const near = h.npcsNear(st.x ?? p.x, st.z ?? p.z, st.level ?? p.level, r);
                    if (!near.some((n) => n.name === st.npc)) throw new Error(`not within ${r}; nearby: ${near.map((n) => `${n.name}@${n.x},${n.z}`).join(' ') || '(none)'}`);
                    break;
                }
                case 'talk': h.talk(st.npc, st.op ?? 1); break;
                case 'continue': for (let n = 0; n < (st.times ?? 1); n++) h.continueDialogue(); break;
                case 'continueAll': for (let n = 0; n < 50 && h.waiting() && h.player.resumeButtons.length <= 1; n++) h.continueDialogue(); break;
                case 'choose': h.choose(st.option); break;
                case 'expectDialogue': {
                    const want = st.text.toLowerCase();
                    if (!h.lines().some((l) => l.text.toLowerCase().includes(want))) throw new Error(`not seen; lines: ${h.lines().map((l) => l.text).join(' / ') || '(none)'}`);
                    break;
                }
                case 'setVar': h.setVar(st.varp, st.value); break;
                case 'expectVar': { const v = h.getVar(st.varp); if (v !== st.value) throw new Error(`expected ${st.value}, got ${v}`); break; }
                case 'expectPerm': if (!h.isPerm(st.varp)) throw new Error('varp is not scope=perm: Player.save() drops it, so it resets at logout'); break;
                case 'saveReload': console.log(`    save ${h.saveReload()} bytes, reloaded`); break;
                case 'ticks': h.tick(st.n); break;
                case 'dump': dump(); break;
            }
            console.log(`PASS ${label}`);
            if (dumpAll && st.do !== 'dump') dump();
        } catch (e) {
            failed++;
            console.log(`FAIL ${label}\n    ${(e as Error).message}`);
            dump();
            break; // later steps depend on this one
        }
    }
    h.World.removePlayer(h.player);
    h.World.logoutRequests.delete('playtest');
    h.tick();
}
console.log(`\n${failed ? `FAILED: ${failed} scenario(s)` : 'ALL PASSED'}`);
process.exit(failed ? 1 : 0);
