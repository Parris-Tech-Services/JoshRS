# JoshRS: reference sources (pinned Git submodules)

**Source code references imported 30 October 2026.** These are Git submodule pointers to the original public repositories, pinned to explicit commit SHAs. They are **not** installed plugins, merged into the 377 runtime, or proof of licence to republish third-party game assets. The uploaded ZIP files were inspected locally; submodule pins correspond to the repositories' resolved revisions at import time and **may not be byte-identical** to those ZIP snapshots.

## Clone and use
```bash
git clone --recurse-submodules https://github.com/Parris-Tech-Services/JoshRS.git
# In an existing Git clone:
git submodule update --init --recursive
```
Agy working in `/home/josh/dev/JoshRS/` can run `git submodule update --init --recursive` from that Git repository. For a Windows installation downloaded as a source ZIP (no `.git`), use `deploy/jparris-windows/get-reference-sources.ps1`, which fetches pinned repositories independently and **does not affect the game server or player saves**.

| Directory | Source URL | Pinned commit | Purpose / restrictions |
|---|---|---|---|
| `integrations/reference-sources/runelite` | https://github.com/runelite/runelite | `71250e778a9f` | BSD-2-Clause; modern OSRS tooling |
| `integrations/reference-sources/rs-map-viewer` | https://github.com/dennisdev/rs-map-viewer | `d3c569b1cde3` | BSD-2-Clause; 3D cache viewer |
| `integrations/reference-sources/jar-re` | https://github.com/boriitoo/jar-re | `1144ca46937f` | MIT in README; bytecode reference |
| `integrations/reference-sources/web-client-377` | https://github.com/reinismu/runescape-web-client-377 | `e017366aa6eb` | Unlicensed including Jagex-owned cache; reference only |
| `integrations/reference-sources/refactored-client-377` | https://github.com/Promises/refactored-client-377 | `c4f513540fc8` | No permissive license established; reference only |
| `integrations/reference-sources/refactored-client-317` | https://github.com/Rabrg/refactored-client | `7ce18d0ef017` | No permissive license established; reference only |
| `integrations/reference-sources/osrs-steam` | https://github.com/Runescape-Reversed/OSRS-Steam | `e1c182afc7ed` | No clear license; reference only |
| `integrations/reference-sources/runescape-worldmap` | https://github.com/eduardocopat/runescape-worldmap | `f6be4ed4919f` | MIT code; Jagex-owned icons; reference only |

**Recommended first:** `runelite` (cache APIs), `rs-map-viewer` (map visualisation), `jar-re` (Java inspection). Experimental client forks do not speak to JoshRS 377 simply because their revision numbers are similar. Web-client uses Apollo / WebSockets versus JoshRS Lost City TCP and requires a protocol/authentication review.

**Security warning:** The uploaded web-client 377 ZIP contains a bundled `test-rsa.pem` RSA private key, apparently a public upstream test fixture. Do **not** treat it as a secure key or use it for JoshRS production authentication. Browser porting must replace test credentials, prove the protocol is compatible, and keep all actual server keys private.

**Copyright policy:** The browser client includes a Jagex game cache; refactored clients and native Steam notes lack clear redistribution permissions. Their **references are linked, not vendored**; do not copy their source or assets into the JoshRS public tree without a rights review. RuneScape icons in `runescape-worldmap` are acknowledged by its author as Jagex-owned. Map modifications (`edgeville_modified_trees.zip`) are staged via `tools/rs377-map-bridge/` and are **not directly installed or copied to GitHub**.

## Exact uploaded ZIP evidence
The SHA-256 checksums below identify the user's actual nine uploaded ZIPs, not the upstream submodule revisions. If Agy needs **identical** ZIP snapshots, compare these before using the pinned upstream clones. No ZIP executable, cache, personal data or Jagex map assets are included in this public commit.

| Upload | Files | SHA256 |
|---|---:|---|
| `refactored-client-master.zip` | 75 | `4e9ae869a5736a44605f9bfccd17f6453c05760feb93f0b8e119829204d87fe2` |
| `jar-re-main.zip` | 48 | `4b198d0df04a5e301ba1a2116a3aa2ea49c31d1213743d46dba1da8cbd0f5788` |
| `OSRS-Steam-main.zip` | 5 | `5109ac1a6df64f0eb67cfcf069ce28622cf362f5a463696014f512b2aba501e5` |
| `runescape-web-client-377-master.zip` | 127 | `2c79d2f8c15b1156923c0d82082e8ab9aee7eafaae760590efe4c82e8f2bdd6c` |
| `runelite-master.zip` | 2707 | `bb6ff0c0f9143ea0d421b7ac70978a1eeeb36629c647b092d0020756e745768f` |
| `rs-map-viewer-master.zip` | 316 | `6dc345a68e96e3994f302c481ebe332653287e31344d0e2b5af2c641a0d0deb9` |
| `runescape-worldmap-master.zip` | 320 | `91d1b4bd78920bcd5565b3bfb8da4b51a2a509e0bb33807a7f730ad13cba9f96` |
| `edgeville_modified_trees.zip` | 2 | `0dbe582d0275ff50e02c41403bc11d6a9f7f63cf216f6629c2b22935d9aca2b9` |
| `refactored-client-377-master.zip` | 86 | `65bb4b47cdc99ec0837d4e3d31df0c80df120642954f8fb59df8b5cf4ed0e8ee` |

## Limitations & next actions
- Status of import: **VERIFIED Git source references**, not verified builds or working game integrations.
- Check individual source-file license headers; BSD/MIT metadata does not automatically cover third-party bundled assets.
- Do not launch random binaries or game clients inside the production world. Test in disposable environments first.
- Keep original JoshRS 377 `engine`, `content`, `runtime`, client and all saves unchanged. Only merge integration patches after validation and a rollback backup.
- GitHub's Download ZIP doesn't populate submodules; use Git clone or the standalone Windows helper.
