#!/usr/bin/env node
// Regenerate the Kotlin revision-377 opcode enums from the pinned MIT engine.
//
// Usage:  node tools/android377-phone/generate-prot-tables.mjs <engine-checkout> [android-client-dir]
//
// Reads src/network/game/{client/ClientGameProt,server/ServerGameProt}.ts and
// writes ClientProt.kt / ServerProt.kt. The generated files are committed so the
// Android build does not depend on the engine checkout being present.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const engine = process.argv[2];
const out = process.argv[3] ?? 'android-client/app/src/main/java/au/com/parristech/joshrs/android/protocol';
if (!engine) {
    console.error('usage: generate-prot-tables.mjs <engine-checkout> [android-client-dir]');
    process.exit(2);
}

function parseTs(file) {
    const text = readFileSync(join(engine, file), 'utf8');
    const re = /static readonly (\w+) = new (?:Client|Server)GameProt\((\d+), (-?\d+)\)/g;
    const items = [];
    let m;
    while ((m = re.exec(text))) items.push({ name: m[1], id: Number(m[2]), len: Number(m[3]) });
    return items;
}

function emit(file, enumName, side, srcPath) {
    const items = parseTs(srcPath);
    const seen = new Set();
    const lines = items.map((it) => {
        if (seen.has(it.name)) throw new Error(`duplicate opcode name ${it.name}`);
        seen.add(it.name);
        return `    ${it.name}(${it.id}, ${it.len}),`;
    });
    const body = `package au.com.parristech.joshrs.android.protocol

/**
 * Revision-377 ${side}-bound opcode table, generated verbatim from
 * \`LostCityRS/Engine-TS\` ${srcPath} (MIT License,
 * Copyright (c) 2023-2026 Lost City).
 *
 * \`length\` semantics: >= 0 is a fixed byte count, -1 means a 1-byte length
 * prefix follows the opcode, -2 means a 2-byte length prefix.
 *
 * Generated file — regenerate with tools/android377-phone/generate-prot-tables.mjs.
 */
enum class ${enumName}(override val id: Int, override val length: Int) : Prot {
${lines.join('\n')}
    ;

    companion object {
        private val BY_ID: Map<Int, ${enumName}> = entries.associateBy { it.id }

        fun byId(id: Int): ${enumName}? = BY_ID[id]
    }
}
`;
    writeFileSync(join(out, `${file}.kt`), body);
    console.log(`${file}.kt: ${items.length} opcodes`);
}

emit('ClientProt', 'ClientProt', 'client', 'src/network/game/client/ClientGameProt.ts');
emit('ServerProt', 'ServerProt', 'server', 'src/network/game/server/ServerGameProt.ts');
