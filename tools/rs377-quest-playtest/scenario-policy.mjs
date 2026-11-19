export function validateScenario(scenario) {
    if (!scenario || !/^[a-z0-9_ ]{1,12}$/i.test(scenario.user ?? '') || !Array.isArray(scenario.steps)) throw new Error('Invalid disposable scenario.');
    if (scenario.mode && !['normal', 'assisted'].includes(scenario.mode)) throw new Error('Unknown scenario mode.');
    if (scenario.mode === 'normal' && scenario.steps.some(s => s.cheat || s.tele)) throw new Error('Normal-action scenarios cannot use cheats or teleports.');
    return scenario.mode === 'normal' ? 'normal' : 'assisted';
}
export const le2 = v => Buffer.from([v & 255, (v >> 8) & 255]);
export const alt2 = v => Buffer.from([(v >> 8) & 255, (v + 128) & 255]);
export const alt3 = v => Buffer.from([(v + 128) & 255, (v >> 8) & 255]);
export function locClick(x, z, id) { return Buffer.concat([alt2(x), le2(z), le2(id)]); }
export function walkClick(x, z) { return Buffer.concat([alt3(x), Buffer.from([0]), alt3(z)]); }
