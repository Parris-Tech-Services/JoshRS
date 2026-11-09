import { runScript, type ScriptContext } from '../../sdk/runner';
import { appendFileSync } from 'fs';

const LOG_PATH = '/home/josh/dev/JoshRS/lostcity377/engine/rs-sdk/bots/bot4/lab_log.md';

interface AuditFinding {
    region: string;
    coords: string;
    objectName: string;
    action: string;
    expected: string;
    actual: string;
    severity: 'Blocks progress' | 'Cosmetic' | 'Working';
}

const findings: AuditFinding[] = [];

function recordFinding(f: AuditFinding) {
    findings.push(f);
    const icon = f.severity === 'Working' ? 'PASS' : f.severity === 'Blocks progress' ? 'BLOCK' : 'COSMETIC';
    console.log(`[AUDIT:${icon}] [${f.region}] ${f.objectName} (${f.action}) @ ${f.coords}: ${f.actual}`);
}

function flushRegionLog(regionTitle: string, summaryNotes: string[]) {
    const regionFindings = findings.filter(f => f.region === regionTitle);
    const anomalies = regionFindings.filter(f => f.severity !== 'Working');
    const workingCount = regionFindings.filter(f => f.severity === 'Working').length;

    const lines: string[] = [];
    lines.push(`\n### Region Completed: ${regionTitle} (${new Date().toISOString()})`);
    lines.push(`- **Objects/Interactions Audited**: ${regionFindings.length} (${workingCount} working normally, ${anomalies.length} anomalies/findings)`);
    for (const note of summaryNotes) {
        lines.push(`- ${note}`);
    }
    if (anomalies.length > 0) {
        lines.push(`\n#### Findings in ${regionTitle}`);
        for (const a of anomalies) {
            lines.push(
                `- **Coordinates & Region**: \`${a.coords}\` (${a.region})\n` +
                `  - **Object & Action**: \`${a.objectName}\` -> \`${a.action}\`\n` +
                `  - **Expected**: ${a.expected}\n` +
                `  - **Actual**: ${a.actual}\n` +
                `  - **Severity**: **${a.severity}**`
            );
        }
    } else {
        lines.push(`- **Findings**: No broken interactions found in this region.`);
    }
    lines.push('');
    appendFileSync(LOG_PATH, lines.join('\n'));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function clearAllUI(ctx: ScriptContext) {
    const { bot, sdk } = ctx;
    for (let i = 0; i < 5; i++) {
        const st = sdk.getState();
        if (st?.interface?.isOpen) {
            await bot.closeInterface();
            await sleep(250);
        }
        if (st?.dialog?.isOpen) {
            const opts = st.dialog.options ?? [];
            const cancelOpt = opts.find((o: any) => /cancel|nevermind|no|nothing/i.test(o.text));
            const idx = cancelOpt ? cancelOpt.index : (opts[0]?.index ?? 0);
            await sdk.sendClickDialog(idx);
            await sleep(300);
        } else {
            break;
        }
    }
}

async function ensureGroundLevel(ctx: ScriptContext) {
    const { bot, sdk } = ctx;
    for (let attempt = 0; attempt < 4; attempt++) {
        const s = sdk.getState();
        const p = s?.player;
        if (!p) break;
        if (p.level === 0 && p.worldZ < 6000) break;
        await clearAllUI(ctx);
        if (p.worldZ >= 6000) {
            const ladderUp = sdk.findNearbyLoc(/ladder|staircase|trapdoor/i);
            if (ladderUp) {
                const upOpt = ladderUp.optionsWithIndex.find(o => /climb-up|climb/i.test(o.text));
                if (upOpt) {
                    await bot.interactLoc(ladderUp, upOpt.text);
                    await sdk.waitForTicks(3);
                    continue;
                }
            }
        }
        if (p.level > 0) {
            const downLoc = sdk.findNearbyLoc(/ladder|staircase/i);
            if (downLoc) {
                const downOpt = downLoc.optionsWithIndex.find(o => /climb-down|climb/i.test(o.text));
                if (downOpt) {
                    await bot.interactLoc(downLoc, downOpt.text);
                    await sdk.waitForTicks(3);
                    continue;
                }
            }
        }
        break;
    }
}

async function auditRegionWaypoints(
    ctx: ScriptContext,
    regionTitle: string,
    waypoints: Array<{ x: number; z: number; label: string }>
) {
    const { bot, sdk } = ctx;
    const testedKeys = new Set<string>();

    for (const wp of waypoints) {
        await clearAllUI(ctx);
        await ensureGroundLevel(ctx);

        const walkRes = await bot.walkTo(wp.x, wp.z, 3);
        const pAfter = sdk.getState()?.player;
        if (!walkRes.success) {
            recordFinding({
                region: regionTitle,
                coords: `(${wp.x}, ${wp.z}, L0) [player at (${pAfter?.worldX}, ${pAfter?.worldZ}, L${pAfter?.level})]`,
                objectName: `Waypoint: ${wp.label}`,
                action: `walkTo(${wp.x}, ${wp.z})`,
                expected: `Reachable navigation to ${wp.label}`,
                actual: `walkTo failed: ${walkRes.message}`,
                severity: 'Blocks progress'
            });
        } else {
            recordFinding({
                region: regionTitle,
                coords: `(${pAfter?.worldX}, ${pAfter?.worldZ}, L${pAfter?.level})`,
                objectName: `Waypoint: ${wp.label}`,
                action: `walkTo(${wp.x}, ${wp.z})`,
                expected: `Reachable navigation to ${wp.label}`,
                actual: `Reached (${pAfter?.worldX}, ${pAfter?.worldZ}, L${pAfter?.level})`,
                severity: 'Working'
            });
        }

        const locs = sdk.getNearbyLocs().filter(l => l.optionsWithIndex.length > 0 && l.dist <= 9);
        for (const loc of locs) {
            if (/tree|oak|willow|yew|plant|ladder|staircase|trapdoor/i.test(loc.name)) continue;
            const nonWalkOpts = loc.optionsWithIndex.filter(o =>
                !/^(walk here|examine|cancel)$/i.test(o.text) &&
                !/^(close|shut)$/i.test(o.text) &&
                !/^pick-lock$/i.test(o.text) &&
                !/^chop/i.test(o.text) &&
                !/^climb/i.test(o.text)
            );
            if (nonWalkOpts.length === 0) continue;
            const opt = nonWalkOpts[0]!;
            const key = `${loc.id}@${loc.x},${loc.z}:${opt.text}`;
            if (testedKeys.has(key)) continue;

            const typeActionKey = `${loc.name.toLowerCase()}:${opt.text.toLowerCase()}`;
            const sameTypeCount = Array.from(testedKeys).filter(k => k.endsWith(`#${typeActionKey}`)).length;
            if (sameTypeCount >= 3 && !/door|gate|chest|coffin|altar|ladder|trapdoor|staircase|shantay|lever|bookcase|cupboard|furnace|anvil|spinning|potter|guild/i.test(loc.name)) {
                continue;
            }
            testedKeys.add(`${key}#${typeActionKey}`);

            await clearAllUI(ctx);

            const beforeState = sdk.getState();
            const beforeRej = beforeState?.opFeedback?.opRejectedCount ?? 0;
            const beforeChatLen = sdk.getChat().length;
            const pStart = beforeState?.player;

            const res = await Promise.race([
                bot.interactLoc(loc, opt.text),
                sleep(4500).then(() => ({ success: false, message: 'Timed out after 4500ms' })),
            ]);
            await sdk.waitForTicks(2);

            const afterState = sdk.getState();
            const afterRej = afterState?.opFeedback?.opRejectedCount ?? 0;
            const newChats = sdk.getChat().slice(beforeChatLen).map(c => c.text);
            const cantReach = newChats.some(t => /can't reach/i.test(t)) || /can't reach/i.test(res.message);
            const pEnd = afterState?.player;

            const stillSameLoc = sdk.getNearbyLocs().find(l => l.x === loc.x && l.z === loc.z && l.id === loc.id);
            const locChanged = !stillSameLoc;
            const dialogOpened = Boolean(afterState?.dialog.isOpen || afterState?.interface.isOpen);
            const movedPlane = pStart && pEnd && (pStart.level !== pEnd.level || Math.abs(pStart.worldZ - pEnd.worldZ) > 100);

            await clearAllUI(ctx);

            if (cantReach) {
                recordFinding({
                    region: regionTitle,
                    coords: `(${loc.x}, ${loc.z}, L${pStart?.level ?? 0})`,
                    objectName: `${loc.name} (id=${loc.id})`,
                    action: opt.text,
                    expected: `Interact with ${loc.name} (${opt.text})`,
                    actual: `Unreachable ("I can't reach that!" / ${res.message}). Chat: ${JSON.stringify(newChats)}`,
                    severity: /door|gate|ladder|staircase|trapdoor/i.test(loc.name) ? 'Blocks progress' : 'Cosmetic'
                });
            } else if (!res.success || (afterRej > beforeRej && !locChanged && !dialogOpened && !movedPlane && newChats.length === 0)) {
                recordFinding({
                    region: regionTitle,
                    coords: `(${loc.x}, ${loc.z}, L${pStart?.level ?? 0})`,
                    objectName: `${loc.name} (id=${loc.id})`,
                    action: opt.text,
                    expected: `Interact with ${loc.name} (${opt.text})`,
                    actual: `Rejected or no effect (success=${res.success}, opRejectedDelta=${afterRej - beforeRej}, msg="${res.message}", chats=${JSON.stringify(newChats)})`,
                    severity: 'Cosmetic'
                });
            } else {
                recordFinding({
                    region: regionTitle,
                    coords: `(${loc.x}, ${loc.z}, L${pStart?.level ?? 0})`,
                    objectName: `${loc.name} (id=${loc.id})`,
                    action: opt.text,
                    expected: `Interact with ${loc.name} (${opt.text})`,
                    actual: `Success (locChanged=${locChanged}, dialog=${dialogOpened}, chats=${JSON.stringify(newChats)})`,
                    severity: 'Working'
                });
            }

            if (movedPlane && pStart) {
                const backLoc = sdk.findNearbyLoc(/ladder|staircase|trapdoor|portal/i);
                if (backLoc) {
                    const backOpt = backLoc.optionsWithIndex.find(o => /climb|enter|use/i.test(o.text));
                    if (backOpt) {
                        await bot.interactLoc(backLoc, backOpt.text);
                        await sdk.waitForTicks(3);
                    }
                }
            }
        }
    }
}

await runScript(async (ctx) => {
    // Region 10: Draynor Manor Grounds, Ground Floor & barbarian path (m48_51, m48_52)
    await auditRegionWaypoints(
        ctx,
        'Region 10: Draynor Manor Grounds & Ground Floor (m48_51 & m48_52)',
        [
            { x: 3108, z: 3328, label: 'Draynor Manor Front Gate' },
            { x: 3108, z: 3352, label: 'Draynor Manor Front Entrance' },
            { x: 3126, z: 3359, label: 'Draynor Manor East Grounds / Compost / Fountain' },
            { x: 3092, z: 3360, label: 'Draynor Manor West Grounds / Cabbage Patch' },
        ]
    );
    flushRegionLog('Region 10: Draynor Manor Grounds & Ground Floor (m48_51 & m48_52)', [
        'Audited Draynor Manor gates, grounds, fountain, compost heap, and entrance doors.'
    ]);

    // Region 11: South Varrock, Champions' Guild & SW/SE Mines (m49_51, m50_51, m50_52, m51_52)
    await auditRegionWaypoints(
        ctx,
        "Region 11: South Varrock, Champions' Guild, Stone Circle & Mines (m49_51, m50_51, m50_52, m51_52)",
        [
            { x: 3180, z: 3367, label: 'South-West Varrock Mine' },
            { x: 3191, z: 3362, label: "Champions' Guild Exterior" },
            { x: 3205, z: 3365, label: 'South Varrock Dark Wizards Stone Circle' },
            { x: 3212, z: 3385, label: 'Varrock South Gate' },
            { x: 3286, z: 3365, label: 'South-East Varrock Mine' },
        ]
    );
    flushRegionLog("Region 11: South Varrock, Champions' Guild, Stone Circle & Mines (m49_51, m50_51, m50_52, m51_52)", [
        "Audited SW Varrock Mine, Champions' Guild entrance, Stone Circle, Varrock South Gate, and SE Varrock Mine."
    ]);

    // Region 12: Varrock Town, Square, Palace, Churches & East Bank (m49_52, m50_52, m50_53, m51_52)
    await auditRegionWaypoints(
        ctx,
        'Region 12: Varrock Town, Square, Palace, Churches & Banks (m49_52, m50_52, m50_53, m51_52)',
        [
            { x: 3185, z: 3436, label: 'Varrock West Bank' },
            { x: 3187, z: 3426, label: 'Varrock West Anvil House' },
            { x: 3212, z: 3428, label: 'Varrock Town Square & Fountain' },
            { x: 3229, z: 3398, label: 'Blue Moon Inn & Sword Shop' },
            { x: 3253, z: 3420, label: 'Varrock East Bank' },
            { x: 3254, z: 3447, label: 'Varrock Museum' },
            { x: 3255, z: 3482, label: 'Varrock Church of Saradomin' },
            { x: 3212, z: 3472, label: 'Varrock Palace Courtyard & Ground Floor' },
            { x: 3153, z: 3433, label: 'Varrock West Gate' },
        ]
    );
    flushRegionLog('Region 12: Varrock Town, Square, Palace, Churches & Banks (m49_52, m50_52, m50_53, m51_52)', [
        'Audited Varrock West Bank, West Anvils, Town Square, Blue Moon Inn, East Bank, Museum, Church, Palace Courtyard, and West Gate.'
    ]);

    // Region 13: Barbarian Village & Edgeville (m48_53 & m48_54)
    await auditRegionWaypoints(
        ctx,
        'Region 13: Barbarian Village & Edgeville (m48_53 & m48_54)',
        [
            { x: 3082, z: 3420, label: 'Barbarian Village Center & Mine' },
            { x: 3079, z: 3439, label: 'Barbarian Village Helmet Shop & Longhall' },
            { x: 3085, z: 3429, label: 'Barbarian Village Pottery House' },
            { x: 3093, z: 3491, label: 'Edgeville Bank & Center' },
            { x: 3078, z: 3495, label: 'Edgeville General Store & Ruined House' },
            { x: 3052, z: 3490, label: 'Edgeville Monastery Exterior' },
        ]
    );
    flushRegionLog('Region 13: Barbarian Village & Edgeville (m48_53 & m48_54)', [
        'Audited Barbarian Village mine, longhall, pottery oven/wheel, Edgeville bank, ruined houses, and Monastery exterior.'
    ]);
}, {
    bot: 'bot4',
    disconnectAfter: true,
    timeout: 600_000,
});
