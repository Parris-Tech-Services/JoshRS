// Shared parsers for the quest-port tools. Kept in one place because each tool previously carried its
// own regex, and every copy drifted (symbols with '+', id 0, ap* triggers, per-quest config files).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Config/script symbols are anything up to the closing bracket: real names include '+'
// (mmsnailpoint_red+black), so a [a-z0-9_] class silently drops them.
const SYMBOL = '[^\\],\\s]+';

/** id=name pack file -> Map<number, string>. */
export function parsePack(text) {
    const m = new Map();
    for (const line of text.split(/\r?\n/)) {
        const eq = line.indexOf('=');
        if (eq < 1) continue;
        const id = line.slice(0, eq).trim();
        if (/^\d+$/.test(id)) m.set(Number(id), line.slice(eq + 1).trim());
    }
    return m;
}
export const loadPack = (file) => (existsSync(file) ? parsePack(readFileSync(file, 'utf8')) : new Map());

/** Names of every [definition] header in a config file. */
export function defNames(text) {
    return [...text.matchAll(/^\[([^\]\r\n]+)\]\s*$/gm)].map((m) => m[1]);
}

/** Every definition of a kind under a scripts tree: _unpack/<rev>/all.<kind> and per-quest configs. */
export function indexDefs(scriptsDir, kind) {
    const names = new Set();
    const walk = (dir) => {
        if (!existsSync(dir)) return;
        for (const e of readdirSync(dir, { withFileTypes: true })) {
            const p = join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (e.name.endsWith(`.${kind}`)) for (const n of defNames(readFileSync(p, 'utf8'))) names.add(n);
        }
    };
    walk(scriptsDir);
    return names;
}

const SECTIONS = { npc: 'NPC', loc: 'LOC', obj: 'OBJ' };

/** .jm2 text -> { npc, loc, obj } sets of numeric ids. Records are "level x z: id ...". Id 0 is valid. */
export function parseMapRefs(text) {
    const out = { npc: new Set(), loc: new Set(), obj: new Set() };
    let cur = null;
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim();
        if (line.startsWith('====')) {
            cur = Object.keys(SECTIONS).find((k) => new RegExp(`\\b${SECTIONS[k]}\\b`).test(line)) ?? null;
            continue;
        }
        if (!cur) continue;
        const m = line.match(/^\d+\s+\d+\s+\d+\s*:\s*(\d+)/);
        if (m) out[cur].add(Number(m[1]));
    }
    return out;
}

/**
 * Trigger references by registry. Both op (operate) and ap (approach) triggers, numbered, 'u' (use-on)
 * and 't' (spell-on) forms. opobj/apobj name ground objects, which are obj symbols like opheld.
 */
export function handlerRefs(text) {
    const grab = (kinds) => {
        const re = new RegExp(`\\[[oa]p(?:${kinds})(?:\\d+|u|t)?,\\s*(${SYMBOL})\\]`, 'gi');
        return [...new Set([...text.matchAll(re)].map((m) => m[1]))];
    };
    return { npc: grab('npc'), loc: grab('loc'), obj: grab('held|obj') };
}

/** imported-maps.txt ("<name>.jm2 <sha256>" per line, '#' comments) -> Map<name, sha256>. */
export function parseManifest(text) {
    const m = new Map();
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.replace(/#.*/, '').trim();
        if (!line) continue;
        const [name, sha = ''] = line.split(/\s+/);
        if (name.endsWith('.jm2')) m.set(name, sha);
    }
    return m;
}
export const MANIFEST = 'imported-maps.txt';

/** Body of a [proc,name] script: text up to the next top-level [trigger,...] header. */
export function procBody(text, name) {
    const start = text.search(new RegExp(`^\\[proc,${name}\\]`, 'm'));
    if (start < 0) return null;
    const rest = text.slice(start + 1);
    const next = rest.search(/^\[[a-z_]+,[^\]]+\]/m);
    return next < 0 ? text.slice(start) : text.slice(start, start + 1 + next);
}

/** Pairs of (stage varp, complete constant) from comparisons like `%cookquest = ^cook_complete`. */
export function completeChecks(text) {
    return [...text.matchAll(/%([a-z0-9_]+)\s*(?:=|>=|>)\s*\^([a-z0-9_]*complete[a-z0-9_]*)/gi)].map((m) => ({ varp: m[1], constant: m[2] }));
}

/** varp definitions with their scope from .varp config text -> Map<name, 'perm'|'temp'>. */
export function varpScopes(text) {
    const out = new Map();
    let cur = null;
    for (const raw of text.split(/\r?\n/)) {
        const h = raw.match(/^\[([^\]]+)\]\s*$/);
        if (h) { cur = h[1]; if (!out.has(cur)) out.set(cur, 'temp'); continue; }
        if (cur && /^scope\s*=\s*perm\s*$/.test(raw.trim())) out.set(cur, 'perm');
    }
    return out;
}

/** varbit definitions -> Map<varbit name, base varp name>. A varbit persists iff its base varp does. */
export function varbitBases(text) {
    const out = new Map();
    let cur = null;
    for (const raw of text.split(/\r?\n/)) {
        const h = raw.match(/^\[([^\]]+)\]\s*$/);
        if (h) { cur = h[1]; continue; }
        const b = raw.trim().match(/^basevar\s*=\s*(\S+)$/);
        if (cur && b) out.set(cur, b[1]);
    }
    return out;
}
