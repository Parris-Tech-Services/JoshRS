# JoshRS Fedora bot preflight — ChatGPT task 13/42

A **read-only diagnostic** for Agy's Fedora workstation. It works independently of the experimental PR #62 harness and uses only Node's built-in modules plus system tools already present.

From an updated JoshRS repository checkout:

```bash
cd /home/josh/dev/JoshRS
node tools/rs377-bot-preflight/fedora-preflight.mjs
```

For an isolated worktree or custom checkout, execute the script from **that worktree**; it automatically finds the repository root relative to its own location. An optional offline test/CI fixture may use `--root DIR --home DIR`.

### What the report really proves

- Versions: Node, npm, Git, Java, Gradle **wrapper configuration** (the script does **not** run Gradle), and whether Agy is on the PATH.
- Known Fedora game/worktree paths: reports existence only, never searches work files or inventories the home directory.
- Git branch, commit SHA and whether tracked changes exist; does not print remote URLs or changed filenames.
- Known RS377 TCP listeners: ports 52402, 8888, 8898, 45099, 43500, 43501, 53402 and 8988. Reports process names/PIDs **only when visible** via unprivileged `ss`. An unknown process owner is labelled `owner hidden/unknown`, not assumed safe.
- Local routing: default interface, interface names, Tailscale interface presence and route count. **No gateways, route prefixes or IP addresses** are included.
- SHA-256 for an explicit allowlist of ordinary checked-in source/config files only, including the engine `src/app.ts` and client Gradle wrapper properties when found.

It does **not** check live host reachability, authenticate any account, prove a server is healthy, determine whether Fedora and Elrothiro use the same world, or verify any bot action. Those require subsequent tasks and actual runtime evidence.

### Safety

No `sudo`, firewall edits, installs, game startup, stop/restart, database reads, account or save changes, RSA key access, credential reads, network probes, cache copying or workplace data collection. Commands executed are restricted to `git` read-only metadata/status, `ss -H -ltnp`, `ip -4 route show`, `npm --version`, `java -version` and `which agy`. Node is used to run the script, not to query a remote service.

For the supported checkout, the only source file hashes are from the fixed allowlist embedded in `fedora-preflight.mjs`. No recursive disk scans are performed. If a command is unavailable or the user lacks permission to inspect process ownership, the report explicitly says unknown/unavailable.

### Test evidence

Run locally (no game started):

```bash
node --check tools/rs377-bot-preflight/fedora-preflight.mjs
node --test tools/rs377-bot-preflight/fedora-preflight.test.mjs
```

CI workflow: `.github/workflows/rs377-fedora-readonly-preflight.yml` — the tests run on an ordinary GitHub Linux runner. **Passing CI is not a Fedora 44 host acceptance test.**

Source files are new and independent of Agy's worktree/Player changes. Do not use this tool to decide production readiness on its own.
