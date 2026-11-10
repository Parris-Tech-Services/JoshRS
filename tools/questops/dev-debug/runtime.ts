// Layer 2 optional live-state adapter. Runs IN-PROCESS on a disposable test player;
// requires Claude's Layer 1 playtest/harness.ts to be merged or checked out.
// This does not attach to, restart, or introspect a running production server.
// Invoke from ~/dev274/engine with npx tsx <repo>/tools/questops/dev-debug/runtime.ts ...
import { resolve, join } from 'node:path';
import { inspectMap, nearby, varDefinition, stageDefinition } from './inspect.mjs';

const args = process.argv.slice(2);
const option = (key: string, fallback?: string) => {
    const i = args.indexOf('--' + key);
    return i >= 0 ? args[i + 1] : fallback;
};
const intArg = (key: string, fallback?: number): number => {
    const v = option(key, fallback === undefined ? undefined : String(fallback));
    if (v === undefined || !/^\d+$/.test(v)) throw new Error('--' + key + ' must be a nonnegative integer');
    return Number(v);
};
const action = args.find((x) => ['map', 'near', 'var', 'stage'].includes(x));
const content = option('content') ?? resolve(process.cwd(), '../content');
const cwd = resolve(process.cwd());
if (cwd.split(/[\\/]/).includes('lc274') || resolve(content).split(/[\\/]/).includes('lc274')) {
    throw new Error('BLOCKED: cannot use live lc274; this is a dev-only in-process inspector');
}
if (!cwd.split(/[\\/]/).includes('dev274')) throw new Error('BLOCKED: run from the isolated dev274/engine directory');
if (!action) throw new Error('usage: runtime.ts map|near|var|stage --content ../content [--x N --z N --level N --radius N --expect NPC --name VARP --quest quest_NAME --json]');

// The runtime harness is maintained exclusively by Claude in Layer 1.
// Import lazily so the static inspector remains useful before its PR lands.
const { boot } = await import('../playtest/harness.ts');
const h = await boot();
h.login();
const loc = { x: intArg('x', h.player.x), z: intArg('z', h.player.z), level: intArg('level', h.player.level) };
let result: Record<string, unknown>;
try {
    switch (action) {
        case 'map': {
            const staticMap = inspectMap(content, loc.x, loc.z, loc.level);
            h.teleport(loc.x, loc.z, loc.level);
            result = { ...staticMap, runtime: { playerPosition: [h.player.x, h.player.z, h.player.level],
                note: 'The server player moved; this does not verify browser terrain or models.' }, staticOnly: false };
            break;
        }
        case 'near': {
            const radius = intArg('radius', 5);
            const expected = option('expect') ?? null;
            h.teleport(loc.x, loc.z, loc.level);
            const spawns = h.npcsNear(loc.x, loc.z, loc.level, radius).map((n: any) => ({
                name: n.name, id: n.npc.type, x: n.x, z: n.z,
                distance: Math.max(Math.abs(n.x - loc.x), Math.abs(n.z - loc.z))
            }));
            const found = expected === null ? null : spawns.some((n: any) => n.name === expected);
            result = { kind: 'near', status: expected && !found ? 'EXPECTED_NPC_MISSING' : 'OK',
                runtime: true, centre: loc, radius, expected, found, spawns,
                staticSpawns: nearby(content,loc.x,loc.z,loc.level,radius).spawns,
                note: 'These are real NPC entities in the in-process dev world, not just map records.' };
            break;
        }
        case 'var': {
            const name = option('name') ?? option('varp');
            if (!name) throw new Error('var requires --name <varp-symbol>');
            const definition = varDefinition(content,name);
            result = { ...definition, value: definition.type === 'varbit' ? null : h.getVar(name), permanent: definition.type === 'varbit' ? definition.permanent : h.isPerm(name),
                runtime: true, staticOnly: false, status: 'RUNTIME_VAR' };
            break;
        }
        case 'stage': {
            const quest = option('quest');
            if (!quest) throw new Error('stage requires --quest quest_<name>');
            const definition = stageDefinition(content,quest);
            const stageVar = option('varp') ?? definition.stageVar;
            if (!stageVar) throw new Error('no unique stage var inferred; pass --varp <name> explicitly');
            const isVarbit = (definition.variable as any)?.type === 'varbit';
            result = { ...definition, stageVar,
                // The harness reads varps by name; a varbit's value lives inside its base varp.
                currentStage: isVarbit ? null : h.getVar(stageVar),
                permanent: isVarbit ? (definition.variable as any).permanent : h.isPerm(stageVar), runtime: true, staticOnly: false, status: 'RUNTIME_STAGE',
                note: 'Observed for the disposable playtest player only. Not your live character or proof of quest completion.' };
            break;
        }
        default:
            throw new Error('unsupported action');
    }
    if (args.includes('--json')) console.log(JSON.stringify(result,null,2));
    else console.log('DIAG ' + action + ': ' + result.status + '\n' + JSON.stringify(result,null,2));
    if (['EXPECTED_NPC_MISSING','NO_TERRAIN_AT_TILE','EMPTY_MAP','MISSING_MAP','MALFORMED_MAP'].includes(String(result.status))) process.exitCode = 1;
} finally {
    if (h.player) {
        h.World.removePlayer(h.player);
        h.World.logoutRequests.delete('playtest');
    }
}
// World starts worker threads that keep Node alive; exit explicitly as playtest/run.ts does.
process.exit(process.exitCode ?? 0);
