#!/usr/bin/env node
// One command for the static (no-server) checks of the quest self-check loop, with a summary table.
// Steps that need a source tree or a map manifest are skipped, with the reason, when it is absent.
//
//   selfcheck.mjs <dev274-content> [--source <377 content>] [--pristine <untouched 274 content>]
//
// Exit 0 only when no step failed. A skipped step is reported, never silently passed.
// For the server and client checks (build, run.ts, client-check) see docs/quests/SELF_CHECK_LOOP.md.
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const content = args.find((a, i) => !a.startsWith('--') && !['--source', '--pristine'].includes(args[i - 1]));
if (/[\\/]lc274([\\/]|$)/.test(content)) { console.error('refusing: lc274 is the live world'); process.exit(2); }
if (!content || !existsSync(join(content, 'scripts'))) { console.error('usage: selfcheck.mjs <dev274-content> [--source <377 content>] [--pristine <274 content>]'); process.exit(2); }
const source = opt('--source'), pristine = opt('--pristine');
const here = dirname(fileURLToPath(import.meta.url));
const tool = (f) => join(here, f);

const steps = [
    { name: 'prepack (references, duplicates, scripts)', run: [tool('prepack-check.mjs'), content, ...(source ? ['--source', source] : []), '--verify'] },
    { name: 'quest points + stage var persistence', run: [tool('check-quest-points.mjs'), content] },
    source && existsSync(join(content, 'imported-maps.txt'))
        ? { name: 'imported maps', run: [tool('check-map-integrity.mjs'), content, source] }
        : { name: 'imported maps', skip: source ? 'no imported-maps.txt (run record-imported-maps.mjs)' : 'no --source' },
];

const rows = [];
for (const s of steps) {
    if (s.skip) { rows.push({ name: s.name, status: 'SKIPPED', note: s.skip }); continue; }
    const r = spawnSync(process.execPath, s.run, { encoding: 'utf8' });
    const out = (r.stdout + r.stderr).trim();
    rows.push({ name: s.name, status: r.status === 0 ? 'PASS' : 'FAIL', note: r.status === 0 ? '' : out.split('\n').slice(0, 12).join('\n      ') });
}
for (const r of rows) console.log(`${r.status.padEnd(7)} ${r.name}${r.note ? `\n      ${r.note}` : ''}`);
const failed = rows.filter((r) => r.status === 'FAIL').length;
console.log(failed ? `\n${failed} step(s) failed. Details: run that tool directly (see docs/quests/SELF_CHECK_LOOP.md).` : `\nstatic checks passed${rows.some((r) => r.status === 'SKIPPED') ? ' (some steps skipped)' : ''}. Still needed: npm run build exits 0, run.ts, client-check.`);
process.exit(failed ? 1 : 0);
