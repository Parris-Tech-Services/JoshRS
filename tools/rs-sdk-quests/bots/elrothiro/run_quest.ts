import { runQuests } from '../lib/quest-kit';
import { ALL } from '../lib/quests';

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error('Usage: bun bots/elrothiro/run_quest.ts <questKey...>');
  process.exit(1);
}

const quests = names.map((n) => {
  const q = (ALL as Record<string, any>)[n];
  if (!q) {
    console.error(`Unknown quest key: ${n}. Available: ${Object.keys(ALL).join(', ')}`);
    process.exit(1);
  }
  return q;
});

await runQuests(import.meta.dir, quests);
