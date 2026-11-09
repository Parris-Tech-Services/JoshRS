# Cache format notes — what is verified, and what is blocked

Everything here was established by pulling the **real** `config` jagfile off a running 377 engine
and decoding it, not by reading documentation. That order matters: two documented assumptions
turned out to be wrong.

## Verified: the `config` jagfile container

| Fact | Evidence |
|---|---|
| 6-byte header: 3-byte unpacked size, 3-byte packed size | both read `533710` on the live archive |
| equal sizes ⇒ stored uncompressed; unequal ⇒ whole-archive bzip2 | live archive is uncompressed |
| 2-byte file count, then 10 bytes per entry (hash, unpacked, packed) | **18** files |
| **no name table** — entries are found by x61 hash | confirmed by locating `obj.dat` |
| hash = `h = h*61 + upper(c) - 32` | matched `obj.dat` at `0x9c9a2c36` |

Live entry sizes: `obj.dat` 459,648 → 119,153; `npc.dat` 356,796 → 109,865; `seq.dat`
345,391 → 90,713; `varp.dat` 754 → 67. `item.dat` is correctly absent — RS2 keeps items in
`obj.dat`.

Individual entries are compressed with a **header-less** bzip2 stream: prepending `BZh1` to the
stored bytes decompresses cleanly and lands on exactly the declared size.

## Verified: `obj.dat` (item definitions)

No offset table — a 2-byte count then definitions back to back, strings terminated by `0x0A`.
Decoding the live file produced, in order: `Dwarf remains`, `Tool kit`, `Cannonball`,
`Nulodion's notes`, `Ammo mould`, `Instruction manual`, `Cannon base` — the correct 377 item ids
1–7. Count: **7,956**.

Implemented in `ObjDefinitions377` with the opcode table from `Engine-TS` `ObjType.ts` (MIT), and
covered by tests in CI.

## BLOCKED: `npc.dat`

The same approach works until **NPC 226**, then desynchronises:

```
npc 226 ops decoded: 17, 13, 99, 95, 106, then opcode 255
```

Byte-level, NPC 226 starts at offset 19289:

```
11 0333 0334 0335 0336  0d 0328  63  5f 0001  6a 0806  ffff  01 0e 5d...
17  <-walkanims->        13 ready  99  95 vis   106 ?    <-- 255 appears here
```

The `ff ff` after opcode 106 is the problem. Opcode 106 is `multivarbit = g2`, which consumes
only `08 06`, leaving `ff ff` to be read as an opcode — and 255 is not in the engine's set.

**The engine parses this same file successfully.** Asked it directly:

```
226 null      size= 1
227 "Morris"
total configs: 3852
```

So the file is valid and my transcribed table is wrong somewhere. Things tried and rejected:

| Hypothesis | Result |
|---|---|
| opcode 106 consumes 4 bytes (varbit + varp pair) | desyncs at opcode 192 instead |
| opcode 106 consumes 6 bytes | desyncs at opcode 41, after 291 NPCs |
| opcode 107 consumes 2, 0 | no change — 106 trips first |

Names decode perfectly for the first 226 NPCs (`Hans`, `Man`, `Woman`, `Farmer`, `Thief`,
`Guard`, `Tramp`, `Brother Kojo`, `Bonzo`), so alignment is correct up to that point and the
error is a single opcode that no early NPC uses.

### What to do next, and what not to

**Do not keep guessing widths.** The remaining space is large and a wrong guess produces a parser
that looks fine on fixtures and corrupts real items — exactly the failure the `obj.dat` offset
table would have caused.

Instead, derive the table by **instrumenting the engine**: monkey-patch `NpcType.decode` to log
`(code, dat.pos before, dat.pos after)` while `NpcType.load('data/pack')` runs, then read the
true widths off the log. The engine is the authority; transcribing its source by hand is what
introduced this bug.

## A note on method

`obj.dat` succeeded because the format was checked against real bytes before any Kotlin was
written. `npc.dat` failed for the same reason in reverse: the opcode table was transcribed from
source and only the *early* results were spot-checked, which is why 226 NPCs decoded convincingly
before breaking.

Spot-checking the first few entries of a sequential format proves very little.
