# JoshRS #377 publication notice

## Provenance

This integration contains custom changes from these private local checkouts:

| Component | Upstream | Branch/base | Local tip |
| --- | --- | --- | --- |
| Engine | `LostCityRS/Engine-TS` | `377-wip` / `b5ac859b` | `9216fd4f` |
| Content | `LostCityRS/Content` | `377-wip` / `44eab090` | `8d1a68b9` |
| Client | `LostCityRS/Client-Java` | `377` / `327880f6` | `904818fd` |

The patch files preserve the local changes without copying the complete
upstream repositories into JoshRS. The destination repository's existing web
application is unchanged.

## Licence and asset boundary

Engine and Content identify their source code as MIT licensed and retain their
upstream copyright notices. This repository does not relicense upstream code;
the patches remain subject to the upstream notices and licences.

Client-Java has no machine-detected licence declaration in its upstream
repository, so its provenance is recorded here and no standalone licence claim
is made for it.

Content explicitly states that extracted game assets are Jagex Ltd property and
are not covered by the MIT licence. The following are deliberately excluded:

- `elrothiro.sav`, account data, databases, `.env` files, passwords, and keys;
- `data/config/private.pem` and `data/config/public.pem`;
- `node_modules`, build output, logs, PID files, and caches;
- extracted game archives, models, sprites, music, maps, and other runtime
  assets, including `worldmap_377.png`;
- the local `Archive.zip` and other unreviewed third-party material.

The account-specific save-preservation regression and optional local autologin
change were intentionally not published. They remain available only in the
private checkout and are not required to reconstruct the public-safe source.

Do not infer permission to redistribute Jagex-owned material from the MIT
licence on upstream source code.

## Private verification evidence

Run in the reconstructed private checkout:

```sh
cd engine
./node_modules/.bin/tsx tools/test/CandlelightRegression.ts
./node_modules/.bin/tsx tools/test/CandlelightCommandRegression.ts
npm run lint

cd ../client-java
./gradlew test --no-daemon
java -cp build/classes/java/main jagex2.client.WorldMapOverlayTest
```

Observed on 2026-10-30: all teleport and candlelight checks passed; the client
world-map suite passed; Gradle completed successfully; lint reported 0 errors
and 13 existing `no-explicit-any` warnings. A real authenticated gameplay test
was not claimed as complete.
