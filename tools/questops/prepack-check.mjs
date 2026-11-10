#!/usr/bin/env node
// Predicts, in one pass and without running the packer, every reference error `npm run build` would
// stop on - and (with a source tree) says how each one can be fixed.
//
// Why: the packer reports ONE error per run. Fixing ported content that way costs one full rebuild per
// missing symbol. The rules below are the packer's own (Engine-TS tools/pack/config/*.ts at 274):
//   - every file under scripts/ is live, INCLUDING every scripts/_unpack/<revision>/ folder. They are
//     cumulative, not alternatives: defining a name twice anywhere is "Duplicate config found".
//   - a config key resolves through a registry: npc model*/head* -> model, readyanim/walkanim -> seq,
//     loc model* -> model (bare or with a shape suffix), loc anim -> seq, seq frame*/iframe* -> anim,
//     obj model/manwear/... -> model, inv stock* -> obj, varbit basevar -> varp, dbrow data -> typed by
//     the dbtable column, enum val -> typed by input/output type, param -> typed by the param.
//
// Fix classes (need --source <377 content>):
//   import-text    the definition exists in the source as text; its own references are satisfiable
//   drop-property  a seq whose animation frames 274 lacks: comment the property out (cosmetic)
//   copy-model     the source has models/**/<name>.ob2: copy it locally (--copy-models). Never commit.
//   alias          the source id already exists in 274 under another name (a rename, not a gap):
//                  the reference is rewritten to the 274 name
//   blocked        nothing above applies; the quest that needs it should be parked
//
// Usage:
//   prepack-check.mjs <target-content> [--source <377-content>] [--json] [--verify]
//   prepack-check.mjs <target-content> --source <377-content> --apply [--copy-models] [--log file.md]
//                     [--pristine <untouched 274 content>]   also removes duplicate definitions, keeping
//                                                            the copy the pristine tree has
// Exit: 0 clean, 1 problems found (or problems left after --apply), 2 usage.
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, appendFileSync, copyFileSync, statSync } from 'node:fs';
import { join, basename, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONFIG_KINDS = ['npc', 'loc', 'obj', 'seq', 'spotanim', 'inv', 'idk', 'varp', 'varbit', 'varn', 'vars', 'enum', 'struct', 'param', 'dbtable', 'dbrow', 'hunt', 'mesanim'];
// Kinds whose ids are sent to the client: the packer wants an explicit pack id for each (build.verify).
export const TRANSMITTED = new Set(['idk', 'loc', 'npc', 'obj', 'seq', 'spotanim', 'varp', 'varbit']);
const LOC_SHAPES = ['_1', '_2', '_3', '_4', '_q', '_5', '_w', '_r', '_e', '_t', '_8', '_9', '_0', '_a', '_s', '_d', '_f', '_g', '_h', '_z', '_x', '_c', '_v'];
// ScriptVarType names (as written in configs) that name another registry.
const TYPE_KIND = { namedobj: 'obj', obj: 'obj', loc: 'loc', npc: 'npc', seq: 'seq', spotanim: 'spotanim', inv: 'inv', enum: 'enum', struct: 'struct', synth: 'synth', dbrow: 'dbrow', varp: 'varp', midi: 'midi', component: 'interface', interface: 'interface' };
const SKIP = new Set(['', 'null', 'hide']);

function* walk(dir, exts) {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) yield* walk(p, exts);
        else { const dot = e.name.lastIndexOf('.'); if (dot >= 0 && exts.has(e.name.slice(dot + 1))) yield p; }
    }
}

function loadPackFile(file) {
    const byName = new Map(), byId = new Map();
    if (existsSync(file)) {
        for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
            const eq = line.indexOf('=');
            if (eq < 1 || !/^\d+$/.test(line.slice(0, eq))) continue;
            const id = Number(line.slice(0, eq)), name = line.slice(eq + 1).trim();
            byName.set(name, id); byId.set(id, name);
        }
    }
    return { byName, byId };
}

/** Parse one config file into definitions with line numbers. */
export function parseConfigFile(text) {
    const out = [];
    let cur = null;
    const lines = text.split(/\r?\n/);
    lines.forEach((raw, i) => {
        const line = raw.trim();
        if (!line || line.startsWith('//')) return;
        if (line.startsWith('[') && line.endsWith(']')) { cur = { name: line.slice(1, -1), line: i + 1, end: lines.length, props: [] }; if (out.length) out[out.length - 1].end = i; out.push(cur); return; }
        const eq = line.indexOf('=');
        if (cur && eq > 0) cur.props.push({ key: line.slice(0, eq), value: line.slice(eq + 1).trim(), line: i + 1 });
    });
    return out;
}

/** Everything the packer would see in a content tree. */
export function loadContent(root) {
    const defs = Object.fromEntries(CONFIG_KINDS.map((k) => [k, new Map()]));
    const duplicates = [];
    const exts = new Set(CONFIG_KINDS);
    for (const file of walk(join(root, 'scripts'), exts)) {
        const kind = file.slice(file.lastIndexOf('.') + 1);
        for (const d of parseConfigFile(readFileSync(file, 'utf8'))) {
            const prev = defs[kind].get(d.name);
            if (prev) duplicates.push({ kind, name: d.name, first: `${relative(root, prev.file)}:${prev.line}`, second: `${relative(root, file)}:${d.line}`, occurrences: [{ file: prev.file, line: prev.line, end: prev.end }, { file, line: d.line, end: d.end }] });
            else defs[kind].set(d.name, { ...d, file });
        }
    }
    const packs = {};
    for (const k of [...CONFIG_KINDS, 'model', 'anim', 'synth', 'midi', 'interface', 'texture']) packs[k] = loadPackFile(join(root, 'pack', k + '.pack'));
    return { root, defs, duplicates, packs };
}

/** Does a (kind, name) resolve in this content the way the packer would resolve it? */
export function resolves(c, kind, name) {
    if (SKIP.has(name)) return true;
    if (kind === 'locmodel') return c.packs.model.byName.has(name) || LOC_SHAPES.some((s) => c.packs.model.byName.has(name + s));
    if (kind in c.defs) return c.defs[kind].has(name) || (kind === 'obj' && name.startsWith('cert_') && c.defs.obj.has(name.slice(5)));
    return c.packs[kind]?.byName.has(name) ?? true;
}

const typed = (type, value) => (TYPE_KIND[type] && !SKIP.has(value) ? [{ kind: TYPE_KIND[type], name: value }] : []);

/** References made by one definition: [{ key, line, kind, name }]. `c` supplies param/dbtable types. */
export function refsOf(kind, def, c, typeSource = c) {
    const out = [];
    const add = (p, k, name) => { if (!SKIP.has(name)) out.push({ key: p.key, line: p.line, kind: k, name }); };
    const paramType = (n) => (c.defs.param.get(n) ?? typeSource.defs.param.get(n))?.props.find((p) => p.key === 'type')?.value;
    const enumIn = def.props.find((p) => p.key === 'inputtype')?.value, enumOut = def.props.find((p) => p.key === 'outputtype')?.value;
    const tableName = def.props.find((p) => p.key === 'table')?.value;
    const table = tableName && (c.defs.dbtable.get(tableName) ?? typeSource.defs.dbtable.get(tableName));
    for (const p of def.props) {
        const k = p.key, v = p.value, first = v.split(',')[0].trim();
        if (k === 'param' && ['npc', 'loc', 'obj', 'struct'].includes(kind)) {
            const name = v.slice(0, v.indexOf(','));
            if (!resolves(c, 'param', name)) add(p, 'param', name);
            for (const r of typed(paramType(name), v.slice(v.indexOf(',') + 1).trim())) add(p, r.kind, r.name);
        } else if (kind === 'npc') {
            if (/^(model|head)\d*$/.test(k)) add(p, 'model', v);
            else if (k === 'readyanim') add(p, 'seq', v);
            else if (k === 'walkanim') for (const s of v.split(',')) add(p, 'seq', s.trim());
            else if (k === 'huntmode') add(p, 'hunt', v);
        } else if (kind === 'loc') {
            if (/^model\d*$/.test(k)) add(p, 'locmodel', v);
            else if (k === 'anim') add(p, 'seq', v);
        } else if (kind === 'obj') {
            if (/^(model|(man|woman)(wear|head)[23]?)$/.test(k)) add(p, 'model', first);
            else if (k === 'certlink' || k === 'certtemplate') add(p, 'obj', v);
            else if (k === 'code10') add(p, 'seq', v);
            else if (/^count\d+$/.test(k)) add(p, 'obj', first);
        } else if (kind === 'seq') {
            if (/^i?frame\d+$/.test(k)) add(p, 'anim', v);
            else if (/^replaceheld(left|right)$/.test(k)) add(p, 'obj', v);
        } else if (kind === 'spotanim') {
            if (k === 'model') add(p, 'model', v);
            else if (k === 'anim') add(p, 'seq', v);
        } else if (kind === 'inv') {
            if (/^stock\d+$/.test(k)) add(p, 'obj', first);
        } else if (kind === 'idk') {
            if (/^(model|head)\d*$/.test(k)) add(p, 'model', v);
        } else if (kind === 'varbit') {
            if (k === 'basevar') add(p, 'varp', v);
        } else if (kind === 'mesanim') {
            if (/^len\d+$/.test(k)) add(p, 'seq', v);
        } else if (kind === 'param') {
            if (k === 'default') for (const r of typed(def.props.find((x) => x.key === 'type')?.value, v)) add(p, r.kind, r.name);
        } else if (kind === 'enum') {
            if (k === 'val') { const i = v.indexOf(','); for (const r of [...typed(enumIn, v.slice(0, i).trim()), ...typed(enumOut, v.slice(i + 1).trim())]) add(p, r.kind, r.name); }
            else if (k === 'default') for (const r of typed(enumOut, v)) add(p, r.kind, r.name);
        } else if (kind === 'dbrow') {
            if (k === 'table') add(p, 'dbtable', v);
            else if (k === 'data' && table) {
                const [col, ...vals] = v.split(',').map((s) => s.trim());
                const column = table.props.find((x) => x.key === 'column' && x.value.split(',')[0].trim() === col);
                const types = column ? column.value.split(',').slice(1).map((s) => s.trim()).filter((t) => t !== t.toUpperCase()) : [];
                // A LIST column repeats its type tuple, so index values modulo the tuple length.
                vals.forEach((val, i) => { if (types.length) for (const r of typed(types[i % types.length], val)) add(p, r.kind, r.name); });
            }
        } else if (kind === 'hunt') {
            const m = { check_npc: 'npc', check_obj: 'obj', check_loc: 'loc' }[k];
            if (m) add(p, m, v);
            else if (/^check_inv/.test(k)) add(p, 'inv', first);
        }
    }
    return out;
}

/** Symbols named in scripts that only the source defines (heuristic: tokens, minus strings/comments). */
function scriptRefs(target, source) {
    const out = [];
    const kinds = ['npc', 'loc', 'obj', 'seq', 'spotanim', 'inv', 'enum', 'struct', 'param', 'dbrow', 'dbtable', 'varp', 'varbit', 'varn', 'vars'];
    // A name the target already knows in ANY registry (a 274 synth called like a 377 seq, a varp that
    // 377 turned into a varbit...) is how stock scripts use it, so it is never a porting gap.
    const known = new Set();
    for (const k of CONFIG_KINDS) for (const n of target.defs[k].keys()) known.add(n);
    for (const p of Object.values(target.packs)) for (const n of p.byName.keys()) known.add(n);
    // Script names ([proc,x], [queue,x], [label,x]...) are referenced bare too: queue(x, ...).
    const files = [...walk(join(target.root, 'scripts'), new Set(['rs2']))].map((file) => ({ file, lines: readFileSync(file, 'utf8').split(/\r?\n/) }));
    const HEADER = /^\[([a-z0-9_]+),([^\]]+)\]/;
    // Interaction triggers name a config ([opnpc1,sigmund]); every other trigger names a script.
    const triggerKind = (t) => (/^(ai_|(op|ap)npc)/.test(t) ? 'npc' : /^(op|ap)loc/.test(t) ? 'loc' : /^(op|ap)(obj|held)/.test(t) ? 'obj' : null);
    for (const { file, lines } of files) lines.forEach((l, i) => {
        const h = l.match(HEADER);
        if (!h) return;
        const kind = triggerKind(h[1]), subject = h[2].trim();
        if (!kind) known.add(subject);
        else if (!subject.startsWith('_') && !resolves(target, kind, subject) && source.defs[kind].has(subject)) out.push({ file, line: i + 1, key: `[${h[1]}]`, kind, name: subject, from: { kind: 'script', name: basename(file) } });
    });
    const only = new Map();
    for (const k of kinds) for (const n of source.defs[k].keys()) if (!known.has(n) && !resolves(target, k, n)) { if (!only.has(n)) only.set(n, []); only.get(n).push(k); }
    if (!only.size) return out;
    const VAR_KINDS = new Set(['varp', 'varbit', 'varn', 'vars']);
    for (const { file, lines } of files) {
        const seen = new Set();
        lines.forEach((raw, i) => {
            // A header's subject is a config only for interaction triggers; that case is covered by the
            // handler audit and by `known` above (the subject is in `known`, so it is skipped here).
            if (HEADER.test(raw)) return;
            const line = raw.replace(/\/\/.*$/, '').replace(/"(?:[^"\\]|\\.)*"/g, '""');
            for (const m of line.matchAll(/([%$^~@]?)([a-z0-9_+]+)/gi)) {
                const [, sigil, tok] = m;
                const ks = only.get(tok);
                if (!ks || seen.has(tok + '@' + i)) continue;
                // %name is a player/npc/shared variable; other sigils are locals, constants, procs, labels.
                const use = sigil === '%' ? ks.filter((k) => VAR_KINDS.has(k)) : sigil ? [] : ks.filter((k) => !VAR_KINDS.has(k));
                if (!use.length) continue;
                seen.add(tok + '@' + i);
                for (const k of use) out.push({ file, line: i + 1, key: 'script', kind: k, name: tok, from: { kind: 'script', name: basename(file) } });
            }
        });
    }
    return out;
}

/** `^name = value` constants under scripts/. */
function loadConstants(root) {
    const out = new Map();
    for (const file of walk(join(root, 'scripts'), new Set(['constant']))) {
        readFileSync(file, 'utf8').split(/\r?\n/).forEach((l, i) => { const m = l.match(/^\^([a-z0-9_]+)\s*=\s*(.*)$/i); if (m && !out.has(m[1])) out.set(m[1], { value: m[2].trim(), file, line: i + 1 }); });
    }
    return out;
}

const commandsOf = (root) => { const f = join(root, 'scripts/engine.rs2'); const m = new Map(); if (existsSync(f)) for (const l of readFileSync(f, 'utf8').split(/\r?\n/)) { const h = l.match(/^\[command,([a-z0-9_]+)\]/); if (h) m.set(h[1], l); } return m; };

/**
 * Compile-time script problems that are not config references: engine commands the target lacks,
 * procs/labels that were not ported, and undefined constants. Returns [{ file, line, type, name, fix, why }].
 */
export function scriptIssues(target, source = null) {
    const out = [];
    const procs = new Set(), labels = new Set();
    const files = [...walk(join(target.root, 'scripts'), new Set(['rs2']))].filter((f) => basename(f) !== 'engine.rs2' || dirname(f) !== join(target.root, 'scripts')).map((file) => ({ file, lines: readFileSync(file, 'utf8').split(/\r?\n/) }));
    for (const { lines } of files) for (const l of lines) { const h = l.match(/^\[(proc|label),([^\]]+)\]/); if (h) (h[1] === 'proc' ? procs : labels).add(h[2].trim()); }
    const srcDefs = new Map();
    if (source) for (const file of walk(join(source.root, 'scripts'), new Set(['rs2']))) readFileSync(file, 'utf8').split(/\r?\n/).forEach((l, i) => { const h = l.match(/^\[(proc|label),([^\]]+)\]/); if (h) srcDefs.set(h[1] + ':' + h[2].trim(), `${relative(source.root, file)}:${i + 1}`); });
    const constants = loadConstants(target.root), srcConstants = source ? loadConstants(source.root) : new Map();
    const cmds = commandsOf(target.root), srcCmds = source ? commandsOf(source.root) : new Map();
    const newCmds = new Map([...srcCmds].filter(([n]) => !cmds.has(n)));
    // If the engine sits beside the content, see whether it implements a command the content lacks.
    const opFile = join(target.root, '..', 'engine/src/engine/script/ScriptOpcode.ts');
    const ops = existsSync(opFile) ? new Set([...readFileSync(opFile, 'utf8').matchAll(/^\s+([A-Z0-9_]+),?\s*(?:\/\/.*)?$/gm)].map((m) => m[1].toLowerCase())) : null;
    const strip = (raw) => raw.replace(/\/\/.*$/, '').replace(/"(?:[^"\\]|\\.)*"/g, '""');
    const constantUse = (file, raw, i) => {
        for (const m of strip(raw).matchAll(/\^([a-z0-9_]+)/gi)) {
            if (constants.has(m[1])) continue;
            const src = srcConstants.get(m[1]);
            out.push({ file, line: i + 1, type: 'constant', name: m[1], fix: src ? 'import-constant' : 'blocked', why: src ? `source: ^${m[1]} = ${src.value}` : 'defined in neither tree', src });
        }
    };
    for (const { file, lines } of files) lines.forEach((raw, i) => {
        if (/^\[/.test(raw)) return;
        const line = strip(raw);
        for (const m of line.matchAll(/([~@])([a-z0-9_]+)/gi)) {
            const type = m[1] === '~' ? 'proc' : 'label';
            if ((type === 'proc' ? procs : labels).has(m[2])) continue;
            const src = srcDefs.get(type + ':' + m[2]);
            out.push({ file, line: i + 1, type, name: m[2], fix: src ? 'port-script' : 'blocked', why: src ? `defined in source at ${src}` : 'defined in neither tree' });
        }
        if (newCmds.size) for (const m of line.matchAll(/(?<![%$^~@a-z0-9_])([a-z][a-z0-9_]*)/g)) {
            if (!newCmds.has(m[1])) continue;
            const engineHas = ops ? ops.has(m[1]) : null;
            out.push({ file, line: i + 1, type: 'command', name: m[1], fix: engineHas ? 'add-signature' : 'blocked',
                why: engineHas ? `the engine implements it; add this line to scripts/engine.rs2: ${newCmds.get(m[1])}` : engineHas === false ? 'the 274 engine has no such opcode: the quest needs engine work or a rewrite' : 'not in the target engine.rs2 (engine source not found beside the content to check its opcodes)' });
        }
        constantUse(file, raw, i);
    });
    for (const file of walk(join(target.root, 'scripts'), new Set(CONFIG_KINDS))) readFileSync(file, 'utf8').split(/\r?\n/).forEach((raw, i) => constantUse(file, raw, i));
    return out;
}

let modelFileCache = new Map();
function modelFiles(root) {
    if (!modelFileCache.has(root)) { const m = new Map(); for (const f of walk(join(root, 'models'), new Set(['ob2']))) m.set(basename(f, '.ob2'), f); modelFileCache.set(root, m); }
    return modelFileCache.get(root);
}

/**
 * Check a target tree. Returns { duplicates, broken, packIssues, plan }.
 * broken: every unresolved reference with a fix class. plan: what --apply would do.
 */
export function check(target, source = null, { copyModels = false } = {}) {
    const broken = [];
    for (const kind of CONFIG_KINDS) {
        for (const def of target.defs[kind].values()) {
            for (const r of refsOf(kind, def, target, source ?? target)) {
                if (!resolves(target, r.kind, r.name)) broken.push({ ...r, file: def.file, from: { kind, name: def.name } });
            }
        }
    }
    if (source) broken.push(...scriptRefs(target, source));

    // How can each missing symbol be satisfied from the source?
    const plan = { imports: new Map(), drops: [], models: new Map(), rewrites: [], packIds: [], constants: new Map() };
    // Names differ between revisions for the SAME asset (377 `idk_woman_hair_bun` is model 378, which
    // 274 calls `woman_head_bun`). Ids are the original cache ids, so "source id is taken in the target
    // under another name" means renamed, not missing: point the reference at the target's name.
    function alias(kind, name) {
        if (kind === 'locmodel') {
            const hits = ['', ...LOC_SHAPES].map((sfx) => [sfx, source.packs.model.byName.get(name + sfx)]).filter(([, id]) => id !== undefined);
            if (!hits.length) return null;
            const bases = new Set();
            for (const [sfx, id] of hits) { const tn = target.packs.model.byId.get(id); if (tn === undefined) return null; bases.add(sfx && tn.endsWith(sfx) ? tn.slice(0, -sfx.length) : sfx ? null : tn); }
            const [base] = bases;
            return bases.size === 1 && base && base !== name && resolves(target, 'locmodel', base) ? base : null;
        }
        const id = source.packs[kind]?.byName.get(name);
        const tn = id === undefined ? undefined : target.packs[kind]?.byId.get(id);
        return tn !== undefined && tn !== name && resolves(target, kind, tn) ? tn : null;
    }
    const memo = new Map();
    const srcModels = source ? modelFiles(source.root) : new Map();
    function satisfy(kind, name, stack = []) {
        const key = kind + ':' + name;
        if (memo.has(key)) return memo.get(key);
        if (resolves(target, kind, name)) return { ok: true };
        if (!source) return { ok: false, fix: 'blocked', why: 'not defined in the target (no --source to look in)' };
        if (stack.includes(key)) return { ok: true };                                    // cycle: being imported
        let res;
        const to = alias(kind, name);
        if (to) res = { ok: true, fix: 'alias', to };
        else if (kind === 'model' || kind === 'locmodel') {
            const names = kind === 'model' ? [name] : [name, ...LOC_SHAPES.map((s) => name + s)];
            const found = names.filter((n) => srcModels.has(n));
            if (!found.length) res = { ok: false, fix: 'blocked', why: `model ${name} has no .ob2 in the source` };
            else if (!copyModels) res = { ok: false, fix: 'copy-model', why: `model ${name}: source has ${found.length} .ob2 file(s); rerun with --copy-models` };
            else { for (const n of found) plan.models.set(n, srcModels.get(n)); res = { ok: true, fix: 'copy-model' }; }
        } else if (kind === 'anim') {
            res = { ok: false, fix: 'drop-property', why: `animation frame ${name} is not in the 274 anim.pack` };
        } else if (kind in source.defs && source.defs[kind].has(name)) {
            const def = source.defs[kind].get(name);
            const dropLines = [], rewriteLines = [];
            res = { ok: true, fix: 'import-text' };
            for (const r of refsOf(kind, def, source)) {
                const s = satisfy(r.kind, r.name, [...stack, key]);
                if (s.ok) { if (s.fix === 'alias') rewriteLines.push({ line: r.line, from: r.name, to: s.to }); continue; }
                if (kind === 'seq' && r.kind === 'anim') { res = { ok: false, fix: 'drop-property', why: `seq ${name} needs frame ${r.name}, which 274 lacks` }; break; }
                // A missing animation is cosmetic: import the definition without that property.
                if (s.fix === 'drop-property' && r.kind === 'seq') { dropLines.push({ line: r.line, key: r.key, why: s.why }); continue; }
                res = { ok: false, fix: s.fix === 'copy-model' ? 'copy-model' : 'blocked', why: `${kind} ${name} -> ${s.why}` }; break;
            }
            if (res.ok) plan.imports.set(key, { kind, name, def, dropLines, rewriteLines, sourceId: source.packs[kind]?.byName.get(name) });
        } else {
            res = { ok: false, fix: 'blocked', why: `${kind} ${name} is defined in neither tree` };
        }
        memo.set(key, res);
        return res;
    }
    for (const b of broken) {
        const s = satisfy(b.kind, b.name);
        b.fix = s.fix;
        b.fixable = s.ok;
        b.why = s.why ?? (s.fix === 'alias' ? `274 calls it ${s.to}` : '');
        if (s.fix === 'alias') plan.rewrites.push({ file: b.file, line: b.line, from: b.name, to: s.to, on: `${b.from.kind} ${b.from.name}` });
        // A broken animation reference inside an existing target config is dropped in place.
        if (!s.ok && s.fix === 'drop-property' && (b.kind === 'seq' || b.kind === 'anim')) {
            b.fixable = true;
            // In a config the property is commented out; in a script the animation becomes `null`.
            if (b.from.kind === 'script') plan.rewrites.push({ file: b.file, line: b.line, from: b.name, to: 'null', on: b.from.name, cosmetic: b.why });
            else plan.drops.push(b);
        }
    }

    // Pack ids. With build.verify the packer refuses a transmitted config without an id line and an id
    // line without a config; without it, missing ids are auto-assigned (and will not match map ids).
    const packIssues = [];
    for (const kind of TRANSMITTED) {
        for (const name of target.defs[kind].keys()) if (!target.packs[kind].byName.has(name)) { packIssues.push({ kind, name, issue: 'config has no pack id line' }); if (source) plan.packIds.push({ kind, name, sourceId: source.packs[kind].byName.get(name) }); }
        for (const name of target.packs[kind].byName.keys()) if (!target.defs[kind].has(name) && !name.startsWith('cert_')) packIssues.push({ kind, name, issue: 'pack id line has no config' });
    }
    const scripts = scriptIssues(target, source);
    plan.constants = new Map(scripts.filter((x) => x.fix === 'import-constant').map((x) => [x.name, x.src]));
    return { duplicates: target.duplicates, broken, packIssues, scripts, plan };
}

const questOf = (file) => file.match(/[\\/]scripts[\\/]quests[\\/]([^\\/]+)/)?.[1] ?? null;

function appendGuarded(file, text) {
    mkdirSync(dirname(file), { recursive: true });
    const needsNl = existsSync(file) && statSync(file).size > 0 && !readFileSync(file, 'utf8').endsWith('\n');
    appendFileSync(file, (needsNl ? '\n' : '') + text);
}

/**
 * Remove duplicate definitions, keeping the one a pristine tree has in the same file. A porting tool
 * that only read _unpack/274 re-added names that already live in _unpack/225..254; the copy that is
 * not in the pristine content is the added one. Pairs where neither or both match are left alone.
 */
export function dedupe(target, pristine) {
    const log = [], byFile = new Map();
    for (const d of target.duplicates) {
        const orig = pristine.defs[d.kind].get(d.name);
        const origRel = orig && relative(pristine.root, orig.file);
        const isOrig = d.occurrences.map((o) => relative(target.root, o.file) === origRel);
        if (isOrig[0] === isOrig[1]) { log.push(`KEPT_BOTH ${d.kind} [${d.name}] ${d.first} / ${d.second}: ${orig ? 'both or neither match' : 'not in'} the pristine tree - decide by hand`); continue; }
        const drop = d.occurrences[isOrig[0] ? 1 : 0];
        if (!byFile.has(drop.file)) byFile.set(drop.file, []);
        byFile.get(drop.file).push(drop);
        log.push(`DEDUPED ${d.kind} [${d.name}]: removed ${relative(target.root, drop.file)}:${drop.line}, kept the pristine definition in ${origRel}`);
    }
    for (const [file, drops] of byFile) {
        const text = readFileSync(file, 'utf8').split('\n');
        for (const d of drops) for (let i = d.line - 1; i < d.end && i < text.length; i++) if (text[i].trim() && !text[i].trim().startsWith('//')) text[i] = `// duplicate removed: ${text[i]}`;
        writeFileSync(file, text.join('\n'));
    }
    return log;
}

/** Apply the plan to the target tree. Returns log lines. */
export function applyPlan(target, source, plan) {
    const log = [];
    // 1. Comment out cosmetic animation properties in existing target configs.
    const byFile = new Map();
    for (const d of plan.drops) { if (!byFile.has(d.file)) byFile.set(d.file, new Map()); byFile.get(d.file).set(d.line, d); }
    for (const [file, lines] of byFile) {
        const text = readFileSync(file, 'utf8').split('\n');
        for (const [n, d] of lines) {
            if (text[n - 1].trim().startsWith('//')) continue;
            log.push(`DROPPED ${relative(target.root, file)}:${n} \`${text[n - 1].trim()}\` on ${d.from.kind} ${d.from.name} - ${d.why}`);
            text[n - 1] = `// dropped (no 274 animation): ${text[n - 1].trim()}`;
        }
        writeFileSync(file, text.join('\n'));
    }
    // 1b. Point renamed references at the name 274 uses.
    const tokenRe = (name) => new RegExp(`(?<![a-z0-9_+])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9_+])`, 'g');
    const rwByFile = new Map();
    for (const r of plan.rewrites) { if (!rwByFile.has(r.file)) rwByFile.set(r.file, []); rwByFile.get(r.file).push(r); }
    for (const [file, list] of rwByFile) {
        const text = readFileSync(file, 'utf8').split('\n');
        for (const r of list) {
            const next = text[r.line - 1].replace(tokenRe(r.from), r.to);
            if (next !== text[r.line - 1]) { text[r.line - 1] = next; log.push(r.cosmetic ? `NULLED ${relative(target.root, file)}:${r.line} animation ${r.from} -> null - ${r.cosmetic}` : `ALIASED ${relative(target.root, file)}:${r.line} ${r.from} -> ${r.to} (same id, 274 name)`); }
        }
        writeFileSync(file, text.join('\n'));
    }
    // 2. Import text definitions. Order does not matter: the packer reads every file before resolving.
    const used = Object.fromEntries([...TRANSMITTED].map((k) => [k, new Set(target.packs[k].byId.keys())]));
    const register = (kind, name, sourceId) => {
        let id = sourceId;
        if (id === undefined || used[kind].has(id)) { id = Math.max(-1, ...used[kind]) + 1; log.push(`ID_CHANGED ${kind} ${name}: source id ${sourceId ?? 'none'} is not available, registered as ${id}${['npc', 'loc', 'obj'].includes(kind) ? ' (a map that places it by number needs translate-map-ids)' : ''}`); }
        used[kind].add(id);
        appendGuarded(join(target.root, 'pack', `${kind}.pack`), `${id}=${name}\n`);
    };
    for (const p of plan.packIds) { register(p.kind, p.name, p.sourceId); log.push(`PACK_ID ${p.kind} ${p.name}`); }
    for (const { kind, name, def, dropLines, rewriteLines, sourceId } of plan.imports.values()) {
        const srcLines = readFileSync(def.file, 'utf8').split(/\r?\n/);
        const drop = new Map(dropLines.map((d) => [d.line, d]));
        const block = [];
        for (let i = def.line - 1; i < def.end; i++) {
            if (drop.has(i + 1)) { block.push(`// dropped (no 274 animation): ${srcLines[i].trim()}`); log.push(`DROPPED imported ${kind} ${name} \`${srcLines[i].trim()}\` - ${drop.get(i + 1).why}`); continue; }
            let text = srcLines[i];
            for (const r of rewriteLines.filter((x) => x.line === i + 1)) { text = text.replace(tokenRe(r.from), r.to); log.push(`ALIASED imported ${kind} ${name} ${r.from} -> ${r.to} (same id, 274 name)`); }
            block.push(text);
        }
        while (block.length && !block[block.length - 1].trim()) block.pop();
        appendGuarded(join(target.root, 'scripts/_ported/configs', `ported.${kind}`), block.join('\n') + '\n\n');
        if (TRANSMITTED.has(kind) && !target.packs[kind].byName.has(name)) register(kind, name, sourceId);
        log.push(`IMPORTED ${kind} ${name} from ${relative(source.root, def.file)}:${def.line}`);
    }
    for (const [name, src] of plan.constants) { appendGuarded(join(target.root, 'scripts/_ported/configs', 'ported.constant'), `^${name} = ${src.value}\n`); log.push(`IMPORTED constant ^${name} = ${src.value}`); }
    // 3. Copy model files (local only) and give each a pack id.
    const usedModels = new Set(target.packs.model.byId.keys());
    for (const [name, file] of plan.models) {
        const dest = join(target.root, 'models/_ported', name + '.ob2');
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(file, dest);
        if (!target.packs.model.byName.has(name)) {
            let id = source.packs.model.byName.get(name);
            if (id === undefined || usedModels.has(id)) id = Math.max(-1, ...usedModels) + 1;
            usedModels.add(id);
            appendGuarded(join(target.root, 'pack/model.pack'), `${id}=${name}\n`);
        }
        log.push(`COPIED_MODEL ${name} (local only - never commit .ob2 files)`);
    }
    return log;
}

function report(res, target, { verify }) {
    const rel = (f) => relative(target.root, f);
    const lines = [];
    const byFix = (f) => res.broken.filter((b) => (b.fixable ? b.fix : b.fix === 'copy-model' ? 'copy-model' : 'blocked') === f);
    lines.push(`duplicates: ${res.duplicates.length}   broken references: ${res.broken.length}   script problems: ${res.scripts.length}   pack-id issues: ${res.packIssues.length}`);
    if (res.duplicates.length) {
        lines.push('', 'DUPLICATE CONFIGS (packer: "Duplicate config found") - one of each pair must go (--apply --pristine <untouched content> removes the added copy):');
        for (const d of res.duplicates.slice(0, 40)) lines.push(`  ${d.kind} [${d.name}]  ${d.first}  and  ${d.second}`);
        if (res.duplicates.length > 40) lines.push(`  ... ${res.duplicates.length - 40} more (use --json)`);
    }
    for (const [fix, title] of [['alias', 'RENAMED between revisions: reference will be pointed at the 274 name (--apply)'], ['import-text', 'FIXABLE by importing text definitions (--apply)'], ['drop-property', 'COSMETIC: animation 274 lacks; config property commented out, script animation set to null (--apply)'], ['copy-model', 'NEEDS MODEL FILES the source has (--apply --copy-models)'], ['blocked', 'BLOCKED: park the quest that needs these']]) {
        const list = byFix(fix);
        if (!list.length) continue;
        lines.push('', `${title}: ${list.length}`);
        for (const b of list.slice(0, 25)) lines.push(`  ${rel(b.file)}:${b.line}  ${b.from.kind} ${b.from.name}  ${b.key} -> ${b.kind} ${b.name}${b.why ? `  (${b.why})` : ''}`);
        if (list.length > 25) lines.push(`  ... ${list.length - 25} more (use --json)`);
    }
    for (const [fix, title] of [['import-constant', 'SCRIPT constants to import (--apply)'], ['add-signature', 'SCRIPT commands the engine has but engine.rs2 does not declare'], ['port-script', 'SCRIPT procs/labels not ported yet (copy the script from the source)'], ['blocked', 'SCRIPT problems with no content fix']]) {
        const list = res.scripts.filter((x) => x.fix === fix);
        if (!list.length) continue;
        lines.push('', `${title}: ${list.length}`);
        for (const x of list.slice(0, 25)) lines.push(`  ${rel(x.file)}:${x.line}  ${x.type} ${x.name}  (${x.why})`);
        if (list.length > 25) lines.push(`  ... ${list.length - 25} more (use --json)`);
    }
    const blockedQuests = new Map();
    for (const b of [...res.broken.filter((x) => !x.fixable), ...res.scripts.filter((x) => x.fix === 'blocked')]) { const q = questOf(b.file); if (q) blockedQuests.set(q, (blockedQuests.get(q) ?? 0) + 1); }
    if (blockedQuests.size) lines.push('', `quests with unfixable references (park these): ${[...blockedQuests].map(([q, n]) => `${q} (${n})`).join(', ')}`);
    const pl = res.plan;
    if (pl.imports.size || pl.drops.length || pl.models.size || pl.rewrites.length || pl.packIds.length || pl.constants.size) lines.push('', `plan (--apply): alias ${pl.rewrites.length} reference(s), import ${pl.imports.size} definition(s) and ${pl.constants.size} constant(s), comment out ${pl.drops.length} cosmetic propert${pl.drops.length === 1 ? 'y' : 'ies'}, register ${pl.packIds.length} pack id(s), copy ${pl.models.size} model file(s)`);
    if (res.packIssues.length) {
        const n = res.packIssues.filter((p) => p.issue.startsWith('config')).length;
        lines.push('', `PACK IDS: ${n} transmitted config(s) without an id line, ${res.packIssues.length - n} id line(s) without a config.`,
            verify ? '  With build.verify=true both are build errors.' : '  With build.verify=false the packer auto-assigns missing ids (they will not match ids used in maps); stale id lines are tolerated. Pass --verify to count these as errors.');
        for (const p of res.packIssues.slice(0, 10)) lines.push(`  ${p.kind} ${p.name}: ${p.issue}`);
    }
    return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const args = process.argv.slice(2);
    const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
    const targetPath = args.find((a, i) => !a.startsWith('--') && !['--source', '--log', '--pristine'].includes(args[i - 1]));
    if (targetPath && args.includes('--apply') && /[\\/]lc274([\\/]|$)/.test(targetPath)) { console.error('refusing --apply on the live world (lc274)'); process.exit(2); }
    if (!targetPath || !existsSync(join(targetPath, 'scripts'))) { console.error('usage: prepack-check.mjs <target-content> [--source <377-content>] [--pristine <274-content>] [--json] [--verify] [--apply [--copy-models] [--log file.md]]'); process.exit(2); }
    const sourcePath = opt('--source');
    const verify = args.includes('--verify');
    const opts = { copyModels: args.includes('--copy-models') };
    let target = loadContent(targetPath);
    const source = sourcePath ? loadContent(sourcePath) : null;
    let res = check(target, source, opts);
    if (args.includes('--apply')) {
        if (!source) { console.error('--apply needs --source'); process.exit(2); }
        const log = [];
        const pristinePath = opt('--pristine');
        if (pristinePath && target.duplicates.length) {
            log.push(...dedupe(target, loadContent(pristinePath)));
            target = loadContent(targetPath);
            res = check(target, source, opts);
        }
        log.push(...applyPlan(target, source, res.plan));
        for (const l of log) console.log(l);
        const logFile = opt('--log');
        if (logFile && log.length) appendGuarded(logFile, `\n## prepack-check --apply\n\n${log.map((l) => `- ${l}`).join('\n')}\n`);
        modelFileCache = new Map();
        target = loadContent(targetPath);
        res = check(target, source, opts);
        console.log(`\napplied ${log.length} change(s); re-checked:`);
    }
    if (args.includes('--json')) console.log(JSON.stringify({ duplicates: res.duplicates.map((d) => ({ ...d, occurrences: undefined })), broken: res.broken.map((b) => ({ ...b, file: relative(target.root, b.file) })), scripts: res.scripts.map((x) => ({ ...x, src: undefined, file: relative(target.root, x.file) })), packIssues: res.packIssues }, null, 2));
    else console.log(report(res, target, { verify }));
    const errors = res.duplicates.length + res.broken.length + res.scripts.length + (verify ? res.packIssues.length : 0);
    process.exit(errors ? 1 : 0);
}
