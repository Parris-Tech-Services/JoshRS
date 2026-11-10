// Pure helpers for client-check.mjs (unit-tested; no browser).

/** 274 ::tele takes level,mapX,mapZ,localX,localZ (one map square = 64 tiles). */
export function teleCommand({ x, z, level = 0 }) {
    return `::tele ${level},${Math.floor(x / 64)},${Math.floor(z / 64)},${x % 64},${z % 64}`;
}

/** Share of near-black pixels in a canvas rectangle. `img` is { w, h, data: RGBA array }. */
export function viewportStats(img, r, threshold = 12) {
    let dark = 0, n = 0;
    for (let y = r.y; y < Math.min(img.h, r.y + r.h); y += 2) {
        for (let x = r.x; x < Math.min(img.w, r.x + r.w); x += 2) {
            const i = (y * img.w + x) * 4;
            if (img.data[i] <= threshold && img.data[i + 1] <= threshold && img.data[i + 2] <= threshold) dark++;
            n++;
        }
    }
    return { dark: n ? dark / n : 1, samples: n };
}

/** A missing region renders as an almost entirely black 3D view (the player model is all that draws). */
export function blackVerdict(stats, allowDark = false) {
    return { dark: stats.dark, black: !allowDark && stats.dark > 0.9 };
}

export function validateCheckpoints(plan) {
    const errs = [];
    if (!plan || !Array.isArray(plan.checkpoints) || !plan.checkpoints.length) return ['missing checkpoints'];
    plan.checkpoints.forEach((c, i) => {
        if (!c.name) errs.push(`checkpoint ${i + 1}: missing name`);
        for (const k of ['x', 'z']) if (!Number.isInteger(c[k]) || c[k] < 0) errs.push(`checkpoint ${i + 1}: ${k} must be a tile coordinate`);
        if (c.level !== undefined && ![0, 1, 2, 3].includes(c.level)) errs.push(`checkpoint ${i + 1}: level must be 0-3`);
    });
    return errs;
}
