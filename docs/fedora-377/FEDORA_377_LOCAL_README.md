# JoshRS #377 local installation

This checkout is the matching `377-wip` engine/content with the Java #377 client. The client uses port offset `8808`, so it connects to game port `52402` and update HTTP port `8888`.

## Start

From this directory:

```sh
./start-server.sh
```

In another terminal, start the client:

```sh
./start-client.sh
```

The client launcher uses the user service `joshrs-client.service`, so closing
the launching terminal or ending an agent session does not close the game.
Repeating the command leaves a running client untouched. New service launches
retry abnormal exits after five seconds, limited to three starts per minute;
closing the game normally does not relaunch it. Client output is retained in
`/tmp/joshrs-client-persistent.log`. Read its state without interrupting play:

```sh
systemctl --user status joshrs-client --no-pager
tail -40 /tmp/joshrs-client-persistent.log
```

Never restart the live server or client during play to apply a change. Test
changes in the separate test world and defer deployment until an explicitly
agreed interruption. A request to continue work does not authorize a disconnect.

Or start both with one command:

```sh
./start-joshrs.sh
```

For optional local autologin, enter the password without placing it in shell history or source files:

```sh
read -rsp 'JoshRS password: ' JOSHRS_PASSWORD; echo
export JOSHRS_PASSWORD
./start-client.sh
unset JOSHRS_PASSWORD
```

The client defaults the username to `elrothiro`. Without `JOSHRS_PASSWORD`, it only prefills that username and waits for normal manual login.

Check health without stopping or killing any process:

```sh
./status-joshrs.sh
```

## World map and teleport network

Open the interactive Gielinor map with `M`, `Ctrl+M`, `F8`, the toolbar button, or the minimap `World Map (M)` button. Close it with the same toggle or `Close (M)`. While open, the map owns mouse input; closing it returns input to the game.

The map supports zoom, pan, search, category/region filters, favourites, recent destinations, player centering, dangerous-destination confirmation, and the Varrock portal hub. Selecting a destination closes the map before the server validates and performs the teleport. The customised client intentionally keeps the legacy purple teleport animation disabled because it caused the local player model to disappear after region rebuilds.

The map UI regression suite is:

```sh
cd client-java
java -cp build/classes/java/main jagex2.client.WorldMapOverlayTest
```

The engine teleport and candle regression checks are:

```sh
cd engine
./node_modules/.bin/tsx tools/test/TeleportNetworkTest.ts
./node_modules/.bin/tsx tools/test/CandlelightRegression.ts
./node_modules/.bin/tsx tools/test/CandlelightCommandRegression.ts
```

The candle checks cover script state, active pillar locs, interface controls, completion/reward logic, and disconnect recovery. Final visual candle gameplay still requires an authenticated interactive client session.

The server is single-instance. Repeating its start command detects the existing JoshRS PID and exits safely. It never terminates unrelated Node or Java processes. Server output from the combined launcher is in `engine/logs/server.log`.

The existing player save is `engine/data/players/main/elrothiro.sav`; a pre-repair backup is kept in the timestamped `.pre-repair-backup-*` directory.
