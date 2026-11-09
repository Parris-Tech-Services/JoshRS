import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const decision='docs/decisions/2026-11-08-private-rune-parity-and-risk.md';
const read=p=>readFileSync(path.join(root,p),'utf8');

test('owner decision clearly records authentic private family fidelity goal',()=>{
  const s=read(decision);
  for(const essential of [
    '8 November 2026', 'maximal legal risk', 'private, offline-first',
    'OSRS', 'RS3', 'Jagex-authored', 'dialogue', 'original/inspired-by substitutes',
    'NOT a signed indemnity', 'not a statement that all content has been implemented'
  ]) assert.ok(s.toLowerCase().includes(essential.toLowerCase()),'Missing owner decision phrase: '+essential);
});

test('risk acceptance cannot be mistaken for legal authorisation or a release',()=>{
  const s=read(decision);
  for(const phrase of [
    'not a signed indemnity', 'copyright licence', 'legal defence',
    'release of Jagex', 'public repository', 'legal and distribution boundary'
  ]) assert.ok(s.toLowerCase().includes(phrase.toLowerCase()),'Missing legal boundary: '+phrase);
});

test('key agents, public and private roadmap docs point to authoritative ADR',()=>{
  const references=[
    'README.md','AGENTS.md',
    'docs/REFERENCE_VERSION_274.md','docs/FULL_CLASSIC_MMO_CHECKLIST.md',
    'docs/JOSHRS_PROJECT_WIDE_MASTER_BACKLOG_2026-11-02.md',
    'docs/377_CONTENT_FACTORY.md',
    'research/parity/RESEARCH_FINDINGS_2026-11-08.md',
    'research/parity/roadmap/README.md',
    'research/parity/roadmap/EXECUTIVE_ASSESSMENT.md',
    'research/parity/roadmap/ARCHITECTURE_OPTIONS.md',
    'research/parity/roadmap/CONTENT_RIGHTS_REGISTER.md'
  ];
  for(const p of references)
    assert.ok(read(p).includes('2026-11-08-private-rune-parity-and-risk.md'),
      'Missing owner-ADR reference in '+p);
});

test('all relative project file links inside the owner decision resolve locally',()=>{
  const s=read(decision);
  const base=path.dirname(path.join(root,decision));
  const links=[...s.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(m=>m[1]);
  assert.ok(links.length>=7,'Decision must link existing project documents');
  for(const link of links){
    if(/^https?:\/\//.test(link))continue;
    const target=path.resolve(base,decodeURIComponent(link));
    assert.ok(target.startsWith(root+path.sep),'Link escapes repository: '+link);
    assert.ok(existsSync(target),'Broken owner decision link: '+link);
  }
});
