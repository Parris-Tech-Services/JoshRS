# Read-only RS-SDK fleet dashboard

Recovered generated source from Downloads during the 13 November 2026 cleanup.
This is the missing local tracker referenced in
[the fleet continuity checkpoint](../../docs/rs377/RS_SDK_FLEET_CONTINUITY_2026-11-02.md).
The recovered script is preserved unchanged. It uses only Python standard-library modules.

```sh
python3 tools/rs-sdk-fleet-dashboard/fleet_dashboard.py --once
python3 tools/rs-sdk-fleet-dashboard/fleet_dashboard.py --port 8790
```

The dashboard binds to `127.0.0.1`, reads the existing gateway at
`http://127.0.0.1:7780`, and never starts or stops game clients.
Optional assignment metadata uses the original local path
`~/dev/JoshRS-source/rs-sdk/bots/logs/fleet/assignments.json`.
Missing assignment metadata is allowed. Do not commit that runtime file.

Recent client state and quest messages are observations, not authoritative
quest completion or proof of autonomous gameplay. This recovery has offline
fixture and HTTP-route verification only; it has not been connected to a live game.

Security review: fixed gateway endpoint allowlist, bounded upstream response,
loopback listener, no request logging, no-store responses, browser textContent,
and whitelisted metadata. No credentials, saves or captured state are included.

Run recovered-source checks:

```sh
python3 -m unittest discover -s tools/rs-sdk-fleet-dashboard -p 'test_*.py'
```
