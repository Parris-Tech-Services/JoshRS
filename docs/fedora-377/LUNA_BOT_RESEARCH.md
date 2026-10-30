# Luna bot research notes

Research was performed on 30 October 2026 for the JoshRS private server.

The strongest relevant implementations use server-side persistent player
characters rather than pretending to be NPCs or relying on a graphical client:

- [Lost City Singleplayer Progressive](https://lostcity.rs/t/mod-lost-city-singleplayer-progressive/15318)
  describes `BotPlayer`, `BotAction`, `BotGoalPlanner` and skill-specific
  tasks as separate layers.
- [OpenMU server-side AI bots](https://openmu-docs.munique.net/server-features/bots/)
  describes persistent bot accounts, navigator decisions, scheduled AI ticks
  and reuse of regular player actions and validations.
- [RS-SDK](https://github.com/MaxBittker/rs-sdk) distinguishes sending a
  client action from proving that the server applied its intended effect. This
  supports server-authoritative verification in JoshRS.
- [rs-majula engine architecture](https://github.com/RustCityRS/rs-majula/blob/main/rs-engine/README.md)
  documents deterministic tick processing, collision/pathfinding and a
  single authoritative world loop as useful emulator design constraints.

## Conclusions for JoshRS

The packet client remains valuable for protocol regression and authenticated
client tests, but it is not the best long-term gameplay architecture. Luna's
gameplay should live beside the world tick and call the same validated player
operations that human input eventually reaches.

Behavior trees or goal-oriented planning are preferable to an unrestricted
LLM loop. They provide inspectable preconditions, bounded work per tick,
deterministic regression tests and safe recovery. An LLM can enrich dialogue
and select among approved goals, but should not control item ownership or
server state directly.
