import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {sourceAnchors} from '../src/two-client.mjs';

test('source-backed #377 client reference uses correct login, ISAAC framing and movement packet',()=>{
 const file=fileURLToPath(new URL('../../rs377-bot-bench/fred-george-family-client.mjs',import.meta.url));
 const source=readFileSync(file,'utf8');
 assert.match(source,/sock\.write\(Buffer\.from\(\[14, 0\]\)\)/);
 assert.match(source,/loginPayload\.writeUInt16BE\(377,/);
 assert.match(source,/sendPacket\(28, buf, true\)/);
 assert.match(source,/sendPacket\(40\)/);
 assert.match(source,/opcode \+ isaacOut\.nextInt\(\)/);
 assert.match(source,/const header = Buffer\.from\(\[16, loginPayload\.length\]\)/);
 const ref=sourceAnchors();
 assert.match(ref.javaLogin,/Client\.java/);
 assert.match(ref.movement,/MoveClickHandler\.ts/);
 assert.match(ref.friends,/ClientGameProt\.ts/);
});
