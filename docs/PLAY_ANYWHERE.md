# Play anywhere — Android, Windows, Mac, Linux

One world, one content pack, any browser. No client to install on any platform.

---

## The shape of it

```
        ┌─────────────────────────────┐
        │  SERVER  (Node 24+)         │
        │  holds: world, content,     │
        │         characters, saves   │
        └───────────┬─────────────────┘
                    │  http://<server>:8888/rs2.cgi
    ┌───────────────┼───────────────┬────────────────┐
    │               │               │                │
 Android         Windows          Mac              Linux
 (Chrome)      (Edge/Chrome)    (Safari/Chrome)   (Firefox/Chrome)
```

**Content lives on the server.** Quests, NPCs and dialogue are packed once, server-side.
Every device therefore sees the same quests the moment the server restarts — there is no
per-platform content step and no client update. That is the whole reason this shape was
chosen for a family setup.

## Two ways to run the server

### A. On the phone (current setup)

```bash
cd ~/projects/JoshRS
./tools/play274/start-playable-274.sh --lan
```

Prints the URL, e.g. `http://10.8.0.1:8888/rs2.cgi`. Then on every device, open that URL.

The phone must stay awake with Termux running (a wake lock is taken automatically).

### B. On a PC instead of the phone

Any machine with **Node.js 24+**, Git and Python 3:

| OS | Install | Then |
|---|---|---|
| Windows | [nodejs.org](https://nodejs.org) LTS, Git for Windows | `git clone` the repo, run the script in Git Bash |
| macOS | `brew install node git python3` | same |
| Linux | `sudo apt install nodejs npm git python3` | same |

```bash
git clone https://github.com/Parris-Tech-Services/JoshRS.git
cd JoshRS
./tools/play274/start-playable-274.sh --lan
```

The script is Bash, so on Windows use **Git Bash**. If the detected address is wrong, pass
it: `./tools/play274/start-playable-274.sh --lan 192.168.1.20`.

> Only one machine should run the server at a time. Two servers means two separate worlds.

## Connecting each platform

| Platform | Browser | Notes |
|---|---|---|
| **Android** | Chrome | Works today; touch controls |
| **Windows** | Edge or Chrome | Full keyboard |
| **macOS** | Safari or Chrome | Safari may need a moment on first canvas load |
| **Linux** | Firefox or Chrome | Firefox is the most-tested alternative canvas |

Use **the same host in the URL on every device** — the world only answers on its LAN
address, and the origin allowlist rejects anything else.

## Adding a quest

Quests are directories of ReScript plus configs:

```
content/scripts/quests/quest_cook/
├── configs/quest_cook.varp      quest stage variable
├── configs/quest_cook.loc       (optional) loc config
└── scripts/
    ├── quest_cook.rs2           the quest logic
    └── cook_journal.rs2         the journal text, via [if_button,questlist:cook]
```

Install and verify in one step:

```bash
./tools/questops/add-quest.sh /path/to/quest_myquest
```

It will:

1. **validate** — refuses without a `questlist:` handler (the quest would be invisible) or
   without a `.varp` (stage could not persist), and refuses to overwrite an existing quest;
2. copy the directory in;
3. restart the engine and wait for `World ready`;
4. **roll back automatically** if packing fails, so a broken quest can't leave a dead world.

Saves live in `engine/data/players/`, never in content, so installing quests cannot touch
characters.

Preview the checks without changing anything:

```bash
./tools/questops/add-quest.sh /path/to/quest_myquest --dry-run
```

## What is verified vs expected

| Claim | Status |
|---|---|
| Server runs on the phone, browser client plays | **verified** |
| Quest validator rejects missing varp / questlist | **verified** (dry run) |
| LAN bind + origin allowlist | **verified** |
| Same quests visible on every platform | **by construction** — content is server-side; not yet observed on a second device |
| Windows / Mac / Linux in practice | **expected**, not tested |
| Two devices at once | **not yet tested** |

The last three are the honest gaps. Everything content-related is platform-independent by
design, but "by design" is not the same as "seen working", and this table says so.
