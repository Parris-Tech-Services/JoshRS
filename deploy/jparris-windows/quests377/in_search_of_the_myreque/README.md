# In Search of the Myreque (10 January 2005) - JoshRS original-dialogue bundle
Uncompiled. Copy to `<content>/scripts/quests/quest_route/`. Dialogue/stages/rewards are original JoshRS content.
From the 377 cache: `route_*` NPCs (Curpile Fyod, Cyreg, Veliaf, Sani, Radigad, Polmafi, Harold, Ivan Strom, Vanstrom Klause), varp `routequest`.
## Must do
- Add `scope=perm` to cache varp `routequest`; add `^route_complete`/QP to `quests.rs2`.
- Run the collision audit: Antigravity's private pass may already define some `route_*` triggers.
- Not implemented: Burgh de Rott/Canifis scenes (`burgh_*` NPCs), the boat journeys, Vanstrom's combat form, the Mort'ton rowboats,
  and quest requirements. Reward item shown on the scroll is a placeholder (`coins`).
- In Aid of the Myreque (22 Mar 2006) is NOT done: the cache holds only varps for it, so it needs a design pass first.
