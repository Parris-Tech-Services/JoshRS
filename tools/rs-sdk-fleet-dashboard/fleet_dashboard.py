#!/usr/bin/env python3
"""Read-only 2004Scape RS-SDK fleet tracker. No dependencies, no bot actions.

python3 fleet_dashboard.py --once  # terminal roster
python3 fleet_dashboard.py         # localhost browser dashboard, port 8790

Gateway /status tells us whether a bot client is publishing state; it does NOT
prove an Agy worker or script is acting. /state/:bot is optional and may return
401 on authenticated gateways. Never handles game credentials, private chats or
write endpoints.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, urlsplit
from urllib.request import urlopen

GATEWAY = 'http://127.0.0.1:7780'
BOT_NAME = re.compile(r'^[a-zA-Z0-9_]{1,20}$')
MAX_REPLY = 5_000_000
# Optional metadata emitted by the actual Agy supervisor; never inferred from
# bot names or client tick counts. This dashboard does NOT write this file.
ASSIGNMENTS = Path.home() / 'dev/JoshRS-source/rs-sdk/bots/logs/fleet/assignments.json'


def read_assignments():
    try:
        if ASSIGNMENTS.is_symlink() or not ASSIGNMENTS.is_file() or ASSIGNMENTS.stat().st_size > 500_000:
            return {}
        doc = json.loads(ASSIGNMENTS.read_text(encoding='utf-8'))
        if not isinstance(doc, dict) or not isinstance(doc.get('bots'), dict):
            return {}
        clean = {}
        for name, meta in doc['bots'].items():
            if not isinstance(name, str) or not BOT_NAME.fullmatch(name) or not isinstance(meta, dict):
                continue
            # Whitelist short descriptive metadata; no arbitrary URLs, logs,
            # tokens, passwords, filesystem paths or conversation contents.
            objective = meta.get('objective')
            category = meta.get('kind')
            state = meta.get('state')
            if (not isinstance(objective, str) or len(objective) > 100
                    or re.search(r'(?i)password|token|secret|api.?key|https?://|wss?://', objective)):
                continue
            if category not in ('quest', 'skill', 'general', 'unknown'):
                category = 'unknown'
            if state not in ('running', 'blocked', 'paused', 'complete', 'unknown'):
                state = 'unknown'
            clean[name.lower()] = {'objective': objective, 'kind': category, 'state': state}
        return clean
    except (OSError, ValueError, TypeError, json.JSONDecodeError):
        return {}


def fetch_json(path):
    """Only request fixed, local gateway endpoints. No arbitrary URL fetch."""
    if not (path == '/status' or re.fullmatch(r'/status/[a-zA-Z0-9_]{1,20}', path)
            or re.fullmatch(r'/state/[a-zA-Z0-9_]{1,20}', path)):
        raise ValueError('endpoint not allowed')
    with urlopen(GATEWAY + path, timeout=4) as response:
        payload = response.read(MAX_REPLY + 1)
        if len(payload) > MAX_REPLY:
            raise ValueError('gateway response exceeded 5 MB')
        return json.loads(payload)


def roster(raw):
    """Parse public session metadata; do not include raw client IDs or secrets."""
    bots = raw.get('bots', {})
    sdks = raw.get('sdks', {})
    if not isinstance(bots, dict) or not isinstance(sdks, dict):
        raise ValueError('unexpected gateway /status shape')
    controllers = Counter()
    observers = Counter()
    for sdk in sdks.values():
        if not isinstance(sdk, dict):
            continue
        target = str(sdk.get('targetUsername', '')).lower()
        if sdk.get('mode') == 'control':
            controllers[target] += 1
        elif sdk.get('mode') == 'observe':
            observers[target] += 1
    assignments = read_assignments()
    items = []
    for name, data in bots.items():
        if not isinstance(name, str) or not BOT_NAME.fullmatch(name) or not isinstance(data, dict):
            continue
        status = data.get('status', 'unknown')
        if status not in ('active', 'dead', 'stale'):
            status = 'unknown'
        tick = data.get('tick', 0)
        if not isinstance(tick, int) or isinstance(tick, bool) or tick < 0:
            tick = 0
        items.append({'name': name, 'status': status, 'tick': tick,
                      'controllers': controllers[name.lower()],
                      'observers': observers[name.lower()],
                      'inGame': data.get('inGame') is True,
                      'isQuestBot': name.lower().startswith('qb'),
                      'assignment': assignments.get(name.lower())})
    rank = {'active': 0, 'stale': 1, 'dead': 2, 'unknown': 3}
    items.sort(key=lambda x: (rank.get(x['status'], 3), not x['isQuestBot'], x['name'].lower()))
    summary = {
        'registered': len(items),
        'active': sum(x['status'] == 'active' for x in items),
        'stale': sum(x['status'] == 'stale' for x in items),
        'dead': sum(x['status'] == 'dead' for x in items),
        'qbTotal': sum(x['isQuestBot'] for x in items),
        'qbActive': sum(x['isQuestBot'] and x['status'] == 'active' for x in items),
        'sdkControllers': sum(x['controllers'] for x in items),
        'sdkObservers': sum(x['observers'] for x in items),
        'withAssignment': sum(x['assignment'] is not None for x in items),
    }
    return {'summary': summary, 'bots': items,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'note': 'Active means the bot client published recent state; it does not prove quest or skill automation is running.'}


def safe_bot_detail(name):
    if not BOT_NAME.fullmatch(name):
        raise ValueError('invalid bot name')
    # Refuse to read arbitrary bot names not known to the gateway.
    r = roster(fetch_json('/status'))
    if name not in {b['name'] for b in r['bots']}:
        raise ValueError('bot is not registered')
    info = fetch_json('/status/' + quote(name))
    p = info.get('player') if isinstance(info.get('player'), dict) else {}
    detail = {
        'name': name, 'status': info.get('status', 'unknown'),
        'stateAgeMs': info.get('stateAge'),
        'controllers': len(info.get('controllers') or []),
        'observers': len(info.get('observers') or []),
        'position': {'x': p.get('worldX'), 'z': p.get('worldZ')},
        'skills': [], 'recentQuestNotices': [],
        'assignment': read_assignments().get(name.lower()),
        'stateAvailable': False, 'stateNote': 'No /state response yet',
    }
    try:
        payload = fetch_json('/state/' + quote(name))
        s = payload.get('state') if isinstance(payload, dict) else None
        if not isinstance(s, dict):
            detail['stateNote'] = 'Gateway has no current state for this client'
            return detail
        player = s.get('player') if isinstance(s.get('player'), dict) else {}
        detail['stateAvailable'] = True
        detail['stateNote'] = 'Recent client-reported state (not verified quest ledger)'
        detail['inGame'] = s.get('inGame') is True
        detail['tick'] = s.get('tick')
        detail['position'] = {'x': player.get('worldX'), 'z': player.get('worldZ'),
                              'floor': player.get('level')}
        detail['combatLevel'] = player.get('combatLevel')
        detail['hp'] = player.get('hp')
        detail['maxHp'] = player.get('maxHp')
        detail['skills'] = [
            {'name': sk.get('name'), 'level': sk.get('baseLevel', sk.get('level')),
             'xp': sk.get('experience')}
            for sk in (s.get('skills') or []) if isinstance(sk, dict)
            and isinstance(sk.get('name'), str) and not sk['name'].startswith('Stat')
        ][:40]
        detail['totalLevel'] = sum(sk['level'] for sk in detail['skills']
                                   if isinstance(sk.get('level'), int))
        detail['inventorySlotsUsed'] = len([item for item in (s.get('inventory') or [])
                                             if isinstance(item, dict) and item.get('count', 0) > 0])
        # Only SYSTEM messages; no public/private player chat. These are NOT
        # authoritative quest completion records; repeated notices are possible.
        notice = []
        for message in (s.get('gameMessages') or []):
            if (isinstance(message, dict) and message.get('type') == 0
                    and isinstance(message.get('text'), str)):
                msg = message['text']
                if 'quest' in msg.lower() and len(msg) < 160:
                    msg = re.sub(r'(?i)(password|token|secret)=[^\s&]+', r'\1=[REDACTED]', msg)
                    notice.append({'tick': message.get('tick'), 'text': msg})
        detail['recentQuestNotices'] = notice[-6:]
    except HTTPError as exc:
        detail['stateNote'] = ('Gateway denied state access (HTTP %d); no credentials requested' % exc.code)
    except (TimeoutError, URLError, ValueError, OSError, json.JSONDecodeError) as exc:
        detail['stateNote'] = 'State unavailable (%s)' % type(exc).__name__
    return detail


PAGE = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>JoshRS — Bot Fleet</title><style>
:root {color-scheme:dark;font-family:system-ui,Arial;background:#10151f;color:#e6edf6}
*{box-sizing:border-box}body{margin:0 auto;padding:24px;max-width:1320px}header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
h1{margin:0;font-size:1.6rem}.sub{color:#a4b1c6;font-size:.88rem;margin:.3em 0 1em}
.controls{display:flex;gap:9px;flex-wrap:wrap;align-items:center}input,button{background:#1c2738;border:1px solid #405069;border-radius:8px;color:inherit;padding:10px 12px;font:inherit}
button{cursor:pointer}button:hover{border-color:#8ea8d3}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:11px;margin:20px 0}
.stat{padding:18px;border:1px solid #334155;background:#192233;border-radius:12px}.stat strong{display:block;font-size:2rem}.stat small{color:#a4b1c6}
.notice{color:#a4b1c6;font-size:.83rem;margin:12px 0}.error{color:#ffb4b4}
section{overflow-x:auto;border:1px solid #334155;border-radius:12px}table{border-collapse:collapse;width:100%}th{text-align:left;font-size:.78rem;color:#b4c2d8;background:#1d2839}td,th{padding:10px 12px;border-bottom:1px solid #2e3b50}tbody tr:last-child td{border-bottom:0}tbody tr:hover{background:#202c3f}
.name{background:none;border:0;padding:0;text-decoration:underline;text-underline-offset:3px;font-weight:650}
.pill{border-radius:20px;padding:4px 8px;font-size:.77rem;font-weight:600;background:#39475b}.active{color:#86efac;background:#193e2f}.dead{color:#c1cada}.stale{color:#fde68a;background:#4a3a16}
#panel{margin-top:20px;padding:20px;border:1px solid #334155;border-radius:12px;background:#192233}#panel[hidden]{display:none}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px} .skill{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #334155;padding:5px}
@media(max-width:700px){body{padding:12px}td,th{padding:8px 6px;font-size:.85rem}}
</style></head><body>
<header><div><h1>JoshRS · Bot Fleet</h1><p class="sub">Read-only RS-SDK gateway view · local Fedora only</p></div><div class="controls"><input id="search" placeholder="Filter bots / qb..." aria-label="Filter bots"><button id="refresh">Refresh</button></div></header>
<div class="stats" id="stats"></div><p class="notice" id="updated">Connecting to local gateway…</p>
<section><table><thead><tr><th>Bot</th><th>Game session</th><th>Game tick</th><th>Assigned work</th><th>SDK controllers</th><th>Observers</th><th>Meaning</th></tr></thead><tbody id="rows"></tbody></table></section>
<div id="panel" hidden><h2 id="botname"></h2><p class="notice" id="botnote"></p><div id="info"></div><h3>Skills (observed client levels)</h3><div class="grid" id="skills"></div><h3>Recent quest-related system notices</h3><p class="notice">These notices are clues, NOT a verified completed-quest ledger.</p><div id="notices"></div></div>
<p class="notice">A connected game client is not necessarily an active Agy worker. Browser screenshots, names and SDK action acknowledgements do not prove quest completion. No credentials, personal chats or live game actions are read or sent by this dashboard.</p>
<script>
'use strict';const $=id=>document.getElementById(id);let items=[];
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n}
function renderRows(){const q=$('search').value.trim().toLowerCase();const body=$('rows');body.replaceChildren();
for(const b of items.filter(x=>x.name.toLowerCase().includes(q))){const tr=el('tr');const name=el('button',b.name,'name');name.onclick=()=>showDetail(b.name);
const nameTd=el('td');nameTd.append(name);tr.append(nameTd);
const statusTd=el('td');statusTd.append(el('span',b.status,'pill '+b.status));tr.append(statusTd);
tr.append(el('td',b.tick));tr.append(el('td',b.assignment ? `${b.assignment.kind}: ${b.assignment.objective} (${b.assignment.state})` : 'Unreported'));for(const val of [b.controllers,b.observers])tr.append(el('td',val));
tr.append(el('td',b.controllers?'SDK controller present':b.status==='active'?'Client online; automation unconfirmed':'No live client verified'));body.append(tr);}}
async function refresh(){try{const r=await fetch('/api/fleet',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const data=await r.json();if(data.error)throw Error(data.error);
items=data.bots;const s=data.summary;$('stats').replaceChildren();for(const [label,val] of [['Registered',s.registered],['Active clients',s.active],['Quest bots active',s.qbActive],['Disconnected',s.dead],['Stale',s.stale],['SDK controllers',s.sdkControllers],['Jobs labelled',s.withAssignment]]){
const box=el('div',undefined,'stat');box.append(el('strong',val),el('small',label));$('stats').append(box)}
$('updated').textContent=`Updated ${new Date().toLocaleTimeString()} · ${data.note}`;$('updated').className='notice';renderRows();}
catch(e){$('updated').textContent='Unable to reach gateway: '+e.message;$('updated').className='notice error';}}
async function showDetail(name){$('panel').hidden=false;$('botname').textContent=name;$('botnote').textContent='Reading last observed state…';$('info').replaceChildren();$('skills').replaceChildren();$('notices').replaceChildren();
try{const r=await fetch('/api/bot?name='+encodeURIComponent(name),{cache:'no-store'});const d=await r.json();if(!r.ok||d.error)throw Error(d.error||'HTTP '+r.status);
$('botnote').textContent=`${d.status} · ${d.stateNote} · SDK controllers: ${d.controllers}`;
const p=d.position||{};const info=[`Tile: ${p.x??'?'} / ${p.z??'?'}${p.floor===undefined?'':' · floor '+p.floor}`,`Assigned: ${d.assignment ? d.assignment.objective + ' (' + d.assignment.state + ')' : 'Unreported by Agy'}`,`Combat: ${d.combatLevel??'?'}`,`HP: ${d.hp??'?'} / ${d.maxHp??'?'}`,`Total skill levels: ${d.totalLevel??'?'}`,`Inventory slots: ${d.inventorySlotsUsed??'?'}`];
for(const x of info)$('info').append(el('p',x));for(const s of d.skills||[]){const box=el('div',undefined,'skill');box.append(el('span',s.name),el('strong',s.level));$('skills').append(box)}
for(const m of d.recentQuestNotices||[])$('notices').append(el('p',m.text));if(!(d.recentQuestNotices||[]).length)$('notices').append(el('p','No recent quest system notices available.','notice'));
}catch(e){$('botnote').textContent='Details unavailable: '+e.message;}}
$('search').addEventListener('input',renderRows);$('refresh').addEventListener('click',refresh);refresh();setInterval(refresh,15000);
</script></body></html>'''


class Handler(BaseHTTPRequestHandler):
    def reply(self, code, mime, value):
        if isinstance(value, (dict, list)):
            data = json.dumps(value, ensure_ascii=False).encode('utf-8')
        else:
            data = str(value).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'none'; connect-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        try:
            request = urlsplit(self.path)
            if request.path == '/':
                self.reply(200, 'text/html; charset=utf-8', PAGE)
            elif request.path == '/api/fleet':
                self.reply(200, 'application/json; charset=utf-8', roster(fetch_json('/status')))
            elif request.path == '/api/bot':
                names = parse_qs(request.query).get('name', [])
                if len(names) != 1 or not BOT_NAME.fullmatch(names[0]):
                    self.reply(400, 'application/json', {'error': 'invalid bot name'})
                else:
                    self.reply(200, 'application/json', safe_bot_detail(names[0]))
            else:
                self.reply(404, 'application/json', {'error': 'not found'})
        except (HTTPError, URLError, TimeoutError, ValueError, OSError, json.JSONDecodeError) as exc:
            # Avoid printing upstream exception text (may contain private URLs).
            self.reply(502, 'application/json', {'error': 'Local gateway unavailable or response invalid: ' + type(exc).__name__})

    def log_message(self, format, *args):
        # Deliberately don't log query strings or arbitrary untrusted text.
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--once', action='store_true', help='read-only terminal snapshot')
    parser.add_argument('--port', type=int, default=8790, help='localhost dashboard port (default 8790)')
    args = parser.parse_args()
    if args.once:
        data = roster(fetch_json('/status'))
        summary = data['summary']
        print('Registered: {registered} | Active: {active} | Quest bots: {qbActive}/{qbTotal} | Dead: {dead} | Stale: {stale} | SDK controllers: {sdkControllers} | Jobs labelled: {withAssignment}'.format(**summary))
        print('{:<18} {:<9} {:>9} {:>11} {}'.format('BOT', 'SESSION', 'TICK', 'CONTROLLERS', 'JOB'))
        for bot in data['bots']:
            print(('{name:<18} {status:<9} {tick:>9} {controllers:>11} '.format(**bot)) + (bot['assignment']['objective'] if bot['assignment'] else 'unreported'))
        print('Note: "active" means recently publishing client state, not necessarily running a script.')
        return
    if not (1024 <= args.port <= 65535):
        parser.error('port must be 1024–65535')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print('JoshRS fleet dashboard: http://127.0.0.1:%d/' % args.port)
    print('READ-ONLY · localhost only · Ctrl+C to stop. Does not start or stop bots.')
    try:
        server.serve_forever(poll_interval=0.4)
    except KeyboardInterrupt:
        print('\nStopping dashboard (game clients untouched).')
    finally:
        server.server_close()


if __name__ == '__main__':
    try:
        main()
    except (HTTPError, URLError, TimeoutError, ValueError, OSError, json.JSONDecodeError) as exc:
        print('Unable to read local RS-SDK gateway status: ' + type(exc).__name__, file=sys.stderr)
        sys.exit(1)
