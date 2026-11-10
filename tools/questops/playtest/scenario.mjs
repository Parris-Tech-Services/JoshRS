// Pure logic for the server-side playtest harness: scenario validation and dialogue option matching.
// No engine imports, so it is covered by `npm test` in CI. The engine-facing driver is harness.ts.

export const STEP_KINDS = {
    teleport: ['x', 'z'],          // level optional (default 0)
    expectNpcNear: ['npc'],        // radius optional (default 3); x/z/level default to the player
    talk: ['npc'],                 // op optional (default 1 = Talk-to)
    choose: ['option'],            // substring of a visible dialogue option, case-insensitive
    continue: [],                  // "Click here to continue", repeated up to `times` (default 1)
    continueAll: [],               // keep continuing until no dialogue is waiting (max 50)
    expectDialogue: ['text'],      // substring seen in any dialogue/chat line since the last talk
    setVar: ['varp', 'value'],
    expectVar: ['varp', 'value'],
    expectPerm: ['varp'],          // varp is scope=perm, so Player.save() writes it
    saveReload: [],                // save, reload through PlayerLoading, keep checking on the reloaded player
    ticks: ['n'],
    dump: [],                      // print the current dialogue screen (to write the next steps)
};

/** Returns a list of problems; empty means the scenario is well-formed. */
export function validateScenario(s) {
    const errs = [];
    if (!s || typeof s !== 'object') return ['scenario is not an object'];
    if (typeof s.name !== 'string' || !s.name) errs.push('missing name');
    if (!Array.isArray(s.steps) || s.steps.length === 0) errs.push('missing steps');
    (s.steps || []).forEach((step, i) => {
        const kind = Object.keys(STEP_KINDS).find((k) => step?.do === k);
        if (!kind) { errs.push(`step ${i + 1}: unknown do "${step?.do}"`); return; }
        for (const f of STEP_KINDS[kind]) if (step[f] === undefined) errs.push(`step ${i + 1} (${kind}): missing ${f}`);
    });
    return errs;
}

/**
 * Pick the dialogue button to press. `buttons` are component ids the paused script will resume on;
 * `texts` maps component id -> last text the server set on it. Matching is a case-insensitive
 * substring after stripping colour tags (<col=...>). Returns { com } or { error, options }.
 */
export function pickOption(buttons, texts, want) {
    const clean = (t) => String(t ?? '').replace(/<[^>]*>/g, '').trim();
    const options = buttons.map((com) => ({ com, text: clean(texts.get(com)) })).filter((o) => o.text);
    const w = want.toLowerCase();
    const hits = options.filter((o) => o.text.toLowerCase().includes(w));
    if (hits.length === 1) return { com: hits[0].com };
    const exact = hits.filter((o) => o.text.toLowerCase() === w);
    if (exact.length === 1) return { com: exact[0].com };
    return { error: hits.length ? `"${want}" is ambiguous` : `no option matching "${want}"`, options: options.map((o) => o.text) };
}
