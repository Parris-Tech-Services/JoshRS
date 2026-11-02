import { readFileSync } from 'fs';

// Read-only parser for jimmy.sav (never writes or touches any other save file)
const savBuf = readFileSync('/home/josh/dev/JoshRS-source/rs-sdk/server/engine/data/players/main/jimmy.sav');
const varpSym = readFileSync('/home/josh/dev/JoshRS-source/rs-sdk/server/engine/data/symbols/varp.sym', 'utf8');
const varpNames = new Map<number, string>();
for (const line of varpSym.split('\n')) {
  const parts = line.trim().split('\t');
  if (parts.length >= 2) varpNames.set(Number(parts[0]), parts[1]!);
}

let pos = 0;
const g1 = () => savBuf[pos++]!;
const g2 = () => ((savBuf[pos++]! << 8) | savBuf[pos++]!) >>> 0;
const g4s = () => (savBuf[pos++]! << 24) | (savBuf[pos++]! << 16) | (savBuf[pos++]! << 8) | savBuf[pos++]!;
const gVarInt = () => {
  let byte = g1();
  let result = 0;
  while ((byte & 0x80) !== 0) {
    result = (result | (byte & 0x7f)) << 7;
    byte = g1();
  }
  return (result | byte) | 0;
};

const magic = g2();
const version = g2();
const x = g2();
const z = g2();
const level = g1();
pos += 7 + 5 + 1 + 2; // body(7), colors(5), gender(1), runenergy(2)
const playtime = version >= 2 ? g4s() : g2();
const stats: Array<{ idx: number; xp: number; level: number }> = [];
for (let i = 0; i < 21; i++) {
  const xp = g4s();
  const lvl = g1();
  stats.push({ idx: i, xp, level: lvl });
}
const varpCount = g2();
const nonZeroVarps: Record<string, { id: number; value: number }> = {};
for (let i = 0; i < varpCount; i++) {
  const id = version >= 7 ? g2() : i;
  const val = version >= 7 ? gVarInt() : g4s();
  if (val !== 0) {
    const name = varpNames.get(id) ?? `varp_${id}`;
    nonZeroVarps[name] = { id, value: val };
  }
}

console.log(JSON.stringify({ magic, version, x, z, level, playtime, nonZeroVarps }, null, 2));
