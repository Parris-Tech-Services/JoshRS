# Rejected snapshots: 2026-11-14 03:00-03:30 UTC

These six files (2026-11-14T03-10Z, 03-20Z, 03-30Z for Fred and George) were NOT real
ten-minute observations.

Evidence: each has route_points = [], successful_actions = 0, failed_actions = 0 and an
all-zero XP delta, and all six were created at 14:47:25 local (03:47Z) when the server
process started. That is the signature of the startup backfill in
lushTenMinuteWindowIfDue(), which wrote the current state onto boundaries the process
never observed.

They are kept here for audit only. The backfill code has been removed from
FredGeorgeBot.ts, and the one-partial-window-after-restart case is now skipped too.
Do not feed this folder to fred_george_hourly.py.
