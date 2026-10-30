# Luna bot architecture

Luna is a private JoshRS development bot. It is not an official RuneScape
client bot and is intended only for the locally controlled JoshRS server.

## Design decision

Luna is being moved from a packet-only probe into a server-owned `BotPlayer`.
That makes her a normal `Player` entity for collision, movement, appearance,
zone visibility, player-update encoding, persistence and interaction
validation. She has no graphical client and does not need Elrothiro's account
or credentials.

The bot must use ordinary server actions. A planner may choose a goal, but the
engine remains authoritative for pathfinding, collision, inventory changes,
combat, dialogue, trading and rewards.

## Control layers

1. Perception: nearby players, NPCs, objects, inventory, skills, health,
   location, chat and active interaction.
2. Goal planner: selects a durable goal such as train, bank, resupply, travel,
   socialize or recover.
3. Task executor: performs small deterministic actions with preconditions and
   postcondition checks.
4. Recovery: retries, replans or returns to a safe location after a blocked
   path, missing item, death, full inventory or failed interaction.
5. Personality: controls route preferences, chat frequency, risk tolerance and
   schedule without bypassing game rules.

An optional local language model may propose conversation or high-level goals.
It must not directly mutate player state, grant items, bypass collision or
issue unchecked protocol actions.

## First vertical slice

The initial native slice is deliberately small and observable: Luna is spawned
as a visible player in Lumbridge, walks between safe waypoints, speaks at goal
transitions and remains online without a client socket. Woodcutting, banking,
social interaction and persistence are the next task layers.

## Acceptance evidence

- Luna appears in the normal player-update stream for nearby clients.
- Her movement is processed by the same collision and tick pipeline as a human
  player.
- A blocked route causes a replan rather than a teleport.
- Her save is separate from `elrothiro.sav`.
- A bot regression test can run without starting a graphical client.
