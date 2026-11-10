import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTAL_DESTINATIONS_274, handlePortalCommand274, portalDestinations274 } from './PortalNetwork274.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));

function makePlayer(username = 'alice') {
    const messages = [];
    const player = {
        username, x: 3222, z: 3218, level: 0, loggingOut: false,
        messages, access: true, allowMovement: true,
        messageGame(message) { messages.push(message); },
        closeModal() { this.closed = true; },
        canAccess() { return this.access; },
        clearInteraction() { this.cleared = true; },
        unsetMapFlag() { this.unset = true; },
        teleJump(x, z, level) {
            if (this.allowMovement) Object.assign(this, { x, z, level });
        }
    };
    return player;
}

const opts = (now = 10000, users = ['alice']) => ({ enabled: true, users, now });

test('destination IDs unique and world coordinates in 274 range', () => {
    assert.equal(new Set(PORTAL_DESTINATIONS_274.map(d => d.id)).size, PORTAL_DESTINATIONS_274.length);
    for (const d of PORTAL_DESTINATIONS_274) {
        assert.match(d.id, /^[a-z0-9_]+$/);
        assert.ok(d.x > 2000 && d.x < 4000 && d.z > 2000 && d.z < 4000);
        assert.equal(d.level, 0);
    }
    assert.equal(portalDestinations274('DRA').length, 1);
    assert.equal(portalDestinations274('does-not-exist').length, 0);
});

test('unrelated client commands remain untouched; feature is opt-in and allowlisted', () => {
    const p = makePlayer();
    assert.equal(handlePortalCommand274(p, 'maxme', [], opts()), false);
    assert.equal(handlePortalCommand274(p, 'hub'), true);
    assert.equal(p.x, 3222);
    assert.match(p.messages.at(-1), /not enabled/);
    assert.equal(handlePortalCommand274(p, 'hub', [], opts(10000, ['bob'])), true);
    assert.equal(p.x, 3222);
});

test('hub, back, lasttele work per login session and enforce cooldown', () => {
    const p = makePlayer();
    assert.equal(handlePortalCommand274(p, 'hub', [], opts(10000)), true);
    assert.deepEqual([p.x, p.z], [3212, 3424]);
    assert.equal(p.closed, true);
    assert.equal(p.unset, true);

    handlePortalCommand274(p, 'back', [], opts(10100));
    assert.deepEqual([p.x, p.z], [3212, 3424]);
    assert.match(p.messages.at(-1), /Wait/);
    handlePortalCommand274(p, 'back', [], opts(11600));
    assert.deepEqual([p.x, p.z], [3222, 3218]);
    handlePortalCommand274(p, 'lasttele', [], opts(13200));
    assert.deepEqual([p.x, p.z], [3212, 3424]);

    const other = makePlayer();
    handlePortalCommand274(other, 'back', [], opts());
    assert.match(other.messages.at(-1), /No previous/);
});

test('destination IDs cannot inject arbitrary coordinates or access nonexistent destinations', () => {
    const p = makePlayer();
    handlePortalCommand274(p, 'ft', ['9999,9999'], opts());
    assert.deepEqual([p.x, p.z], [3222, 3218]);
    assert.match(p.messages.at(-1), /Unknown portal/);
    handlePortalCommand274(p, 'ft', ['draynor'], opts(10000));
    assert.deepEqual([p.x, p.z], [3093, 3244]);
});

test('busy players, logging-out players and rejected engine teleport do not record success', () => {
    const busy = makePlayer();
    busy.access = false;
    handlePortalCommand274(busy, 'hub', [], opts());
    assert.deepEqual([busy.x, busy.z], [3222, 3218]);
    assert.match(busy.messages.at(-1), /Finish what/);

    const logging = makePlayer();
    logging.loggingOut = true;
    handlePortalCommand274(logging, 'hub', [], opts());
    assert.deepEqual([logging.x, logging.z], [3222, 3218]);

    const rejected = makePlayer();
    rejected.allowMovement = false;
    handlePortalCommand274(rejected, 'hub', [], opts());
    assert.match(rejected.messages.at(-1), /Portal failed/);
    handlePortalCommand274(rejected, 'back', [], opts(12000));
    assert.match(rejected.messages.at(-1), /No previous/);
});

test('destination list is read-only and returns a useful hint', () => {
    const p = makePlayer();
    handlePortalCommand274(p, 'destinations', ['cath'], opts());
    assert.ok(p.messages.some(v => v.includes('catherby')));
    assert.deepEqual([p.x, p.z], [3222, 3218]);
    assert.ok(p.messages.some(v => v.includes('::ft')));
});

test('installer must dry-run first, requires disposable confirmation, and is idempotent', (t) => {
    const root = mkdtempSync(path.join(tmpdir(), 'joshrs-disposable-test274-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const engine = path.join(root, 'engine');
    const handler = path.join(engine, 'src/network/game/client/handler/ClientCheatHandler.ts');
    mkdirSync(path.dirname(handler), { recursive: true });
    mkdirSync(path.join(engine, 'src/engine'), { recursive: true });
    const fixture = [
        "import ClientGameMessageHandler from '#/network/game/client/ClientGameMessageHandler.js';",
        'export default class ClientCheatHandler {',
        '    handle(message, player) {',
        '        const cmd = message.input;',
        '        const args = [];',
        '        if (cmd === undefined || cmd.length <= 0) {',
        '            return false;',
        '        }',
        '        return true;',
        '    }',
        '}'
    ].join('\n') + '\n';
    writeFileSync(handler, fixture);
    const run = (...args) => spawnSync('python3', [path.join(directory, 'install.py'), '--engine', engine, ...args], { encoding: 'utf8' });
    const dry = run();
    assert.equal(dry.status, 0, dry.stderr);
    assert.equal(readFileSync(handler, 'utf8'), fixture);
    assert.equal(existsSync(path.join(engine, 'src/engine/PortalNetwork274.mjs')), false);
    assert.notEqual(run('--apply').status, 0);
    const applied = run('--apply', '--disposable');
    assert.equal(applied.status, 0, applied.stderr);
    const updated = readFileSync(handler, 'utf8');
    assert.ok(updated.includes('handlePortalCommand274(player, cmd, args'));
    assert.ok(updated.includes('JOSHRS_PORTALS274_USERS'));
    assert.equal(run('--apply', '--disposable').status, 0);
    assert.equal(readFileSync(handler, 'utf8'), updated);
    assert.equal(readFileSync(handler + '.before-joshrs-portals274.bak', 'utf8'), fixture);
});
