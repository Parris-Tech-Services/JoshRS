import fs from 'fs';
import net from 'net';
import path from 'path';
import { Worker } from 'worker_threads';

import { collectDefaultMetrics, register } from 'prom-client';

import { packAll } from '#tools/pack/PackAll.js';
import World from '#/engine/World.js';
import '#/engine/entity/BotPlayer.js';
import TcpServer from '#/server/tcp/TcpServer.js';
import Environment from '#/util/Environment.js';
import { printError, printInfo } from '#/util/Logger.js';
import { startManagementWeb, startWeb } from '#/web.js';
import OnDemand from '#/engine/OnDemand.js';

const lockPath = path.resolve(`data/.josh-rs-377-${Environment.NODE_PROFILE}.pid`);
let lockHeld = false;

function acquireInstanceLock(): boolean {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });

    try {
        const fd = fs.openSync(lockPath, 'wx');
        fs.writeFileSync(fd, `${process.pid}\n`, 'utf8');
        fs.closeSync(fd);
        lockHeld = true;
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
            throw err;
        }

        const existingPid = Number.parseInt(fs.readFileSync(lockPath, 'utf8').trim(), 10);
        if (Number.isInteger(existingPid) && existingPid > 0) {
            try {
                process.kill(existingPid, 0);
                console.error(`JoshRS #377 is already running (PID ${existingPid}); exiting safely.`);
                return false;
            } catch (probeErr) {
                if (probeErr instanceof Error && probeErr.message.includes('already running')) {
                    throw probeErr;
                }
                // The recorded process is gone; reclaim the stale lock.
            }
        }

        fs.unlinkSync(lockPath);
        const fd = fs.openSync(lockPath, 'wx');
        fs.writeFileSync(fd, `${process.pid}\n`, 'utf8');
        fs.closeSync(fd);
        lockHeld = true;
    }

    return true;
}

function releaseInstanceLock() {
    if (!lockHeld) {
        return;
    }

    try {
        if (Number.parseInt(fs.readFileSync(lockPath, 'utf8').trim(), 10) === process.pid) {
            fs.unlinkSync(lockPath);
        }
    } catch {
        // The lock is only a guard; do not mask the original shutdown error.
    }
    lockHeld = false;
}

if (!acquireInstanceLock()) {
    process.exit(0);
}
process.once('exit', releaseInstanceLock);

async function assertPortAvailable(port: number) {
    await new Promise<void>((resolve, reject) => {
        const probe = net.createServer();
        probe.once('error', reject);
        probe.listen(port, '0.0.0.0', () => {
            probe.close(err => (err ? reject(err) : resolve()));
        });
    }).catch(err => {
        const code = (err as NodeJS.ErrnoException).code;
        throw new Error(`JoshRS #377 cannot start: port ${port} is unavailable (${code ?? String(err)}).`);
    });
}

await assertPortAvailable(Environment.NODE_PORT);
await assertPortAvailable(Environment.WEB_PORT);
await assertPortAvailable(Environment.WEB_MANAGEMENT_PORT);

if (OnDemand.cache.count(0) !== 9 || OnDemand.cache.count(2) === 0 || !fs.existsSync('data/pack/server/script.dat')) {
    printInfo('Packing cache, please wait until you see the world is ready.');

    try {
        // todo: different logic so the main thread doesn't have to load pack files
        const modelFlags: number[] = [];
        await packAll(modelFlags);
    } catch (err) {
        if (err instanceof Error) {
            printError(err);
        }

        process.exit(1);
    }
}

if (Environment.EASY_STARTUP) {
    new Worker(new URL('./login.ts', import.meta.url));
    new Worker(new URL('./friend.ts', import.meta.url));
    new Worker(new URL('./logger.ts', import.meta.url));
} else if (Environment.FRIEND_SERVER) {
    new Worker(new URL('./friend.ts', import.meta.url));
}

const tcpServer = new TcpServer();

await startWeb();
await startManagementWeb();
await tcpServer.start();

await World.start();

register.setDefaultLabels({ nodeId: Environment.NODE_ID });
collectDefaultMetrics({ register });

let exiting = false;
function safeExit() {
    if (exiting) {
        return;
    }

    exiting = true;
    World.rebootTimer(0);
}

process.on('SIGINT', safeExit);
process.on('SIGTERM', safeExit);

process.on('uncaughtException', function (err) {
    console.error(err, 'Uncaught exception');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error({ promise, reason }, 'Unhandled Rejection at: Promise');
});
