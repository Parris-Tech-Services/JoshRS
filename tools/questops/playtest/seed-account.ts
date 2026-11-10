// Writes a dev-world save for a test account that has finished the tutorial, so the browser client
// logs straight into the world instead of the character-design screen.
//
// Why this works: the design screen is opened by the tutorial. [login,_] (scripts/login_logout/login.rs2)
// runs @start_tutorial only while %tutorial < ^tutorial_complete (1000) and the player is on Tutorial
// Island. The player's appearance already has defaults (Player.body/colors), and with the login server
// disabled (dev) LoginThread loads data/players/<profile>/<name>.sav for any password.
//
//   cd ~/dev274/engine && npx tsx <joshrs>/tools/questops/playtest/seed-account.ts qa_bot [--force]
//
// Dev world only. It refuses lc274, refuses any Elrothiro name, and won't overwrite an existing save
// unless you pass --force.
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { boot } from './harness.ts';

const name = (process.argv[2] ?? '').toLowerCase();
if (!/^[a-z0-9_]{1,12}$/.test(name)) { console.error('usage: seed-account.ts <name a-z0-9_, max 12> [--force]'); process.exit(2); }
if (name.includes('elrothiro')) { console.error('refusing: Elrothiro saves are never created or modified by tools'); process.exit(2); }

const h = await boot();   // refuses lc274
const Environment = (await import(pathToFileURL(join(process.cwd(), 'src/util/Environment.ts')).href)).default;
if (Environment.login.enabled) { console.error('refusing: the login server is enabled, so a save file alone will not log in. This tool is for the dev world.'); process.exit(2); }

const dir = join(process.cwd(), 'data/players', Environment.node.profile);
const file = join(dir, `${name}.sav`);
if (existsSync(file) && !process.argv.includes('--force')) { console.error(`refusing: ${file} exists (pass --force to replace a test account)`); process.exit(2); }

h.login();
h.setVar('tutorial', 1000);            // ^tutorial_complete
h.teleport(3222, 3218, 0);             // Lumbridge, outside the castle
const sav: Uint8Array = h.player.save();
h.World.removePlayer(h.player);
h.World.logoutRequests.delete('playtest');

mkdirSync(dir, { recursive: true });
writeFileSync(file, sav);
console.log(`wrote ${file} (${sav.length} bytes): tutorial complete, at 3222,3218,0. Log in as "${name}" with any password.`);
process.exit(0);
