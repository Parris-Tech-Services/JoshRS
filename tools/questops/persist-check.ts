// Client-free persistence check: does a quest stage var survive a save and reload?
//
// Run it from inside a world's ENGINE directory (it needs that world's data/pack cache):
//   cd ~/dev274/engine && npx tsx ~/projects/JoshRS/tools/questops/persist-check.ts cookquest
//
// Why this exists: every "structurally complete" audit in this project missed one question - does the
// stage actually come back after a logout? Player.save() writes only vars whose VarPlayerType has
// scope=perm, and with no cache loaded every varp resolves without a scope, so an uninitialised run
// reports a false failure (observed: 160-byte save, no vars). VarPlayerType.load() is therefore
// mandatory before saving.
// Imports are resolved from the world's engine directory (the cwd), so this file can live in the repo
// without the engine's '#/' alias resolution.
const root = process.cwd();
const { default: VarPlayerType } = await import(`${root}/src/cache/config/VarPlayerType.ts`);
// World must be imported before the entity modules: Player and NetworkPlayer are circular.
const { default: World } = await import(`${root}/src/engine/World.ts`);
const { PlayerLoading } = await import(`${root}/src/engine/entity/PlayerLoading.ts`);
const { default: Packet } = await import(`${root}/src/io/Packet.ts`);
void World;

const name = process.argv[2] ?? 'cookquest';
const value = 7;

VarPlayerType.load('data/pack');
const id = VarPlayerType.getId(name);
if (id < 0) {
    console.error(`no varp named ${name}`);
    process.exit(2);
}
const scope = VarPlayerType.get(id).scope;
if (scope !== VarPlayerType.SCOPE_PERM) {
    console.error(`BLOCKED: ${name} (id ${id}) is not scope=perm, so it is never saved`);
    process.exit(2);
}

const player = PlayerLoading.load('persistcheck', new Packet(new Uint8Array(0)), null);
player.vars[id] = value;
const save = player.save();
const reloaded = PlayerLoading.load('persistcheck', new Packet(new Uint8Array(save)), null);
const actual = reloaded.vars?.[id];

console.log(`varp ${name} (id ${id}) scope=perm, save=${save.length} bytes`);
console.log(`before=${value} after=${actual}`);
if (actual !== value) {
    console.error('FAILED: stage var did not survive save/reload');
    process.exit(1);
}
console.log('PERSISTENCE VERIFIED');
