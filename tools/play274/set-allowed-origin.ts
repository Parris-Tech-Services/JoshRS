// Writes data/config/world.json with an explicit WebSocket origin allowlist.
//
// Why this exists: `loadWorldConfig()` in Engine-TS only reads env vars from a legacy
// `.env` file, NOT from `process.env`. With no world.json it returns defaults, and the
// default `web.allowedOrigin` is `''` — which the check treats as "allow everything".
// Setting WEB_ALLOWED_ORIGIN as a shell variable therefore does nothing, and the
// allowlist silently passes every origin. Verified: a foreign origin connected until
// this file was written.
//
// Run from the engine directory:
//   ORIGIN_TO_ALLOW=http://10.8.0.1:8888 npx tsx set-allowed-origin.ts
import { loadWorldConfig, saveWorldConfig, getWorldConfigPath } from './src/util/WorldConfig.js';

const origin = process.env.ORIGIN_TO_ALLOW;
if (!origin) {
    console.error('BLOCKED: ORIGIN_TO_ALLOW is not set');
    process.exit(2);
}
if (!/^https?:\/\/[^/]+$/.test(origin)) {
    console.error(`BLOCKED: origin must look like http://host:port, got ${origin}`);
    process.exit(2);
}

const config = loadWorldConfig();
config.web.allowedOrigin = origin;
saveWorldConfig(config);

const written = loadWorldConfig().web.allowedOrigin;
if (written !== origin) {
    console.error(`BLOCKED: origin did not persist (wrote ${origin}, read ${written})`);
    process.exit(1);
}
console.log(`allowed origin: ${written}`);
console.log(`config: ${getWorldConfigPath()}`);
