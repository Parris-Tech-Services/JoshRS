#!/usr/bin/env node
// Patch a disposable rev377 Content clone only. NEVER edit the active family game.
//
// Issue #52: partyroom_tempinv is the per-player "offer" behind the Party Drop
// Chest. It defaulted to scope=temp, which is not written to the player save.
// If the backpack was full when the chest closed, moveallinv could not return
// the offer, and the next logout/relogin destroyed it. Making the 8-slot offer
// inventory scope=perm keeps the unreturned items in the player save so the
// player can recover them the next time the chest is opened.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const liveRoot = path.join('runtime', 'jparris-377');

export function patchText(source) {
    const start = source.indexOf('[partyroom_tempinv]');
    if (start < 0) throw new Error('Missing [partyroom_tempinv] section.');
    const after = source.indexOf('\n[', start + 1);
    const end = after < 0 ? source.length : after;
    const body = source.slice(start, end);
    if (!/^size=8\s*$/m.test(body)) throw new Error('Unexpected partyroom_tempinv size; refusing to patch.');
    if (/^scope=perm\s*$/m.test(body)) throw new Error('partyroom_tempinv is already scope=perm.');
    let nextBody;
    if (/^scope=\w+\s*$/m.test(body)) {
        nextBody = body.replace(/^scope=\w+\s*$/m, 'scope=perm');
    } else {
        nextBody = body.replace(/^size=8\s*$/m, 'size=8\nscope=perm');
    }
    return source.slice(0, start) + nextBody + source.slice(end);
}

export function inspectTarget(repoRoot, contentRoot, apply = false) {
    const repo = fs.realpathSync(repoRoot);
    const content = fs.realpathSync(contentRoot);
    const normal = s => path.resolve(s).replaceAll('/', '\\').toLowerCase();
    const live = normal(path.join(repo, liveRoot));
    if (normal(content) === live || normal(content).startsWith(live + '\\')) {
        throw new Error('REFUSED: content under active runtime/jparris-377.');
    }
    const stateFile = path.join(repo, liveRoot, 'active.json');
    if (fs.existsSync(stateFile)) {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8').trimStart());
        if (typeof state.content === 'string' && normal(content) === normal(state.content)) {
            throw new Error('REFUSED: active.json points to this content.');
        }
    }
    const file = path.join(content, 'scripts', '_unpack', '727', 'all.inv');
    const oldText = fs.readFileSync(file, 'utf8');
    const next = patchText(oldText);
    if (apply) {
        const backup = file + '.joshrs-partychest.original';
        fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
        const temp = file + '.joshrs-partychest.tmp';
        try {
            fs.writeFileSync(temp, next, { flag: 'wx' });
            fs.renameSync(temp, file);
        } catch (err) {
            if (fs.existsSync(temp)) fs.rmSync(temp);
            throw err;
        }
    }
    return { dryRun: !apply, target: file, addedBytes: Buffer.byteLength(next) - Buffer.byteLength(oldText) };
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
    try {
        const args = process.argv.slice(2);
        const val = key => {
            const i = args.indexOf(key);
            return i >= 0 ? args[i + 1] : null;
        };
        if (!val('--content')) throw new Error('Provide --content PATH of a disposable 377 Content clone');
        const root = val('--repo') ?? path.resolve(path.dirname(thisFile), '../..');
        const result = inspectTarget(root, val('--content'), args.includes('--apply'));
        console.log(JSON.stringify(result, null, 2));
        console.log(result.dryRun ? 'DRY RUN: no files changed.' : 'Isolated clone patched. Build and playtest before deploying.');
        console.log('partyroom_tempinv now persists unreturned accepted-later offers; shared chest remains scope=shared.');
    } catch (err) {
        console.error('BLOCKED: ' + err.message);
        process.exitCode = 1;
    }
}
