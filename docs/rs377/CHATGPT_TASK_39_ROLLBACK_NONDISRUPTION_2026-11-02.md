# Task 39/42 — rollback and non-disruption check

**Delivered:** a read-only, fail-closed local check and offline test suite. **Not delivered or claimed:** a verified live host check, a verified backup, or approval to interrupt production.

## Protect the actual family world

JoshRS revision 377 may be running in **different, independent worlds**: the JParrisDesktop Windows snapshot, the Fedora AVANCE-WS7 world, isolated Fred & George workers, and Agy/RS-SDK experiments. A reachable endpoint or open port does *not* prove it is the authoritative world for **Elrothiro, Sylvie or Luna**. Never switch `active.json`, migrate saves, redirect bots or restart services to resolve an assumed world mismatch. Confirm the machine, authoritative world fingerprint, engine snapshot, exact service owner and live client session identity first.

**Absolute default:** NO unattended production restart, stop/kill, service/task reconfiguration, port rewrite, process-tree termination, cache rebuild, database migration, account edit, bot deploy or save restore. A health-check failure triggers an alert, not an auto-heal. This applies equally to Action1, Datto/RMM, GitHub Actions/runners, Agy, Claude/Codex, Task Scheduler, shell automations and local agents. Generic “finish this”, CI success or source changes are not authorisation to disrupt a family world. **No automatic rollback.**

## Run the check (safe/read-only)

On the verified host with a current JoshRS repository:

```bash
node tools/rs377-nondisruption/check.mjs --json
```

On **JParrisDesktop**, which has the private `runtime/jparris-377/active.json` mapping:

```powershell
node C:\JoshRS-Launcher\JoshRS-main\tools\rs377-nondisruption\check.mjs --root C:\JoshRS-Launcher\JoshRS-main --json
```

On Fedora, only **after verifying** the correct engine location (replace this example if necessary):

```bash
cd /home/josh/dev/JoshRS
node tools/rs377-nondisruption/check.mjs --engine /home/josh/dev/JoshRS/lostcity377/engine --json
```

**The CLI deliberately exits with code 2 and `BLOCKED_UNATTENDED_PRODUCTION_CHANGE`, even when the host appears idle.** Use it as a negative gate for any unattended change; do not translate exit 2 into permission to start/restart. There is deliberately no `--force`, `--restart`, `--approve` or `--apply` option. The check itself cannot grant approval to stop a game.

It reads **only** the local `active.json` engine-path mapping when present, file *metadata* for the three protected saves and SQLite DB, and local processes/sockets. It never opens the actual `.sav` contents, SQLite DB/WAL, `.env`, private keys or account credentials. It never logs in, probes the network or changes a service. **No raw process command lines, IPs or tokens appear in its output.** Hidden process owner or unavailable command => unknown and blocked. A file marked `present` is not proof of uncorrupted saves. `backup: unverified` is intentional: file presence cannot prove a transactionally consistent backup.

The check cannot prove that Elrothiro, Sylvie, Luna or another player are logged off merely from absent sockets. Nor can a process-name match guarantee every Agy worker was found.

## Supervised change preconditions — all required

1. **Correct host/world:** identify authoritative engine/content/source SHAs, world fingerprint, actual ports, listener owner and target accounts; note Fedora and Windows may differ. If uncertain, STOP.
2. **Explicit owner approval for this exact maintenance and time**; coordinate with all humans using Elrothiro/Sylvie/Luna and other accounts. Verify each has safely logged out through a real client. Do not use RMM/CI as a substitute for this confirmation.
3. **Preserve other agents and services:** identify active Agy/Claude/Codex, Fred & George isolated process(es), controller workers, game/login/friends/web services, Tailscale Serve forwards and other clients. Agree ownership and maintenance boundaries. No blanket `Stop-Process node`, `taskkill /IM node.exe`, Linux `pkill`, process-tree kills or unmanaged reboots.
4. **Protect source and private state:** inspect worktrees for dirty changes; no `git reset --hard`, cleanup, force-push, overwrite of Agy files, `sqlite:reset`, account recreations or copying secrets into CI/GitHub. Keep previous source/build/config and locally verified save snapshots.
5. **Make and verify a *cold, consistent* private snapshot after graceful shutdown and all writers have stopped.** Include all player profiles, SQLite `db.sqlite` and WAL/SHM where applicable as an atomic, coherent snapshot, account mappings, configuration/source SHAs and rollback metadata. Copying a live SQLite DB plus its companions without an online backup or stopping writers is **not** proof of a usable backup. Verify offline integrity/counts and secure access; never publish save, DB or key material.
6. **Stop on any unresolved blocker:** active sockets, unknown sessions/owners, unconfirmed Agy/Fred & George workers, missing saves/database, unverified backup, unexpected ports or world mismatch. An apparently healthy status still requires the explicit supervised procedure.

## Rollback sequence (no unattended actions)

- **Source-only failure:** revert precisely the bad change using a reviewed Git revert/small commit, test in an isolated worktree; never rewrite Agy's dirty working tree or the current runtime.
- **ProBook/client-only failure:** close the affected client, restore its own backed-up Java files, rebuild locally. Do not bounce the shared server or change other players' data to repair a client resize/render issue.
- **Server-code regression:** after verified logouts, explicit approval and a proven cold backup, stop only the confirmed main instance *gracefully*. Restore the previous known-good code/content/config version while retaining the newest player saves and database **unless** schema incompatibility is proven. Restore services one at a time and inspect logs and client login. Never copy disposable-world files into the family-world runtime.
- **Save/DB corruption or incompatible schema:** STOP; estimate player progress and transaction loss first. Obtain a second explicit approval for destructive restoration. Verify snapshot integrity in a disposable environment, restore with all writers stopped and preserve failing state for recovery. Never use an old `Elrothiro.sav` alone to overwrite the live account DB.
- **Network/Tailscale issue:** restore *only* the change to the tailnet-only mapping or ProBook localhost portproxy after checking socket owners and target port. Do not expose game or login endpoints to the public Internet.

## Post-change acceptance evidence

In **private** maintenance notes: record approved window, exact machine/world fingerprint, logged-out account confirmations, Agy/Fred & George process owners, last-good source SHA, private snapshot identifier and offline integrity result, changed services and PIDs, actual game/login/web readiness, and *optional owner-supervised* real client checks of login, inventory, skills, bank, XP and persistent character progress. No TCP-only or CI-only “verified live” claim.

Do not paste passwords, tokens, private IPs, save contents, SQLite rows, unredacted command lines, screenshots of private game inventory, account credentials or RSA private keys in a public issue, PR or CI artifact.

## Evidence boundary (2 Nov 2026)

The source-only Node CLI and seven isolated Node tests exercise active player TCP sessions, existing workers, unknown inspections, missing protected saves/DB, safe output and refused unattended override. Linux CI is an offline fixture, not Windows or Fedora live-world verification. **This task publishes an operational safety gate and rollback procedure; no live game, player, worker, service, save, or network configuration was touched.**
