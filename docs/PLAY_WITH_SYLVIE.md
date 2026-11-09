# Playing with Sylvie — family LAN guide

A private RuneScape world running on **your phone**, playable from any browser on the home
network. No internet, no accounts on external services, no strangers, no public chat.

---

## 1. Start the world

From Termux:

```bash
cd ~/projects/JoshRS
./tools/play274/start-playable-274.sh --lan
```

It prints something like:

```
allowed origin: http://10.8.0.1:8888
bind host: 10.8.0.1 (management port stays on loopback)
READY: http://10.8.0.1:8888/rs2.cgi
```

If the address it detects is not the one your devices use, pass it explicitly:

```bash
./tools/play274/start-playable-274.sh --lan 192.168.1.37
```

Check on it any time:

```bash
./tools/play274/start-playable-274.sh --status
```

Stop it:

```bash
./tools/play274/start-playable-274.sh --stop
```

## 2. Connect

Open this on **every** device — yours, Sylvie's, a laptop:

```
http://10.8.0.1:8888/rs2.cgi
```

Works in Chrome, Edge, Firefox or Safari on Android, Mac, Windows and Linux. Nothing to
install. Type a username and password on the login screen and the account is created on
first use.

> **Use the same host in the URL on every device.** The world only answers on its LAN
> address, and only a browser whose origin matches will be accepted. `127.0.0.1` from
> another device will not work — that's your phone's own loopback.

### If it does not load

| Symptom | Cause |
|---|---|
| Page never loads | Devices on different networks (e.g. one on Wi-Fi, one on mobile data), or the phone's address changed |
| Page loads, then "connection lost" | Origin mismatch — check you used the exact URL printed by `--lan` |
| Everything works, then drops after minutes | Idle timeout; already raised to **72 minutes**. Restart with a higher value if needed |
| Loads once, dead after phone sleeps | Termux was killed. Re-run `--lan`; the world reloads in ~90s |

## 3. Keeping it running

- A **wake lock** is taken automatically so Android doesn't kill the server.
- The server lives inside Termux. Closing Termux ends the world.
- Restarting is safe: characters save server-side and reload on next login.

## 4. What is safe by design

- **No WAN exposure.** The world binds one private address. Management stays on loopback.
  Non-private addresses are refused outright.
- **Origin allowlist.** A page from any other origin is rejected `401`.
- **No public chat, no strangers.** Only devices that can reach your LAN address can join.
- **Separate from production.** This is `~/lc274`, a fresh world. It cannot touch the 377
  world, its accounts, or Elrothiro's saves.

## 5. Is the content okay for a 4-year-old?

Revision 274 is **May 2004**, so there is no Necromancy (2023) and no Summoning (2008) —
the things you specifically wanted excluded simply do not exist in this era.

What *is* present: combat, skeletons, zombies, and PvP in the Wilderness. If you want a
gentler experience for her, the practical options are, cheapest first:

1. **Play alongside her.** Talk to NPCs, do Cook's Assistant and Sheep Shearer, avoid the
   Wilderness. No code needed.
2. **A "peaceful" profile** — remove aggressive NPC spawns around Lumbridge and disable PvP
   in the world config. Contained content edits, reversible.
3. **A companion NPC** that follows her around — a genuinely nice fit for the roadmap's P10
   "friendly companion NPCs", and a small scripted addition.

Say which you'd like and it can be built and tested.

## 6. Honest status

| Item | State |
|---|---|
| World runs on the phone | **verified** |
| Plays in a browser | **verified** (served client + WebSocket handshake) |
| Elrothiro logs in and persists | **verified** (`elrothiro.sav`, `0x2004` v7, at Lumbridge 3218,3218) |
| LAN bind + origin rejection | **verified** (`200` on LAN, `401` for foreign origin) |
| **Two devices at once** | **not yet verified** — needs a second physical device |
| Cross-platform | expected (browser), not yet tested on Mac/Windows/Linux |

The one thing nobody has tested yet is two real devices connected simultaneously. That's
the next step whenever you're both free.
