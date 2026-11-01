# Task 10/42 — Minimum missing on-machine facts

The GitHub source audit cannot establish the current live host or game state. Ask Agy to capture only the following six facts, read-only and redacted. Do not paste passwords, tokens, account files, private keys or full process environment.

## 1. Authoritative world identity

On the machine where Elrothiro actually plays, record the operating system, hostname alias (not a public address), active server process ID, executable and current working directory. Read-only Linux commands:

    hostnamectl --static
    ps -eo pid,comm,args | grep -E '[j]ava|[n]ode' | cut -c1-180
    pwdx PID

Replace PID with the known game-server process ID. Do not assume Fedora is the server merely because it uses port 52402.

## 2. Runtime endpoints

Record only bound address categories (loopback, LAN or Tailscale), listening port numbers and owning PID. On Linux:

    ss -ltnp

On Windows PowerShell:

    Get-NetTCPConnection -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess

Redact routable addresses before sharing. Do not alter firewalls or ports.

## 3. Script and content load state

From existing redacted startup logs, report the server build SHA, content pack identifier, whether game scripts loaded successfully, and current world tick if already available. Do not open player saves or copy private logs wholesale. If unavailable, record UNKNOWN rather than restart.

## 4. Agy local worktree state

From /home/josh/dev/JoshRS on Fedora, without modifying files:

    git status --short --branch
    git worktree list
    git rev-parse HEAD

Record whether any uncommitted Agy changes exist and the branch/commit; do not run git reset, clean, checkout, pull or rebase.

## 5. One approved disposable login

Only after confirming a separate test world and approved bot account, capture redacted login result, source revision 377, cache CRC match, bot session identity and failure category. Do not perform a new login just to collect this checklist without approval. If no safe prior evidence exists, record NOT TESTED.

## 6. Genuine in-game proof

Capture a timestamped observation from two real clients on the same authoritative world: Elrothiro and the bot visible, movement observed, Friends status, and save/relogin persistence. Record the world fingerprint and before/after tick without exposing private player details. If not observed, record NOT VERIFIED.

## Minimal handoff format

World host: UNKNOWN; server PID/CWD: UNKNOWN; source/content version: UNKNOWN; listeners: UNKNOWN; scripts loaded: UNKNOWN; Agy branch/dirty state: UNKNOWN; approved test login: NOT TESTED; two-client gameplay: NOT VERIFIED.

These are the only machine-specific facts needed to unblock the next integration step. Source tests and matching port numbers do not establish a shared world. No production server restart, account creation, password access or save modification is authorised by this document.
