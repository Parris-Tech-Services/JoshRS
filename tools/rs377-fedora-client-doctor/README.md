# Fedora rev377 game-loop crash: invalid NPC facing index

**Incident observed:** 9 November 2026, AVANCE-WS7 Fedora client.
The user's persistent client log showed the same game-update-thread
exception twice:

~~~text
java.lang.ArrayIndexOutOfBoundsException: Index 32767 out of bounds for length 16384
    at jagex2.client.Client.updateFacingDirection(Client.java:5400)
    at jagex2.client.Client.updateEntity(Client.java:5226)
    at jagex2.client.Client.updatePlayers(Client.java:5183)
    at jagex2.client.Client.updateGame(Client.java:3237)
~~~

The upstream revision 377 client checks NPC-facing indices below 32768
but does not check its actual NPC array length (16384) before indexing.
A malformed index such as 32767 throws on the game-update thread; the Java
window can remain open and appear frozen. Java 25 and Wayland are not
confirmed causes of this particular exception.

Upstream reference: LostCityRS/Client-Java, branch 377, file
src/main/java/jagex2/client/Client.java (updateFacingDirection).

## Safety

This source-only patch does not restart the Node server, touch player saves,
change the protocol, or change Git worktrees. Default inspection is read-only.
Applying requires --apply and refuses while joshrs-client.service is active.
It creates a private timestamped Client.java backup and verifies SHA-256
before atomically replacing only that source file. Unknown customised
methods fail closed. Both NPC and player-facing target indexes are guarded
against the actual array lengths. Valid facing behaviour is unchanged.
The origin of the invalid 32767 target remains a separate server/packet
investigation.

## Fedora inspect and repair

The user's normal JoshRS-quest-runner worktree has been reported dirty.
Never git reset, clean or force-pull it. Use an up-to-date separate checkout
of JoshRS with this script.

With the server running, read-only inspect:

~~~bash
python3 tools/rs377-fedora-client-doctor/guard_facing_indices.py
~~~

PATCH_AVAILABLE means source matches and nothing was changed.
ALREADY_GUARDED means the guard exists. BLOCKED requires manual inspection.

Log out in-game and close ONLY the Java client, not the game server.
Verify:

~~~bash
systemctl --user is-active joshrs-client.service
~~~

Only when the client unit is inactive and PATCH_AVAILABLE was reported:

~~~bash
python3 tools/rs377-fedora-client-doctor/guard_facing_indices.py --apply
cd ~/dev/JoshRS/lostcity377/client-java
./gradlew classes --no-daemon
~~~

After compilation, launch the original client:

~~~bash
cd ~/dev/JoshRS/lostcity377
bash ./start-client.sh
~~~

Test Elrothiro's real login, walking, NPC facing, and multiplayer, including
the action that previously triggered the exception. Watch the log:

~~~bash
grep -n -B 3 -A 12 -E 'ArrayIndexOutOfBoundsException|updateFacingDirection' /tmp/joshrs-client-persistent.log | tail -n 100
~~~

The log is append-only: previous exceptions remain. Correlate with the
new client launch to distinguish old from newly occurring errors.

## Rollback

The tool prints a BACKUP_VERIFIED path after applying. If needed, log out
and close ONLY the client, preserve the faulty file for analysis, restore
the matching verified backup manually, and recompile. Never restore over
the running client or alter server/player saves.

## Offline regression tests

~~~bash
python3 -m unittest -v tools/rs377-fedora-client-doctor/test_guard_facing_indices.py
python3 -m py_compile tools/rs377-fedora-client-doctor/guard_facing_indices.py
~~~

Tests cover patch matching, repeated applications, backup and active
client refusal. They do not prove in-game correctness.

## Agy / FedoraCrashDoctor handoff

1. Inspect the real local Client.java and confirm field1156 is the incoming
   facing target which reached NPC index 32767.
2. Inspect the patch, apply it only when the client is inactive; leave the
   game server and saves untouched.
3. Rebuild and verify the actual 377 Java client, real movement and NPC
   updates, and a session without newly occurring game-thread exceptions.
4. Update FedoraCrashDoctor's runescape-addon to discover the existing
   joshrs-client.service, client classpath, and persistent log automatically.
   Do not start a second competing watchdog; systemd already restarts it.
5. Investigate which server or packet supplied the invalid 32767 index.
   Do not hide unrelated malformed packets.
6. Report VERIFIED COMPLETE only after live gameplay and post-relog
   regression proof. A compiled Java class alone is PARTIALLY COMPLETE.
