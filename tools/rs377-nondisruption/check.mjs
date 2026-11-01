#!/usr/bin/env node
/**
 * JoshRS task 39: read-only production non-disruption gate.
 * No network calls, logins, account-db/save reads, file writes, or process actions.
 * The result is NOT restart authorisation, even if all observations are healthy.
 */
import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROTECTED_ACCOUNTS = Object.freeze(['elrothiro', 'sylvie', 'luna']);
export const SERVICE_PORTS = Object.freeze([52402, 8888, 43500, 45099, 43501]);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function regularFile(p) {
  try { const s = lstatSync(p); return s.isFile() && !s.isSymbolicLink(); }
  catch { return false; }
}
function directory(p) {
  try { const s = lstatSync(p); return s.isDirectory() && !s.isSymbolicLink(); }
  catch { return false; }
}
function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8', timeout: 3500, maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'], shell: false
  });
  return result.error || result.status !== 0 ? null : String(result.stdout || '');
}
function fromPowerShell() {
  // Static, read-only CIM/socket queries. Raw command lines/addresses never returned to caller.
  const cmd = `try { $p=Get-CimInstance Win32_Process -ErrorAction Stop | Select-Object ProcessId,Name,CommandLine; $n=Get-NetTCPConnection -ErrorAction Stop | Where-Object { $_.LocalPort -in @(52402,8888,43500,45099,43501) -or $_.RemotePort -eq 52402 } | Select-Object LocalPort,RemotePort,State,OwningProcess; @{ processes=@($p); sockets=@($n) } | ConvertTo-Json -Depth 4 -Compress } catch { exit 2 }`;
  const raw = run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd]);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return { processes: parsed.processes.map(p => ({ pid: Number(p.ProcessId), command: String(p.CommandLine || ''), name: String(p.Name || '') })),
      sockets: parsed.sockets.map(s => ({ local: Number(s.LocalPort), remote: Number(s.RemotePort), state: String(s.State || ''), pid: Number(s.OwningProcess) })) };
  } catch { return null; }
}
function fromLinux() {
  const proc = run('ps', ['-eo', 'pid=,comm=,args=']);
  const listen = run('ss', ['-H', '-ltnp']);
  const established = run('ss', ['-H', '-tnp', 'state', 'established']);
  if (proc === null || listen === null || established === null) return null;
  const processes = proc.split(/\r?\n/).map(s => s.trim().match(/^(\d+)\s+(\S+)\s+(.*)$/)).filter(Boolean)
    .map(m => ({ pid: Number(m[1]), name: m[2], command: m[3] }));
  const sockets = [];
  for (const [data, state] of [[listen, 'LISTEN'], [established, 'ESTABLISHED']]) {
    for (const line of data.split(/\r?\n/)) {
      const fields = line.trim().split(/\s+/);
      if (fields.length < 5) continue;
      const local = Number(fields[3].match(/:(\d+)$/)?.[1]);
      const remote = Number(fields[4].match(/:(\d+)$/)?.[1]);
      if (!Number.isInteger(local) || local < 1) continue;
      if (!SERVICE_PORTS.includes(local) && remote !== 52402) continue;
      sockets.push({ local, remote, state, pid: Number(line.match(/pid=(\d+)/)?.[1]) || null });
    }
  }
  return { processes, sockets };
}
export function classifyProcesses(processes) {
  // Never print command lines: they can contain credentials and private file paths.
  const counts = { agyOrCodex: 0, gameCandidates: 0, botWorkers: 0, otherNode: 0 };
  for (const p of processes) {
    const cmd = String(p.command || '').toLowerCase();
    const name = String(p.name || '').toLowerCase();
    if (/\b(agy|claude|codex)\b/.test(cmd) || /\b(agy|claude|codex)\b/.test(name)) counts.agyOrCodex++;
    if (/src[/\\]app\.ts|quickstart/.test(cmd)) counts.gameCandidates++;
    if (/fred.george|controller.boundary|rs377.agent|rs.sdk|companion|bot.worker/.test(cmd)) counts.botWorkers++;
    if (name.startsWith('node') && !/src[/\\]app\.ts|quickstart/.test(cmd)) counts.otherNode++;
  }
  return counts;
}
export function assess(evidence) {
  const blockers = [];
  const add = reason => blockers.push(reason);
  if (evidence.source !== 'local-read-only') add('Runtime evidence is not an observed local host inspection');
  if (!evidence.engineKnown) add('Authoritative world/engine path not confirmed');
  if (!evidence.socketInspection) add('Active sessions and listener ownership unknown');
  if (!evidence.processInspection) add('Agy and game worker process ownership unknown');
  if (evidence.activeGameSockets > 0) add('Active game TCP connections: do not interrupt players');
  if (evidence.activeGameSockets === null) add('Cannot establish absence of active game sockets');
  if (evidence.processes.agyOrCodex > 0 || evidence.processes.botWorkers > 0)
    add('Existing Agy/agent or bot workers detected: preserve their sessions');
  if (evidence.processes.gameCandidates > 0) add('Game process detected: never force-terminate or duplicate-start');
  for (const user of PROTECTED_ACCOUNTS) {
    if (evidence.saves[user] !== 'present') add('Protected '+user+' save not verified present');
  }
  if (evidence.database !== 'present') add('Account database metadata not verified');
  if (evidence.backup !== 'present') add('Existing cold/consistent backup not independently verified');
  // No absent TCP connection can establish a particular family account logged off.
  add('Elrothiro/Sylvie/Luna session inactivity and explicit owner approval require manual verification');
  add('No unattended production restart, reset, deployment, account change or restore authorised');
  return { verdict: 'BLOCKED_UNATTENDED_PRODUCTION_CHANGE', blocked: true,
    observed: evidence.source === 'local-read-only', blockers,
    safeNextStep: 'Read the rollback runbook; arrange supervised, explicitly approved maintenance after all players log out.' };
}
function fileInventory(engine) {
  const saves = Object.fromEntries(PROTECTED_ACCOUNTS.map(name => [name, 'unknown']));
  const players = path.join(engine, 'data', 'players', 'main');
  if (directory(players)) {
    const names = readdirSync(players, { withFileTypes: true });
    for (const user of PROTECTED_ACCOUNTS) {
      saves[user] = names.some(f => f.name.toLowerCase() === `${user}.sav` && f.isFile() && regularFile(path.join(players, f.name))) ? 'present' : 'missing';
    }
  }
  const database = regularFile(path.join(engine, 'db.sqlite')) ? 'present' : 'missing';
  return { saves, database };
}
export function inspect({ root = ROOT, engine = null, platform = process.platform, systemSnapshot = null } = {}) {
  const repo = path.resolve(root);
  let activeEngine = engine;
  if (!activeEngine) {
    const active = path.join(repo, 'runtime', 'jparris-377', 'active.json');
    if (regularFile(active)) {
      try { const obj = JSON.parse(readFileSync(active, 'utf8'));
        if (typeof obj.engine === 'string' && path.isAbsolute(obj.engine)) activeEngine = obj.engine;
      } catch { /* unreadable active-state: fail closed */ }
    }
  }
  const engineKnown = !!activeEngine && path.isAbsolute(activeEngine) && directory(activeEngine);
  const { saves, database } = engineKnown ? fileInventory(activeEngine) : {
    saves: Object.fromEntries(PROTECTED_ACCOUNTS.map(name => [name, 'unknown'])), database: 'unknown'
  };
  // Copying a live SQLite DB is not a verified consistent/cold backup.
  const backup = 'unverified';
  const evidence = systemSnapshot || (platform === 'win32' ? fromPowerShell() : platform === 'linux' ? fromLinux() : null);
  const processes = evidence ? classifyProcesses(evidence.processes) : {agyOrCodex:null,gameCandidates:null,botWorkers:null,otherNode:null};
  const sockets = evidence?.sockets || [];
  const activeGameSockets = evidence ? sockets.filter(s => String(s.state).toUpperCase().startsWith('ESTAB') &&
    (s.local === 52402 || s.remote === 52402)).length : null;
  const listeners = Object.fromEntries(SERVICE_PORTS.map(port => [String(port), evidence ? sockets.some(s => s.local === port && String(s.state).toUpperCase().startsWith('LISTEN')) : null]));
  const report = { schema:1, tool:'JoshRS 377 non-disruption check', source:'local-read-only',
    platform, engineKnown, saves, database, backup, socketInspection:!!evidence,
    processInspection:!!evidence, activeGameSockets, listeners, processes,
    note:'Read-only, no world identity or player logout proved; no private save or database content read.' };
  return { ...report, decision: assess(report) };
}
function parse(argv) {
  let root = ROOT, engine = null, json = false;
  for (let i=0; i<argv.length; i++) {
    if (argv[i] === '--root' && argv[i+1]) root = argv[++i];
    else if (argv[i] === '--engine' && argv[i+1]) engine = argv[++i];
    else if (argv[i] === '--json') json = true;
    else if (argv[i] === '--help') return { help:true };
    else throw Error('Unsupported option; no unsafe override exists');
  }
  return { root, engine, json };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parse(process.argv.slice(2));
    if (options.help) process.stdout.write('node tools/rs377-nondisruption/check.mjs [--root REPO] [--engine ENGINE] [--json]\nRead-only and ALWAYS blocks unattended production changes. Never restarts a service.\n');
    else {
      const report = inspect(options);
      process.stdout.write(options.json ? JSON.stringify(report,null,2)+'\n' :
        `JoshRS non-disruption: ${report.decision.verdict}\nProtected saves: ${JSON.stringify(report.saves)}\n`+
        `Database metadata: ${report.database}; backup: ${report.backup}\n`+
        `Active game sockets: ${report.activeGameSockets??'UNKNOWN'}; Agy workers: ${report.processes.agyOrCodex??'UNKNOWN'}; bot workers: ${report.processes.botWorkers??'UNKNOWN'}\n`+
        `Listeners: ${JSON.stringify(report.listeners)}\n`+
        report.decision.blockers.map(b=>'- '+b).join('\n')+'\n');
      process.exitCode = 2; // refuse if invoked as a gate in a deployment/restart job
    }
  } catch (err) { process.stderr.write('BLOCKED: read-only preflight failed: '+err.message+'\n'); process.exitCode = 2; }
}
