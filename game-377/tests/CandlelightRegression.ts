import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../../../');
const locConfig = fs.readFileSync(path.join(root, 'content/scripts/macro events/configs/antimacro.loc'), 'utf8');
const map = fs.readFileSync(path.join(root, 'content/maps/m30_78.jm2'), 'utf8');
const event = fs.readFileSync(path.join(root, 'content/scripts/macro events/scripts/general/macro_event_candlelight.rs2'), 'utf8');
const iface = fs.readFileSync(path.join(root, 'content/scripts/interfaces/macro_candlelight_lighter.if'), 'utf8');

for (let i = 1; i <= 11; i++) {
    const name = `macro_candlelight_pillar${i}`;
    const section = locConfig.match(new RegExp(`\\[${name}\\]([\\s\\S]*?)(?=\\n\\[|$)`))?.[1] ?? '';
    assert.match(section, /(^|\n)active=yes(\n|$)/, `${name} must be an active server loc`);
}

const expected = ['0 47 5: 11368', '0 48 6: 11369', '0 47 7: 11370', '0 48 8: 11371', '0 47 9: 11372', '0 48 10: 11373', '0 47 11: 11374', '0 48 12: 11375', '0 47 13: 11376', '0 48 14: 11377', '0 47 15: 11378'];
for (const line of expected) assert.match(map, new RegExp(`^${line} `, 'm'), `missing candle loc ${line}`);

for (const button of ['up_button', 'down_button', 'left_button', 'right_button', 'light_button']) {
    assert.match(event, new RegExp(`\\[if_button,macro_candlelight_lighter:${button}\\]`));
    assert.match(iface, new RegExp(`^\\[${button}\\]`, 'm'));
}

assert.match(event, /loc_findallzone\(movecoord\(coord, -3, 0, 0\)\)/);
assert.match(event, /macro_candlelight_finished_check/);
assert.match(event, /inv_add\(inv, ~macro_candlelight_reward\)/);
assert.match(event, /macro_events_varps_reset/);
console.log('Candlelight regression checks passed: active pillars, map coordinates, interface buttons, completion and logout cleanup.');
