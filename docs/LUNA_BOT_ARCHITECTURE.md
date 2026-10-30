# JoshRS Luna bot architecture

Luna is a private JoshRS development bot for the locally controlled #377
server. The long-term design is a server-owned player, not an NPC disguise or
an external automation client.

## Design

Luna should use the ordinary player entity and server validation pipeline for
movement, collision, appearance, inventory, combat, dialogue, trading,
persistence and player updates. A graphical client is optional; the player
must remain visible to nearby real clients through the normal player-update
stream.

The control layers are:

1. Perception of nearby players, NPCs, objects, inventory, skills, location,
   health, chat and active interactions.
2. A durable goal planner for training, banking, resupply, travel, recovery
   and social activity.
3. Small deterministic task actions with explicit preconditions and verified
   postconditions.
4. Recovery and replanning for blocked paths, missing items, death, full
   inventory and failed interactions.
5. Personality settings for route preferences, chat frequency, risk tolerance
   and schedule.

An optional local language model may propose conversation or choose among
approved goals. It must not directly mutate game state, grant items, bypass
collision or issue unchecked actions.

## First vertical slice

The first native engine slice spawns Luna as a visible player in Lumbridge,
walks her through collision-aware waypoints, and lets her speak at goal
transitions. Woodcutting, banking, social interaction and persistent goal
memory are the next task layers.

## Acceptance criteria

- Luna appears through the normal player-update stream.
- Movement uses the normal collision and tick pipeline.
- A blocked route causes a replan rather than a teleport.
- Luna's save is separate from `elrothiro.sav`.
- Bot tests can run without a graphical client.
