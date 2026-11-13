#!/usr/bin/env node
// Adds server-only lines (category=, param=) to existing config blocks in the 377 content.
//   node apply-config-additions.mjs --content <content dir> --spec <json>           dry run
//   node apply-config-additions.mjs --content <content dir> --spec <json> --apply   apply (keeps a .nih.original copy)
// Refuses the active family world unless --allow-active is given for an approved, backed-up, offline install.
// Idempotent: a line already present in the block is skipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// True for the live JoshRS world: anything under runtime/jparris-377, or the content named by any active.json found above it.
export function isActiveWorld(dir) {
    const norm = d => path.resolve(d).split(path.sep).join('/').toLowerCase();
    const n = norm(dir);
    if (n.includes('/runtime/jparris-377/')) return true;
    for (const root of ['C:/JoshRS-Launcher/JoshRS-main']) {
        try {
            const s = JSON.parse(fs.readFileSync(path.join(root, 'runtime', 'jparris-377', 'active.json'), 'utf8'));
            for (const v of Object.values(s)) if (typeof v === 'string' && v.length > 3 && (n + '/').startsWith(norm(v) + '/')) return true;
        } catch { /* no live install on this machine */ }
    }
    return false;
}

export function plan(text, add) {
    const lines = text.split(/\r?\n/);
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const changes = [];
    const missing = new Set(Object.keys(add));
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        out.push(lines[i]);
        const m = /^\[([^\]]+)\]$/.exec(lines[i]);
        if (!m || !add[m[1]]) continue;
        missing.delete(m[1]);
        let j = i + 1;
        const block = [];
        while (j < lines.length && !/^\[/.test(lines[j]) && lines[j].trim() !== '') block.push(lines[j++]);
        for (const l of block) out.push(l);
        for (const l of add[m[1]]) {
            const key = l.slice(0, l.indexOf('=') + 1);
            if (block.includes(l)) continue;
            if (key === 'category=' && block.some(b => b.startsWith('category='))) throw new Error(`${m[1]} already has a different category`);
            out.push(l); changes.push(`${m[1]}: +${l}`);
        }
        i = j - 1;
    }
    if (missing.size) throw new Error(`config blocks not found: ${[...missing].join(', ')}`);
    return { text: out.join(eol), changes };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const val = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
    const content = val('--content'), specPath = val('--spec');
    if (!content || !specPath) throw new Error('Provide --content <dir> --spec <json>');
    const abs = path.resolve(content);
    if (isActiveWorld(abs) && !args.includes('--allow-active')) throw new Error('REFUSED: this is the active family world. Use --allow-active only for an approved offline install after a verified backup.');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    const file = path.join(abs, spec.file);
    const { text, changes } = plan(fs.readFileSync(file, 'utf8'), spec.add);
    console.log(changes.join('\n') || 'nothing to change');
    if (!args.includes('--apply')) { console.log('DRY RUN: nothing changed.'); process.exit(0); }
    if (changes.length) {
        if (!fs.existsSync(file + '.nih.original')) fs.copyFileSync(file, file + '.nih.original');
        fs.writeFileSync(file, text);
    }
    console.log(`Applied ${changes.length} line(s) to ${spec.file}.`);
}
