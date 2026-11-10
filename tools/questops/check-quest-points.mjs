#!/usr/bin/env node
// Two properties a quest needs to survive logout, checked statically:
//
// 1. Its stage varp is scope=perm. Player.save() writes only perm, non-zero varps.
// 2. It is counted by [proc,count_questpoints]. At login ~update_questpoints recomputes %qp from that
//    proc and overwrites the stored value, so a quest missing from it loses its quest points at the
//    next login even though its own completion script added them.
//
// A quest's stage varp is the one its scripts compare with its ^..._complete constant; the same pairs
// appear in count_questpoints for the quests it already counts.
//
// Usage: check-quest-points.mjs <content-dir> [--json]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { procBody, completeChecks, varpScopes, varbitBases } from './lib/rs-refs.mjs';

const content = process.argv[2];
if (!content) { console.error('usage: check-quest-points.mjs <content-dir> [--json]'); process.exit(2); }
const scripts = join(content, 'scripts');

function* walk(dir, ext) {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) yield* walk(p, ext);
        else if (e.name.endsWith(ext)) yield p;
    }
}

let counted = null;
const scopes = new Map();
for (const f of walk(scripts, '.rs2')) {
    const body = procBody(readFileSync(f, 'utf8'), 'count_questpoints');
    if (body) counted = new Set(completeChecks(body).map((c) => c.constant));
}
for (const f of walk(scripts, '.varp')) for (const [k, v] of varpScopes(readFileSync(f, 'utf8'))) if (!scopes.has(k) || v === 'perm') scopes.set(k, v);
const bases = new Map();
for (const f of walk(scripts, '.varbit')) for (const [k, v] of varbitBases(readFileSync(f, 'utf8'))) bases.set(k, v);
if (!counted) { console.error('BLOCKED: [proc,count_questpoints] not found'); process.exit(2); }

// Persistence of a stage var: a varp's own scope, or for a varbit the scope of its base varp.
function persistence(v) {
    if (scopes.has(v)) return scopes.get(v) === 'perm' ? null : `stage varp ${v} is not scope=perm (progress lost at logout)`;
    if (bases.has(v)) {
        const base = bases.get(v);
        if (!scopes.has(base)) return `stage varbit ${v} has base varp ${base} with no definition`;
        return scopes.get(base) === 'perm' ? null : `stage varbit ${v} sits in varp ${base}, which is not scope=perm (progress lost at logout)`;
    }
    return `stage var ${v} has no varp or varbit definition`;
}

// A quest can compare several sub-stage constants (^..._complete_read_scroll); it is counted if any one
// of its constants is in count_questpoints, and that counted pair names its real stage var.
const rows = [];
const qdir = join(scripts, 'quests');
for (const q of (existsSync(qdir) ? readdirSync(qdir) : []).filter((n) => statSync(join(qdir, n)).isDirectory()).sort()) {
    const pairs = new Map();
    for (const f of walk(join(qdir, q), '.rs2')) for (const c of completeChecks(readFileSync(f, 'utf8'))) pairs.set(c.constant, c.varp);
    if (!pairs.size) continue;
    const hit = [...pairs].find(([c]) => counted.has(c));
    const problems = [];
    let varp, constant;
    if (hit) {
        [constant, varp] = hit;
    } else {
        // Best guess for the report: the constant that is exactly <prefix>_complete.
        [constant, varp] = [...pairs].find(([c]) => /_complete$/.test(c)) ?? [...pairs][0];
        problems.push(`not counted by count_questpoints: add "if (%${varp} = ^${constant})" there, or its quest points vanish at the next login`);
    }
    const p = persistence(varp);
    if (p) problems.push(p);
    rows.push({ quest: q, varp, constant, counted: !!hit, problems });
}

const bad = rows.filter((r) => r.problems.length);
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else {
    console.log(`quests with a ^..._complete check: ${new Set(rows.map((r) => r.quest)).size}; counted constants: ${counted.size}`);
    for (const r of bad) console.log(`  ${r.quest}  %${r.varp} = ^${r.constant}\n    - ${r.problems.join('\n    - ')}`);
    console.log(bad.length ? `${bad.length} problem(s)` : 'no problems');
}
process.exitCode = bad.length ? 1 : 0;
