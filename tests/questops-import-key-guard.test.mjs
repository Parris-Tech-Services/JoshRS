import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadContent, check } from '../tools/questops/prepack-check.mjs';

const repoTool = 'tools/questops/prepack-check.mjs';
function fixture(t, files = {}) {
    const root = mkdtempSync(join(tmpdir(), 'questops-guard-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    mkdirSync(join(root, 'scripts'), { recursive: true });
    mkdirSync(join(root, 'pack'), { recursive: true });
    for (const [file, body] of Object.entries(files)) {
        const dest = join(root, file);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, body);
    }
    return root;
}
const cli = (...args) => spawnSync(process.execPath, [repoTool, ...args], { encoding: 'utf8' });
const targetFiles = {
    'pack/loc.pack': '0=oldloc\n',
    'scripts/_unpack/274/all.loc': '[oldloc]\nname=Old\nparam=linked,newloc\n',
    'scripts/_unpack/274/all.param': '[linked]\ntype=loc\n'
};
const sourceFiles = {
    'pack/loc.pack': '0=oldloc\n1=newloc\n',
    'scripts/_unpack/377/all.loc': '[newloc]\nname=New\nmultivar=stepvar\nmultiloc=0,nextloc\n',
    'scripts/_unpack/377/all.param': '[linked]\ntype=loc\n'
};
const engineFiles = {
    'tools/pack/config/LocConfig.ts': "const stringKeys = ['name','param'];\nif (key === 'forceapproach') return 1;\n",
    'tools/pack/config/ParamConfig.ts': "const stringKeys = ['type'];\n"
};

test('detects 377-only keys in source configs scheduled for import', (t) => {
    const target = fixture(t, targetFiles);
    const source = fixture(t, sourceFiles);
    const engine = fixture(t, engineFiles);
    const result = check(loadContent(target), loadContent(source), { engineDir: engine });
    assert.equal(result.keys.length, 0);
    assert.deepEqual(result.importKeys.map((k) => k.key), ['multivar', 'multiloc']);
    assert.deepEqual(result.importKeys.map((k) => k.name), ['newloc','newloc']);
    const output = cli(target,'--source',source,'--engine',engine,'--json');
    assert.equal(output.status, 1, output.stdout+output.stderr);
    const data=JSON.parse(output.stdout);
    assert.deepEqual(data.importKeys.map((k) => k.line),[3,4]);
    assert.match(data.importKeys[0].file,/all\.loc/);
});

test('without explicit --strip-keys, --apply refuses unsupported source imports before mutation', (t) => {
    const target=fixture(t,targetFiles);
    const source=fixture(t,sourceFiles);
    const engine=fixture(t,engineFiles);
    const before=readFileSync(join(target,'pack/loc.pack'),'utf8');
    const after=cli(target,'--source',source,'--engine',engine,'--apply');
    assert.equal(after.status,2,after.stdout+after.stderr);
    assert.match(after.stderr,/BLOCKED before --apply/);
    assert.equal(readFileSync(join(target,'pack/loc.pack'),'utf8'),before);
    assert.equal(existsSync(join(target,'scripts/_ported/configs/ported.loc')),false);
});

test('--strip-keys refuses absent pristine tree before importing even portable files', (t) => {
    const target=fixture(t,targetFiles);
    const source=fixture(t,sourceFiles);
    const engine=fixture(t,engineFiles);
    const after=cli(target,'--source',source,'--engine',engine,'--apply','--strip-keys');
    assert.equal(after.status,2);
    assert.match(after.stderr,/requires valid --pristine/);
    assert.equal(existsSync(join(target,'scripts/_ported/configs/ported.loc')),false);
    assert.equal(readFileSync(join(target,'pack/loc.pack'),'utf8'),'0=oldloc\n');
});
