#!/usr/bin/env node
// Layer 2: read-only diagnostics for rev274 content. Never starts/stops a server.
// Distinguishes static map/NPC spawns from runtime state; never claims a save was read.
// Requires only Node and the content folder, so it works on Android Termux.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { procBody, completeChecks } from '../lib/rs-refs.mjs';

export const REGION_SIZE = 64;
export const mapName = (x, z) => 'm' + Math.floor(x / REGION_SIZE) + '_' + Math.floor(z / REGION_SIZE) + '.jm2';

export function parseMap(text) {
    const result = { MAP: [], NPC: [], OBJ: [], LOC: [], malformed: [] };
    let section = null;
    for (const original of text.split(/\r?\n/)) {
        const line = original.trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) continue;
        if (line.startsWith('====')) {
            const found = line.match(/^=+\s*(MAP|NPC|OBJ|LOC)\s*=+$/i);
            section = found ? found[1].toUpperCase() : null;
            continue;
        }
        if (!section) continue;
        // MAP rows carry letter-prefixed tile values ("0 0 2: h30 u48"); NPC/LOC/OBJ rows carry a numeric id.
        const row = section === 'MAP'
            ? line.match(/^(\d+)\s+(\d+)\s+(\d+)\s*:()/)
            : line.match(/^(\d+)\s+(\d+)\s+(\d+)\s*:\s*(-?\d+)(?=\D|$)/);
        if (!row) {
            result.malformed.push({ section, line });
            continue;
        }
        const [, level, localX, localZ, id] = row;
        result[section].push({ level: Number(level), localX: Number(localX), localZ: Number(localZ), id: id === '' ? null : Number(id) });
    }
    return result;
}

export function loadPack(file) {
    const byId = new Map();
    const byName = new Map();
    if (!existsSync(file)) return { byId, byName };
    for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const match = raw.match(/^(\d+)=([^\r\n]+)$/);
        if (!match) continue;
        const id = Number(match[1]), name = match[2].trim();
        if (byId.has(id) && byId.get(id) !== name) throw new Error('duplicate ID ' + id + ' in ' + file);
        if (byName.has(name) && byName.get(name) !== id) throw new Error('duplicate symbol ' + name + ' in ' + file);
        byId.set(id, name);
        byName.set(name, id);
    }
    return { byId, byName };
}

const safeContent = (content) => {
    const r = resolve(content);
    if (r.split(/[\\/]/).includes('lc274')) throw new Error('BLOCKED: live lc274 is not a dev world');
    if (!existsSync(join(r, 'maps')) || !existsSync(join(r, 'pack'))) throw new Error('no maps/ and pack/ folders in ' + r);
    return r;
};

function mapFile(content, name) {
    if (!/^m\d+_\d+\.jm2$/.test(name)) throw new Error('invalid map region ' + name);
    const file = join(content, 'maps', name);
    return existsSync(file) ? parseMap(readFileSync(file, 'utf8')) : null;
}

export function inspectMap(contentInput, x, z, level = 0) {
    const content = safeContent(contentInput);
    const name = mapName(x, z);
    const data = mapFile(content, name);
    if (!data) return { kind: 'map', status: 'MISSING_MAP', region: name, x, z, level, staticOnly: true };
    const lx = x % REGION_SIZE, lz = z % REGION_SIZE;
    const tile = data.MAP.some((row) => row.level === level && row.localX === lx && row.localZ === lz);
    const counts = Object.fromEntries(['MAP','NPC','LOC','OBJ'].map((kind) => [kind.toLowerCase(), data[kind].length]));
    return { kind: 'map', status: data.malformed.length ? 'MALFORMED_MAP' : !data.MAP.length ? 'EMPTY_MAP' : tile ? 'TERRAIN_AT_TILE' : 'NO_TERRAIN_AT_TILE',
        region: name, x, z, level, localX: lx, localZ: lz, counts, malformed: data.malformed.slice(0, 5), staticOnly: true };
}

export function nearby(contentInput, x, z, level = 0, radius = 5, expected = null) {
    const content = safeContent(contentInput);
    if (!Number.isInteger(radius) || radius < 0 || radius > 64) throw new Error('radius must be 0..64 tiles');
    const npcPack = loadPack(join(content, 'pack/npc.pack'));
    const spawns = [], missingRegions = [];
    for (let rx = Math.floor((x - radius) / REGION_SIZE); rx <= Math.floor((x + radius) / REGION_SIZE); rx++) {
        for (let rz = Math.floor((z - radius) / REGION_SIZE); rz <= Math.floor((z + radius) / REGION_SIZE); rz++) {
            if (rx < 0 || rz < 0) continue;
            const name = 'm' + rx + '_' + rz + '.jm2';
            const data = mapFile(content, name);
            if (!data) { missingRegions.push(name); continue; }
            for (const row of data.NPC) {
                const nx = rx * REGION_SIZE + row.localX, nz = rz * REGION_SIZE + row.localZ;
                const distance = Math.max(Math.abs(nx - x), Math.abs(nz - z));
                if (row.level !== level || distance > radius) continue;
                spawns.push({ name: npcPack.byId.get(row.id) ?? null, id: row.id, x: nx, z: nz, level: row.level, distance, region: name });
            }
        }
    }
    spawns.sort((a,b) => a.distance - b.distance || a.id - b.id);
    const found = expected === null ? null : spawns.some((s) => s.name === expected);
    return { kind: 'near', status: expected !== null && !found ? 'EXPECTED_NPC_MISSING' : 'OK',
        x, z, level, radius, expected, found, spawns, missingRegions, staticOnly: true,
        note: 'Static map spawns only. NPCs that move, are conditional, or fail to load require the Layer 1 runtime check.' };
}

function walk(dir, extension, files = []) {
    if (!existsSync(dir)) return files;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p, extension, files);
        else if (entry.isFile() && p.endsWith(extension)) files.push(p);
    }
    return files;
}

function findDefinition(content, name, ext) {
    // Active definitions: _unpack/274 plus every config under scripts/, but never older revisions'
    // _unpack folders (225/244/245/254), which are not what the 274 engine packs.
    const files = walk(join(content, 'scripts'), ext).filter((f) => !/[\\/]_unpack[\\/](?!274[\\/])/.test(f));
    for (const f of files) {
        const text = readFileSync(f, 'utf8');
        const headers = [...text.matchAll(/^\[([^\]\r\n]+)\]\s*$/gm)];
        for (let i = 0; i < headers.length; i++) {
            if (headers[i][1] !== name) continue;
            const end = i + 1 < headers.length ? headers[i + 1].index : text.length;
            return { file: relative(content, f), body: text.slice(headers[i].index + headers[i][0].length, end) };
        }
    }
    return null;
}

export function varDefinition(contentInput, name) {
    const content = safeContent(contentInput);
    const varps = loadPack(join(content, 'pack/varp.pack'));
    const id = varps.byName.get(name);
    if (id === undefined) {
        // A stage var can be a varbit: a bit range inside a base varp, which persists iff the base does.
        const vbId = loadPack(join(content, 'pack/varbit.pack')).byName.get(name);
        if (vbId === undefined) return { kind: 'var', status: 'UNREGISTERED_VAR', name, staticOnly: true, value: null };
        const def = findDefinition(content, name, '.varbit');
        const base = def?.body.match(/^\s*basevar\s*=\s*(\S+)/m)?.[1] ?? null;
        if (!base) return { kind: 'var', status: 'NO_ACTIVE_DEFINITION', type: 'varbit', name, id: vbId, value: null, staticOnly: true };
        const baseDef = varDefinition(content, base);
        return { kind: 'var', status: baseDef.status === 'REGISTERED' ? 'REGISTERED' : baseDef.status, type: 'varbit', name, id: vbId,
            basevar: base, scope: baseDef.scope, permanent: baseDef.permanent === true, definitionFile: def.file, value: null, staticOnly: true,
            note: 'A varbit persists only if its base varp is scope=perm.' };
    }
    const def = findDefinition(content, name, '.varp');
    if (!def) return { kind: 'var', status: 'NO_ACTIVE_DEFINITION', type: 'varp', name, id, value: null, staticOnly: true };
    const scope = def.body.match(/^\s*scope\s*=\s*(\S+)/m)?.[1] ?? 'unspecified';
    return { kind: 'var', status: 'REGISTERED', type: 'varp', name, id, scope, permanent: scope === 'perm', definitionFile: def.file,
        value: null, staticOnly: true, note: 'Current value requires a running disposable test player (runtime.ts).' };
}

export function stageDefinition(contentInput, questName) {
    const content = safeContent(contentInput);
    if (!/^quest_[a-z0-9_]+$/.test(questName)) throw new Error('quest must be a quest_<name> directory');
    const root = join(content, 'scripts/quests', questName);
    if (!existsSync(root)) return { kind: 'stage', status: 'QUEST_NOT_FOUND', quest: questName, staticOnly: true };
    const files = walk(join(root,'scripts'), '.rs2');
    const text = files.map((f) => readFileSync(f,'utf8')).join('\n');
    const re = /%([a-z0-9_]+)\s*(?:=|==|===|>=|<)\s*\^([a-z0-9_]*_?(?:complete|done|finished|started|progress)[a-z0-9_]*)/gi;
    // Authoritative source: [proc,count_questpoints] pairs each counted quest's stage var with its
    // ^..._complete constant. Use the pair whose constant this quest's scripts also compare against.
    let counted = null;
    for (const f of walk(join(content, 'scripts'), '.rs2')) {
        const body = procBody(readFileSync(f, 'utf8'), 'count_questpoints');
        if (body) { counted = completeChecks(body); break; }
    }
    const own = completeChecks(text);
    const hit = counted?.find((c) => own.some((o) => o.constant === c.constant && o.varp === c.varp));
    if (hit) {
        return { kind: 'stage', status: 'STAGE_VAR_CANDIDATE', source: 'count_questpoints', quest: questName, stageVar: hit.varp,
            candidates: [hit.varp], variable: varDefinition(content, hit.varp), currentStage: null, staticOnly: true,
            note: 'From [proc,count_questpoints]; current stage requires runtime.' };
    }
    const candidates = [...new Set([...text.matchAll(re)].map((m)=>m[1]))];
    const journalFiles = files.filter((f)=>/journal/i.test(basename(f)));
    if (!candidates.length) candidates.push(...new Set(journalFiles.flatMap((f)=>[...readFileSync(f,'utf8').matchAll(/%([a-z0-9_]+)/gi)].map((m)=>m[1]))));
    const stageVar = candidates.length === 1 ? candidates[0] : null;
    return { kind: 'stage', status: !candidates.length ? 'STAGE_VAR_UNKNOWN' : !stageVar ? 'STAGE_VAR_AMBIGUOUS' : 'STAGE_VAR_CANDIDATE',
        source: 'heuristic (quest not in count_questpoints)', quest: questName, stageVar, candidates, variable: stageVar ? varDefinition(content,stageVar) : null,
        currentStage: null, staticOnly: true, note: 'Candidate inferred from script; current stage requires runtime. Do not claim quest completed.' };
}

const getOption = (argv, key, defaultValue = undefined) => {
    const pos = argv.indexOf('--' + key);
    return pos >= 0 ? argv[pos + 1] : defaultValue;
};
const num = (argv, key, fallback = undefined) => {
    const raw = getOption(argv,key,fallback);
    if (raw === undefined || !/^\d+$/.test(String(raw))) throw new Error('--' + key + ' must be a nonnegative integer');
    return Number(raw);
};
export function runCommand(argv) {
    const action = argv.find((a) => ['map','near','var','stage'].includes(a));
    const content = getOption(argv,'content');
    if (!action || !content) throw new Error('usage: inspect.mjs map|near|var|stage --content <dev274/content> [--x --z --level --radius --expect --name --quest --json]');
    const level = action === 'map' || action === 'near' ? num(argv,'level',0) : 0;
    if (action === 'map') return inspectMap(content,num(argv,'x'),num(argv,'z'),level);
    if (action === 'near') return nearby(content,num(argv,'x'),num(argv,'z'),level,num(argv,'radius',5),getOption(argv,'expect',null));
    if (action === 'var') return varDefinition(content,getOption(argv,'name') ?? getOption(argv,'varp') ?? '');
    return stageDefinition(content,getOption(argv,'quest') ?? '');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const result = runCommand(process.argv.slice(2));
        if (process.argv.includes('--json')) console.log(JSON.stringify(result,null,2));
        else {
            console.log('DIAG ' + result.kind + ': ' + result.status);
            console.log(JSON.stringify(result,null,2));
        }
        if (!['OK','REGISTERED','STAGE_VAR_CANDIDATE','TERRAIN_AT_TILE'].includes(result.status)) process.exitCode = 1;
    } catch (error) {
        console.error('DIAG ERROR: ' + error.message);
        process.exitCode = 2;
    }
}
