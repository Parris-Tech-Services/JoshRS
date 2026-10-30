#!/usr/bin/env node
/**
 * Applies the JoshRS one-bot integration to an EXISTING LostCity 377-wip
 * Engine-TS checkout. Dry-run by default. Opt-in with --apply.
 *
 * Never edits game content, account databases, existing player saves or .env.
 * It refuses unknown or partially patched source and backs up every touched
 * source file before writing.
 */
import { readFileSync, existsSync, mkdirSync, copyFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const inputs = argv.filter(a => a !== '--apply');
if (inputs.length !== 1 || inputs[0].startsWith('--')) {
  console.error('Usage: node scripts/install-lostcity377-woodcutter.mjs /absolute/path/to/engine [--apply]');
  process.exit(2);
}
const root = resolve(inputs[0]);
const source = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'deploy', 'lostcity377', 'bots', 'WoodcutterBot.ts');
const dest = join(root, 'src/engine/bot/WoodcutterBot.ts');
const envGuard = 'JOSHRS_WOODCUTTER';
const changes = [
  {
    file: 'src/app.ts',
    patterns: [
      ["import World from '#/engine/World.js';", "import World from '#/engine/World.js';\nimport { spawnWoodcutterBot } from '#/engine/bot/WoodcutterBot.js';"],
      ["await World.start();", "await World.start();\nspawnWoodcutterBot(World);"]
    ]
  },
  {
    file: 'src/engine/World.ts',
    patterns: [
      ["import { PlayerStat } from '#/engine/entity/PlayerStat.js';", "import { PlayerStat } from '#/engine/entity/PlayerStat.js';\nimport { isWoodcutterBot, tickWoodcutterBot } from '#/engine/bot/WoodcutterBot.js';"],
      ["            this.processPlayers();", "            tickWoodcutterBot(this);\n            this.processPlayers();"],
      ["    private savePlayers(): void {\n        for (const player of this.playerLoop.all()) {", "    private savePlayers(): void {\n        for (const player of this.playerLoop.all()) {\n            if (isWoodcutterBot(player)) continue; // ephemeral synthetic player; never overwrite an account save"],
      ["        this.flushPlayer(player);", "        if (!isWoodcutterBot(player)) this.flushPlayer(player); // no login-thread account for the bot"]
    ]
  }
];

if (!existsSync(join(root, 'src/app.ts')) || !existsSync(join(root, 'src/engine/World.ts')) ||
    !existsSync(join(root, 'src/engine/entity/PlayerLoading.ts')) || !existsSync(join(root, 'package.json'))) {
  throw new Error('Not a supported Lost City Engine-TS checkout: '+root);
}
let branch = '';
try {
  branch = execFileSync('git', ['-C', root, 'branch', '--show-current'], {encoding:'utf8'}).trim();
} catch { throw new Error('Expected a Git checkout of LostCityRS/Engine-TS, branch 377-wip.'); }
if (branch !== '377-wip') {
  throw new Error('Refusing to patch branch '+JSON.stringify(branch)+'. Expected 377-wip. Use a separate 377-wip checkout.');
}
const candidate = [];
for (const entry of changes) {
  const path = join(root,entry.file);
  const initial = readFileSync(path, 'utf8');
  let next = initial;
  for (const [oldText, newText] of entry.patterns) {
    if (next.includes(newText)) {
      throw new Error('Already patched or partly patched: '+entry.file+'. No files changed.');
    }
    if (next.split(oldText).length !== 2) {
      throw new Error('Unknown upstream source: cannot uniquely identify patch anchor in '+entry.file+'. No files changed.');
    }
    next = next.replace(oldText,newText);
  }
  candidate.push({path,relative:entry.file,original:initial,next});
}
if (existsSync(dest)) throw new Error('Bot destination already exists; refusing to overwrite '+dest);
const bot = readFileSync(source, 'utf8');
if (!bot.includes(envGuard)) throw new Error('Bot source missing required opt-in gate');
console.log('VALIDATED: revision 377-wip source anchors; '+changes.length+' existing files and 1 new file.');
console.log('Bot will remain OFF unless JOSHRS_WOODCUTTER=1 is set when starting the server.');
if (!apply) {
  console.log('DRY RUN ONLY. Nothing changed. Repeat the command with --apply to install.');
  process.exit(0);
}
const backupRoot = join(root,'.joshrs-bot-backups',new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(backupRoot,{recursive:true});
for (const item of candidate) {
  const backup = join(backupRoot,item.relative);
  mkdirSync(dirname(backup),{recursive:true});
  copyFileSync(item.path,backup);
}
const changesWritten = [];
try {
  for(const item of candidate) {
    const tmp = item.path+'.joshrs-new';
    writeFileSync(tmp,item.next,{flag:'wx'});
    renameSync(tmp,item.path);
    changesWritten.push(item);
  }
  mkdirSync(dirname(dest),{recursive:true});
  writeFileSync(dest,bot,{flag:'wx'});
} catch(e) {
  for(const item of changesWritten.reverse()) writeFileSync(item.path,item.original);
  console.error('Automatic rollback restored the touched source files; confirm any .joshrs-new files before retrying.');
  throw e;
}
console.log('INSTALLED, NOT STARTED. Source backups: '+backupRoot);
console.log('Validate before restarting: cd '+root+' && npx tsc --noEmit');
console.log('Enable at your next planned server restart: JOSHRS_WOODCUTTER=1 npm run quickstart');
console.log('To disable again, omit the environment variable and restart. This bot does not persist its character.');
