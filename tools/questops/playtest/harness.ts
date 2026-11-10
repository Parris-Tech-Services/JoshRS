// Server-side playtest harness for the revision-274 engine (Lost City Engine-TS).
//
// Boots the real engine in-process with the dev world's packed content, logs a test player in with no
// network client, and drives the same server entry points the client packets reach: interactions
// (setInteraction, as OpNpcHandler does), dialogue buttons (as IfButtonHandler / ResumePauseButtonHandler
// do), varps, and Player.save() -> PlayerLoading.load(). Ticks run back-to-back instead of every 600 ms.
//
// Run it from the engine directory so the engine's own '#/...' imports and data/ paths resolve:
//   cd ~/dev274/engine && npx tsx <joshrs>/tools/questops/playtest/run.ts <scenario.json> [--dump]
//
// NEVER point this at ~/lc274 (the live world). It writes no save file, but it does boot a world.
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { pickOption } from './scenario.mjs';

const ENGINE = process.cwd();
const mod = async (p: string) => (await import(pathToFileURL(join(ENGINE, 'src', p)).href)).default;

export type Line = { kind: 'text' | 'mes'; com?: number; text: string };

export async function boot() {
    if (!existsSync(join(ENGINE, 'data/pack/server/script.dat'))) {
        throw new Error(`no packed content in ${ENGINE}/data/pack - start the dev world once (it packs), then rerun`);
    }
    if (/\/lc274(\/|$)/.test(ENGINE)) throw new Error('refusing to run against the live world (lc274); use the dev world');

    const World = await mod('engine/World.ts');
    const PlayerLoading = (await import(pathToFileURL(join(ENGINE, 'src/engine/entity/PlayerLoading.ts')).href)).PlayerLoading;
    const Packet = await mod('io/Packet.ts');
    const NpcType = await mod('cache/config/NpcType.ts');
    const VarPlayerType = await mod('cache/config/VarPlayerType.ts');
    const Component = await mod('cache/config/Component.ts');
    const ScriptState = await mod('engine/script/ScriptState.ts');
    const IfSetText = await mod('network/game/server/model/IfSetText.ts');
    const MessageGame = await mod('network/game/server/model/MessageGame.ts');

    // start(skipMaps=false, startCycle=false): loads configs, scripts and maps; we drive the ticks.
    await World.start(false, false);

    // Phases of World.cycle() in order, minus the setTimeout rescheduling (World.ts cycle()).
    const PHASES = ['processWorld', 'processClientsIn', 'processNpcEventQueue', 'processNpcs', 'processPlayers',
        'processLogouts', 'processLogins', 'processZones', 'processInfo', 'processClientsOut', 'processCleanup'];
    for (const p of PHASES) if (typeof World[p] !== 'function') throw new Error(`engine has no World.${p}; harness needs updating for this engine version`);

    let player: any = null;
    const texts = new Map<number, string>();
    let lines: Line[] = [];

    function capture(p: any) {
        // A Player with no client drops every message (Player.write checks isClientConnected); record them.
        p.write = (m: any) => {
            if (m instanceof IfSetText) { texts.set(m.component, m.text); lines.push({ kind: 'text', com: m.component, text: m.text }); }
            else if (m instanceof MessageGame) lines.push({ kind: 'mes', text: m.msg });
        };
    }

    function tick(n = 1) {
        for (let i = 0; i < n; i++) {
            if (player) { player.lastResponse = World.currentTick; player.lastConnected = World.currentTick; }
            for (const p of PHASES) World[p]();
            World.currentTick++;
        }
    }

    function login(save: Uint8Array = new Uint8Array()) {
        player = PlayerLoading.load('playtest', new Packet(save), null);
        capture(player);
        World.newPlayers.add(player);
        tick(2);
        if (!World.getPlayerByUsername('playtest')) throw new Error('test player did not log in');
        return player;
    }

    const varpId = (name: string) => {
        const id = VarPlayerType.getId(name);
        if (id === -1) {
            const near = [];
            for (let i = 0; i < VarPlayerType.count; i++) { const n = VarPlayerType.get(i).debugname; if (n && name.split('_').some((w: string) => w.length > 3 && n.includes(w))) near.push(n); }
            throw new Error(`no varp "${name}"${near.length ? `; similar: ${near.slice(0, 12).join(', ')}` : ''}`);
        }
        return id;
    };

    function npcsNear(x: number, z: number, level: number, radius: number) {
        const out = [];
        for (const npc of World.npcs) {
            if (!npc || npc.level !== level) continue;
            if (Math.max(Math.abs(npc.x - x), Math.abs(npc.z - z)) <= radius) out.push({ npc, name: NpcType.get(npc.type).debugname, x: npc.x, z: npc.z });
        }
        return out;
    }

    const waiting = () => player.activeScript?.execution === ScriptState.PAUSEBUTTON;

    return {
        World, tick, login, varpId, npcsNear,
        get player() { return player; },
        lines: () => lines,
        clearLines() { lines = []; },
        teleport(x: number, z: number, level = 0) { player.teleport(x, z, level); tick(2); },
        talk(name: string, op = 1) {
            const near = npcsNear(player.x, player.z, player.level, 15).filter((n) => n.name === name);
            if (!near.length) throw new Error(`no NPC "${name}" within 15 tiles of ${player.x},${player.z},${player.level}`);
            lines = [];
            // As OpNpcHandler: APNPC<op> with an ENGINE interaction (Interaction.ENGINE === 1, a const enum).
            player.clearPendingAction();
            player.setInteraction(1, near[0].npc, 3 + (op - 1));
            player.opcalled = true;
            for (let i = 0; i < 30 && !waiting(); i++) tick();
            if (!waiting() && !lines.length) throw new Error(`talking to ${name} produced no dialogue after 30 ticks`);
        },
        waiting,
        continueDialogue() {
            if (!waiting()) throw new Error('no dialogue is waiting to be continued');
            if (player.resumeButtons.length > 1) throw new Error(`dialogue is a choice, not a continue: ${this.options().join(' | ')}`);
            // As ResumePauseButtonHandler.
            player.executeScript(player.activeScript, true, true);
            tick();
        },
        options(): string[] {
            return player.resumeButtons.map((c: number) => (texts.get(c) ?? '').replace(/<[^>]*>/g, '')).filter(Boolean);
        },
        choose(want: string) {
            if (!waiting()) throw new Error(`no dialogue is waiting; cannot choose "${want}"`);
            const pick = pickOption(player.resumeButtons, texts, want);
            if ('error' in pick) throw new Error(`${pick.error}; options: ${pick.options.join(' | ') || '(none)'}`);
            // As IfButtonHandler for a resume button.
            player.lastCom = pick.com;
            player.executeScript(player.activeScript, true, true);
            tick();
        },
        comName: (c: number) => Component.get(c)?.comName ?? String(c),
        isPerm: (name: string) => VarPlayerType.get(varpId(name)).scope === VarPlayerType.SCOPE_PERM,
        getVar: (name: string) => player.getVar(varpId(name)),
        setVar: (name: string, v: number) => player.setVar(varpId(name), v),
        saveReload() {
            const sav: Uint8Array = player.save();
            const { x, z, level } = player;
            // Remove the old instance directly. The normal logout path (processLogouts) queues the save for
            // the login thread, which would write data/players/.../playtest.sav; drop that request so the
            // harness never writes a save file. The [logout] script is therefore not run.
            const old = player;
            World.removePlayer(old);
            World.logoutRequests.delete('playtest');
            tick();
            if (World.getPlayerByUsername('playtest')) throw new Error('old player still in the world after removal');
            login(sav);
            if (player.x !== x || player.z !== z || player.level !== level) throw new Error(`reloaded at ${player.x},${player.z},${player.level}, saved at ${x},${z},${level}`);
            return sav.length;
        },
    };
}
