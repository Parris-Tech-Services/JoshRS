# Luna bot research

Research date: 30 October 2026.

Relevant open-source designs:

- [Lost City Singleplayer Progressive](https://lostcity.rs/t/mod-lost-city-singleplayer-progressive/15318)
  separates `BotPlayer`, `BotAction`, `BotGoalPlanner` and skill tasks.
- [OpenMU server-side AI bots](https://openmu-docs.munique.net/server-features/bots/)
  uses persistent bot characters, navigator decisions, scheduled AI ticks and
  normal player actions and validations.
- [RS-SDK](https://github.com/MaxBittker/rs-sdk) distinguishes dispatching an
  action from proving that the server applied it, reinforcing server-side
  verification.
- [rs-majula engine architecture](https://github.com/RustCityRS/rs-majula/blob/main/rs-engine/README.md)
  documents deterministic ticks, collision/pathfinding and an authoritative
  world loop for a RuneScape emulator.

## JoshRS conclusion

The packet client remains useful for protocol regression tests, but gameplay
belongs beside the world tick. Behavior trees or goal-oriented planning give
us inspectable preconditions, bounded work, deterministic tests and recovery.
An LLM can enrich dialogue and select among approved goals, but deterministic
engine code must own item transfers, rewards, combat and movement.
