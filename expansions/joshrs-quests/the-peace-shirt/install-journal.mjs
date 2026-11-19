import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const marker = '// JoshRS Peace Shirt journal entry';
const hook = `${marker}\ndef_int $journal = ~p_choice2("Talk to Radu.", 1, "Read The Peace Shirt journal.", 2);\nif ($journal = 2) {\n    ~joshrs_peace_shirt_journal;\n    return;\n}\n`;
export function patchRadu(text) {
    if (text.includes(marker)) return text;
    const header = '[opnpc1,burgh_vilager_3]';
    if (text.split(header).length !== 2 || !text.includes('@joshrs_peace_shirt_radu;')) throw new Error('Unexpected Radu script; install the base quest first.');
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    return text.replace(header + nl, header + nl + hook.replaceAll('\n', nl));
}
export function installJournal(content, { apply = false, launcherRoot = 'C:\\JoshRS-Launcher\\JoshRS-main' } = {}) {
    const root = fs.realpathSync(content);
    const state = path.join(launcherRoot, 'runtime/jparris-377/active.json');
    if (fs.existsSync(state)) {
        const active = JSON.parse(fs.readFileSync(state, 'utf8').trimStart());
        if (fs.realpathSync(active.content).toLowerCase() === root.toLowerCase()) throw new Error('Refusing the active family world. Test a separate content copy.');
    }
    const scripts = path.join(root, 'scripts');
    const dir = path.join(scripts, 'joshrs_original/scripts');
    const quest = path.join(dir, 'quest_peace_shirt.rs2');
    if (!fs.existsSync(quest)) throw new Error('Base Peace Shirt quest is missing.');
    const changes = [
        [path.join(dir, 'burgh_vilager_3.rs2'), null],
        [path.join(dir, 'peace_shirt_journal.rs2'), fs.readFileSync(path.join(here, 'scripts/peace_shirt_journal.rs2'), 'utf8')]
    ];
    changes[0][1] = patchRadu(fs.readFileSync(changes[0][0], 'utf8'));
    // Preflight every destination before any write; retain exact previous bytes for rollback.
    const entries = changes.map(([file, text]) => ({ file, text, before: fs.existsSync(file) ? fs.readFileSync(file) : null }))
        .filter(e => !e.before || !e.before.equals(Buffer.from(e.text)));
    const plan = { dryRun: !apply, files: entries.map(e => path.relative(root, e.file)) };
    if (!apply || !entries.length) return plan;
    const backup = path.join(root, '.peace-shirt-journal-backups', new Date().toISOString().replace(/[:.]/g, '-') + '-' + process.pid);
    fs.mkdirSync(backup, { recursive: true });
    const manifest = entries.map((e, i) => {
        if (e.before) fs.writeFileSync(path.join(backup, String(i)), e.before, { flag: 'wx' });
        return { file: path.relative(root, e.file), backup: e.before ? String(i) : null, sha256: createHash('sha256').update(e.text).digest('hex') };
    });
    fs.writeFileSync(path.join(backup, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
    try { for (const e of entries) fs.writeFileSync(e.file, e.text); }
    catch (error) {
        for (const e of entries) { if (e.before) fs.writeFileSync(e.file, e.before); else if (fs.existsSync(e.file)) fs.unlinkSync(e.file); }
        throw error;
    }
    return { ...plan, backup };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        const i = process.argv.indexOf('--content');
        if (i < 0 || !process.argv[i + 1]) throw new Error('Provide --content <disposable content path> [--apply]');
        console.log(JSON.stringify(installJournal(process.argv[i + 1], { apply: process.argv.includes('--apply') }), null, 2));
    } catch (error) { console.error(error.message); process.exitCode = 1; }
}
