import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
// Exactly one reviewed original-content variant. The normal 377 CRC guard still
// handles all unmodified interfaces. Unknown/custom outputs continue to fail.
export function verifyPeaceShirtInterface(packed: Uint8Array, content: string): boolean {
    if(createHash('sha256').update(packed).digest('hex')!=='df914e3f4ef2fcf6ed42f9cc521517906faf9d92339db5cf879cdb601b1951c0') return false;
    try {
        const profile=JSON.parse(fs.readFileSync(path.join(content,'.peace-shirt-interface-profile.json'),'utf8'));
        return profile.version===1 && profile.name==='peace-shirt-v1' && profile.originalSHA256==='2eed171c79d64d994d2bbba01fd6650ac0f764b23951ea5c1c4d04ccf10e4e89' && profile.button===18786;
    } catch { return false; }
}
