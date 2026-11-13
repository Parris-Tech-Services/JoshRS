#!/usr/bin/env node
/**
 * Persistent supervisor & 10-minute GitHub snapshot publisher for the
 * Six-Adventurer RS2 #377 No-Cheat Autonomous System (Fred, George, Barry, Larry, Gary, Rory).
 *
 * Responsibilities:
 * 1. Ensures the isolated #377 test runtime (ports 53402 / 8988 / 45199) is running
 *    without touching or restarting the live family server (ports 52402 / 8888).
 * 2. Collects immutable 10-minute snapshots produced by FredGeorgeBot.ts on UTC
 *    10-minute boundaries (:00, :10, :20, :30, :40, :50) into:
 *      reports/fred-george/snapshots/YYYY-MM-DD/YYYY-MM-DDTHH-MMZ-{Fred,George,Barry,Larry,Gary,Rory}.json
 * 3. Enforces strict redaction/privacy guards (never staging .sav, .sqlite, .env,
 *    tokens, or human coordinates).
 * 4. Commits and pushes newly completed 10-minute snapshot sets to GitHub main
 *    with bounded retry backoff.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const ISOLATED_ENGINE_DIR =
    process.env.JOSHRS_ISOLATED_ENGINE_DIR ||
    'C:\\JoshRS-Launcher\\JoshRS-main\\runtime\\jparris-377\\fred-george-isolated\\engine';
const ISOLATED_RUNTIME_ROOT = path.dirname(ISOLATED_ENGINE_DIR);
const REPO_DIR =
    process.env.JOSHRS_REPO_DIR ||
    'C:\\JoshRS-Launcher\\JoshRS-repo';
const ISOLATED_PORT = Number.parseInt(process.env.JOSHRS_ISOLATED_PORT || '53402', 10);
const REPO_SNAPSHOT_ROOT = path.join(REPO_DIR, 'reports', 'fred-george', 'snapshots');
const LIVE_STATE_PATH = path.join(ISOLATED_RUNTIME_ROOT, 'live-bot-state.json');
const FLUSH_FLAG_PATH = path.join(ISOLATED_RUNTIME_ROOT, 'flush-snapshot.flag');
const STATUS_LOG_PATH = path.join(ISOLATED_RUNTIME_ROOT, 'supervisor-status.json');

const ALL_BOTS = ['Fred', 'George', 'Barry', 'Larry', 'Gary', 'Rory'];

const FORBIDDEN_PATTERNS = [
    /ghp_[A-Za-z0-9]{20,}/,
    /github_pat_[A-Za-z0-9_]{20,}/,
    /AIza[0-9A-Za-z\-_]{20,}/,
    /BEGIN RSA PRIVATE KEY/,
    /elrothiro\.sav/i,
    /sylvie\.sav/i,
    /db\.sqlite/i,
];

function checkPortOpen(port, host = '127.0.0.1', timeoutMs = 1500) {
    return new Promise(resolve => {
        const socket = new net.Socket();
        let settled = false;
        const finish = ok => {
            if (!settled) {
                settled = true;
                socket.destroy();
                resolve(ok);
            }
        };
        socket.setTimeout(timeoutMs);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        socket.connect(port, host);
    });
}

async function ensureIsolatedServerRunning() {
    const running = await checkPortOpen(ISOLATED_PORT);
    if (running) {
        return { started: false, running: true };
    }

    const logOut = path.join(ISOLATED_ENGINE_DIR, 'isolated-stdout.log');
    const logErr = path.join(ISOLATED_ENGINE_DIR, 'isolated-stderr.log');
    const cmdLine = `cmd.exe /c "set JOSHRS_FRED_GEORGE=1&& set DEV_LUNA_BOT=false&& "${process.execPath}" --import tsx src/app.ts 1>>"${logOut}" 2>>"${logErr}""`;

    const wmiOut = execFileSync(
        'powershell.exe',
        [
            '-NoProfile',
            '-Command',
            `$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${cmdLine.replace(/'/g, "''")}'; CurrentDirectory = '${ISOLATED_ENGINE_DIR.replace(/'/g, "''")}' }; Write-Output $r.ProcessId`,
        ],
        { encoding: 'utf8' }
    ).trim();
    const pid = Number.parseInt(wmiOut, 10) || null;

    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 1000));
        if (await checkPortOpen(ISOLATED_PORT)) {
            return { started: true, running: true, pid };
        }
    }
    return { started: true, running: false, pid };
}

function getTenMinuteFloorUtc(now = new Date()) {
    const d = new Date(now.getTime());
    d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 10) * 10, 0, 0);
    return d;
}

async function ensureCurrentBoundaryFlushed() {
    const boundary = getTenMinuteFloorUtc(new Date());
    const dayFolder = boundary.toISOString().slice(0, 10);
    const stamp = boundary.toISOString().slice(0, 16).replace(':', '-') + 'Z';
    const expectedPaths = ALL_BOTS.map(b => path.join(REPO_SNAPSHOT_ROOT, dayFolder, `${stamp}-${b}.json`));

    if (expectedPaths.every(p => fs.existsSync(p))) {
        return;
    }

    if (fs.existsSync(LIVE_STATE_PATH)) {
        try {
            const state = JSON.parse(fs.readFileSync(LIVE_STATE_PATH, 'utf8'));
            if (state?.bots?.Fred?.starting_signature && state?.bots?.George?.starting_signature) {
                fs.writeFileSync(FLUSH_FLAG_PATH, boundary.toISOString(), 'utf8');
                for (let i = 0; i < 10; i++) {
                    await new Promise(r => setTimeout(r, 1000));
                    if (expectedPaths.slice(0, 2).every(p => fs.existsSync(p))) {
                        return;
                    }
                }
            }
        } catch {
            // ignore
        }
    }
}

function validateSnapshotSafe(filePath) {
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const pat of FORBIDDEN_PATTERNS) {
        if (pat.test(raw)) {
            throw new Error(`Redaction guard blocked ${filePath}: matched forbidden pattern ${pat}`);
        }
    }
    const parsed = JSON.parse(raw);
    if (parsed.schema !== 'joshrs-ab-ten-minute-v1') {
        throw new Error(`Invalid schema in ${filePath}: ${parsed.schema}`);
    }
    if (!ALL_BOTS.includes(parsed.bot)) {
        throw new Error(`Unexpected bot name in ${filePath}: ${parsed.bot}`);
    }
    return parsed;
}

function runGit(args) {
    return execFileSync('git', args, {
        cwd: REPO_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
}

function findUncommittedSnapshots() {
    if (!fs.existsSync(REPO_SNAPSHOT_ROOT)) {
        return [];
    }
    const statusOut = runGit(['status', '--porcelain', '-uall', 'reports/fred-george/snapshots']);
    if (!statusOut) {
        return [];
    }
    const found = [];
    for (const line of statusOut.split(/\r?\n/).filter(Boolean)) {
        const relPath = line.slice(3).trim().replace(/\\/g, '/');
        if (!relPath.startsWith('reports/fred-george/snapshots/') || !relPath.endsWith('.json')) {
            continue;
        }
        const absPath = path.join(REPO_DIR, relPath);
        if (!fs.existsSync(absPath)) continue;
        validateSnapshotSafe(absPath);
        found.push({
            fileName: path.basename(absPath),
            relPath,
        });
    }
    return found;
}

async function commitAndPushSnapshots(snapshots) {
    if (snapshots.length === 0) {
        return { pushed: false, reason: 'no-new-snapshots' };
    }

    for (const item of snapshots) {
        runGit(['add', item.relPath]);
    }

    const staged = runGit(['diff', '--cached', '--name-only'])
        .split(/\r?\n/)
        .filter(Boolean);
    if (staged.length === 0) {
        return { pushed: false, reason: 'nothing-staged' };
    }

    for (const f of staged) {
        if (!f.startsWith('reports/fred-george/snapshots/') || !f.endsWith('.json')) {
            throw new Error(`Refusing to commit non-snapshot file in automated monitor: ${f}`);
        }
    }

    const latestStamp = snapshots[snapshots.length - 1].fileName.replace(/-(Fred|George|Barry|Larry|Gary|Rory)\.json$/, '');
    const commitMsg = `bot-data: Autonomous Adventurers UTC ${latestStamp}`;
    runGit(['commit', '-m', commitMsg]);

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            runGit(['pull', '--rebase', 'origin', 'main']);
            runGit(['push', 'origin', 'main']);
            return { pushed: true, commitMsg, files: staged };
        } catch (err) {
            if (attempt === 3) {
                throw err;
            }
            await new Promise(r => setTimeout(r, attempt * 2000));
        }
    }
    return { pushed: false, reason: 'exhausted-retries' };
}

async function runOnce(shouldPush) {
    const serverStatus = await ensureIsolatedServerRunning();
    await ensureCurrentBoundaryFlushed();
    const pending = findUncommittedSnapshots();
    let gitResult = { pushed: false, reason: shouldPush ? 'no-new-snapshots' : 'push-disabled' };
    if (shouldPush && pending.length > 0) {
        gitResult = await commitAndPushSnapshots(pending);
    }

    const status = {
        timestamp_utc: new Date().toISOString(),
        isolated_server: serverStatus,
        pending_snapshots: pending.map(c => c.relPath),
        git: gitResult,
    };
    fs.mkdirSync(path.dirname(STATUS_LOG_PATH), { recursive: true });
    fs.writeFileSync(STATUS_LOG_PATH, JSON.stringify(status, null, 2), 'utf8');
    console.log(JSON.stringify(status, null, 2));
}

async function main() {
    const shouldPush = !process.argv.includes('--no-push');
    const isLoop = process.argv.includes('--loop');
    await runOnce(shouldPush);
    if (isLoop) {
        setInterval(() => {
            runOnce(shouldPush).catch(err => {
                console.error('[FredGeorgeSupervisor Loop Error]', err);
            });
        }, 60 * 1000);
    }
}

main().catch(err => {
    console.error('[FredGeorgeSupervisor Error]', err);
    process.exitCode = 1;
});
