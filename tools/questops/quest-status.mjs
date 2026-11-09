#!/usr/bin/env node
// Build the definitive per-quest status table: target list vs content vs bot evidence.
//
// Inputs:
//   --content <dir>   a revision content checkout (scripts/quests)
//   --log <file>      a bot lab log used as in-game evidence (repeatable)
//   --out <file>      markdown output
//
// The target list below is transcribed from the owner's quest spreadsheet (name + QP).
// If the sheet changes, edit TARGETS rather than the generated output.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const arg = (n, d) => {
    const i = process.argv.indexOf(`--${n}`);
    return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const contentDir = arg('content');
const outFile = arg('out', null);
if (!contentDir) {
    console.error('usage: quest-status.mjs --content <dir> [--log FILE ...] [--out FILE]');
    process.exit(2);
}
const logs = [];
for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--log' && process.argv[i + 1]) logs.push(process.argv[i + 1]);
}

// name, QP from the owner's sheet. Order is the sheet's own ordering.
const TARGETS = [
    ["Cook's Assistant", 1], ['Demon Slayer', 3], ['Romeo & Juliet', 5], ['Sheep Shearer', 1],
    ['Shield of Arrav', 1], ['The Restless Ghost', 1], ['Ernest the Chicken', 4], ['Vampyre Slayer', 3],
    ['Imp Catcher', 1], ['Prince Ali Rescue', 3], ["Black Knights' Fortress", 3], ["Doric's Quest", 1],
    ["The Knight's Sword", 1], ["Witch's Potion", 1], ['Goblin Diplomacy', 5], ["Pirate's Treasure", 2],
    ['Dragon Slayer I', 2], ['Druidic Ritual', 4], ["Heroes' Quest", 1], ['Lost City', 3],
    ["Merlin's Crystal", 6], ["Witch's House", 4], ["Alfred Grimhand's Barcrawl", 0], ['Scorpion Catcher', 1],
    ['Family Crest', 1], ['Tribal Totem', 1], ['Fishing Contest', 1], ["Monk's Friend", 1],
    ['Clock Tower', 1], ['Temple of Ikov', 1], ['Fight Arena', 2], ['Holy Grail', 2],
    ['Tree Gnome Village', 2], ['Hazeel Cult', 1], ['Sheep Herder', 4], ['Plague City', 1],
    ['Sea Slug', 1], ['Waterfall Quest', 1], ['Biohazard', 3], ['Jungle Potion', 1],
    ['The Grand Tree', 5], ['Shilo Village', 2], ['Underground Pass', 5], ['Observatory Quest', 2],
    ['The Tourist Trap', 2], ['Watchtower', 4], ['Dwarf Cannon', 1], ['Murder Mystery', 3],
    ['The Dig Site', 2], ["Gertrude's Cat", 1], ["Legends' Quest", 4], ['Mage Arena I', 0],
    ['Rune Mysteries', 1], ['Big Chompy Bird Hunting', 2], ['Elemental Workshop I', 1], ['Priest in Peril', 1],
    ['Nature Spirit', 2], ['Death Plateau', 1], ['Troll Stronghold', 1], ['Tai Bwo Wannai Trio', 2],
    ['Regicide', 3], ["Eadgar's Ruse", 1], ["Shades of Mort'ton", 3], ['The Fremennik Trials', 3],
    ['Horror from the Deep', 2], ['Throne of Miscellania', 1], ['Monkey Madness I', 3], ['Haunted Mine', 2],
    ['Troll Romance', 2], ['In Search of the Myreque', 2], ['Creature of Fenkenstrain', 2], ['Roving Elves', 1],
    ['Ghosts Ahoy', 2], ['One Small Favour', 2], ['Mountain Daughter', 2], ['Between a Rock...', 2],
    ['The Feud', 1], ['The Golem', 1], ['Desert Treasure I', 3], ["Icthlarin's Little Helper", 2],
    ['Tears of Guthix', 1], ['Zogre Flesh Eaters', 1], ['The Giant Dwarf', 2], ['The Lost Tribe', 1],
    ['Enter the Abyss', 0], ['Recruitment Drive', 1], ["Mourning's End Part I", 2],
    ['Curse of the Empty Lord', 0]
];

// Content names quests after NPCs or items, not titles, so explicit aliases are required.
// Several were initially wrong and are corrected here after checking each directory's NPCs:
// quest_zanaris = Lost City, quest_fluffs = Gertrude's Cat, quest_desertrescue = Prince Ali
// Rescue, quest_drunkmonk = Monk's Friend, quest_troll = Troll Romance, quest_cog = Clock Tower,
// quest_druidspirit = Nature Spirit, quest_viking = The Fremennik Trials, quest_upass =
// Underground Pass, quest_mortton = Shades of Mort'ton, quest_tbwt = Tai Bwo Wannai Trio.
const ALIAS = {
    "cook's assistant": 'quest_cook',
    'demon slayer': 'quest_demon',
    'romeo & juliet': 'quest_romeojuliet',
    'sheep shearer': 'quest_sheep',
    'shield of arrav': 'quest_blackarmgang',
    'the restless ghost': 'quest_priest',
    'ernest the chicken': 'quest_haunted',
    'vampyre slayer': 'quest_vampire',
    'imp catcher': 'quest_imp',
    'prince ali rescue': 'quest_desertrescue',
    "black knights' fortress": 'quest_blackknight',
    "doric's quest": 'quest_doric',
    "the knight's sword": 'quest_squire',
    "witch's potion": 'quest_hetty',
    'goblin diplomacy': 'quest_gobdip',
    "pirate's treasure": 'quest_hunt',
    'dragon slayer i': 'quest_dragon',
    'druidic ritual': 'quest_druid',
    "heroes' quest": 'quest_hero',
    'lost city': 'quest_zanaris',
    "merlin's crystal": 'quest_arthur',
    "witch's house": 'quest_ball',
    "alfred grimhand's barcrawl": 'quest_barcrawl',
    'scorpion catcher': 'quest_scorpcatcher',
    'family crest': 'quest_crest',
    'tribal totem': 'quest_totem',
    'fishing contest': 'quest_fishingcompo',
    "monk's friend": 'quest_drunkmonk',
    'clock tower': 'quest_cog',
    'temple of ikov': 'quest_ikov',
    'fight arena': 'quest_arena',
    'holy grail': 'quest_grail',
    'tree gnome village': 'quest_tree',
    'hazeel cult': 'quest_hazeelcult',
    'sheep herder': 'quest_sheepherder',
    'plague city': 'quest_elena',
    'sea slug': 'quest_seaslug',
    'waterfall quest': 'quest_waterfall',
    biohazard: 'quest_biohazard',
    'jungle potion': 'quest_junglepotion',
    'the grand tree': 'quest_grandtree',
    'shilo village': 'quest_shilo',
    'underground pass': 'quest_upass',
    'observatory quest': 'quest_observatory',
    'the tourist trap': 'quest_tourist',
    watchtower: 'quest_itwatchtower',
    'dwarf cannon': 'quest_mcannon',
    'murder mystery': 'quest_murder',
    'the dig site': 'quest_itexam',
    "gertrude's cat": 'quest_fluffs',
    "legends' quest": 'quest_legends',
    'mage arena i': 'quest_magearena',
    'rune mysteries': 'quest_runemysteries',
    'big chompy bird hunting': 'quest_chompybird',
    'elemental workshop i': 'quest_elemental_workshop',
    'priest in peril': 'quest_priestperil',
    'nature spirit': 'quest_druidspirit',
    'death plateau': 'quest_death',
    'troll stronghold': 'quest_trollstronghold',
    'tai bwo wannai trio': 'quest_tbwt',
    regicide: 'quest_regicide',
    "eadgar's ruse": 'quest_eadgar',
    "shades of mort'ton": 'quest_shades',
    'the fremennik trials': 'quest_viking',
    'horror from the deep': 'quest_horror',
    'throne of miscellania': 'quest_miscellania',
    'monkey madness i': 'quest_monkeymadness',
    'haunted mine': 'quest_hauntedmine',
    'troll romance': 'quest_troll',
    'in search of the myreque': 'quest_myreque',
    'creature of fenkenstrain': 'quest_fenkenstrain',
    'roving elves': 'quest_rovingelves',
    'ghosts ahoy': 'quest_ghostsahoy',
    'one small favour': 'quest_osf',
    'mountain daughter': 'quest_mountaindaughter',
    'between a rock...': 'quest_betweenarock',
    'the feud': 'quest_feud',
    'the golem': 'quest_golem',
    'desert treasure i': 'quest_deserttreasure',
    "ictlharin's little helper": 'quest_ics',
    'tears of guthix': 'quest_tog',
    'zogre flesh eaters': 'quest_zogre',
    'the giant dwarf': 'quest_giantdwarf',
    'the lost tribe': 'quest_losttribe',
    'enter the abyss': 'quest_abyss',
    'recruitment drive': 'quest_recruitment',
    "mourning's end part i": 'quest_mourning',
    'curse of the empty lord': 'quest_curse'
};

const questsRoot = join(contentDir, 'scripts/quests');
const present = new Set(
    readdirSync(questsRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
);

// Bot evidence: capture bolded quest names from any lab log provided.
const verified = new Set();
for (const log of logs) {
    if (!existsSync(log)) continue;
    // Only the numbered quest list counts as evidence. Matching every bold string would
    // count prose mentions ("working on X") as completions and overstate the result.
    for (const m of readFileSync(log, 'utf8').matchAll(/^\d+\. \*\*([^*]+)\*\*/gm)) {
        verified.add(m[1].toLowerCase().replace(/'/g, '').trim());
    }
}

const rows = TARGETS.map(([name, qp], idx) => {
    const key = name.toLowerCase();
    const dir = key in ALIAS ? ALIAS[key] : null;
    const inContent = dir ? present.has(dir) : false;
    const botVerified = [...verified].some((v) => v === name.toLowerCase().replace(/'/g, '') || v.includes(name.toLowerCase().replace(/'/g, '')));
    return { n: idx + 1, name, qp, dir, inContent, botVerified };
});

const presentCount = rows.filter((r) => r.inContent).length;
const verifiedCount = rows.filter((r) => r.botVerified).length;

const lines = [];
lines.push('# Quest target status — the owner\'s list against reality');
lines.push('');
lines.push('Generated by `tools/questops/quest-status.mjs`. Do not hand-edit; edit `TARGETS`/`ALIAS`.');
lines.push('');
lines.push('Three separate facts per quest, never merged into one "done" flag:');
lines.push('');
lines.push('- **Content** — a directory exists in the revision-274 content');
lines.push('- **Bot** — named in a bot lab log as completed in-game (against the **377** world at 25× XP)');
lines.push('- **QP** — quest points from the owner\'s sheet');
lines.push('');
lines.push(`\`\`\`
target quests : ${rows.length}
present in 274: ${presentCount}
bot-verified  : ${verifiedCount}  (377 world)
absent        : ${rows.length - presentCount}
\`\`\``);
lines.push('');
lines.push('| # | Quest | QP | Content | Bot | Content dir |');
lines.push('|---|---|---|---|---|---|');
for (const r of rows) {
    lines.push(
        `| ${r.n} | ${r.name} | ${r.qp || '—'} | ${r.inContent ? 'yes' : '**no**'} | ${r.botVerified ? 'yes' : '—'} | ${r.inContent && r.dir ? `\`${r.dir}\`` : '—'} |`
    );
}

lines.push('');
lines.push('## Absent from the 274 content');
lines.push('');
const absent = rows.filter((r) => !r.inContent);
if (absent.length === 0) lines.push('_None._');
for (const r of absent) lines.push(`- #${r.n} ${r.name} (QP ${r.qp})`);

// Quests released well before the 274 era (roughly May 2004) that are missing from the
// content pack. Their absence is a content gap, not an era boundary.
const PRE_ERA = new Set([
    'Shilo Village', 'Observatory Quest', 'The Tourist Trap', 'Mage Arena I',
    'Temple of Ikov', 'Holy Grail', 'Tree Gnome Village'
]);
const anomalies = rows.filter((r) => !r.inContent && PRE_ERA.has(r.name));
if (anomalies.length) {
    lines.push('');
    lines.push('## Absent despite predating the revision');
    lines.push('');
    lines.push('These quests were released before the revision-274 era, so they *should* exist. Their');
    lines.push('absence is a gap in the content pack rather than an era boundary:');
    lines.push('');
    for (const r of anomalies) lines.push(`- #${r.n} ${r.name} (QP ${r.qp})`);
}

lines.push('');
lines.push('## Present but never bot-verified');
lines.push('');
const unverified = rows.filter((r) => r.inContent && !r.botVerified);
for (const r of unverified) lines.push(`- #${r.n} ${r.name}`);

const report = lines.join('\n');
if (outFile) {
    writeFileSync(outFile, report);
    console.log(`wrote ${outFile}`);
} else {
    console.log(report);
}
console.log(`targets=${rows.length} present=${presentCount} verified=${verifiedCount} absent=${rows.length - presentCount}`);
