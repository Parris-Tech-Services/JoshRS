#!/usr/bin/env bash
# Publish the private revision-274 browser world through a FREE Cloudflare quick tunnel.
#
#   tools/play274/host-public.sh [--engine ~/lc274/engine]
#
# Gives a temporary https URL (https://<random>.trycloudflare.com) that works from any
# browser, including one that is not on the hotspot. The URL changes every time it runs:
# Cloudflare quick tunnels are anonymous and are not a permanent hostname. For a stable
# address use a named tunnel with a domain (Cloudflare) or Tailscale Funnel / a paid-free
# static domain (ngrok) — see docs/play274/PUBLIC_HOSTING.md.
#
# Security: this world is single-player mode and does NOT check passwords. Anyone with
# the URL can log in as any existing character. Share the URL only with people you trust.
set -Eeuo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd -P)"
target="$HOME/lc274"
if [[ "${1:-}" == "--engine" ]]; then target="${2:?engine dir required}"; fi

command -v cloudflared >/dev/null || { echo "BLOCKED: install cloudflared (pkg install cloudflared)" >&2; exit 2; }

lan_ip() {
  python3 -c 'import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("8.8.8.8",53)); print(s.getsockname()[0]); s.close()' 2>/dev/null || true
}
bind="$(lan_ip)"
[[ -n "$bind" ]] || { echo "BLOCKED: no private LAN address; connect to Wi-Fi/hotspot first" >&2; exit 2; }

pkill -f "cloudflared tunnel --url" 2>/dev/null || true
: > "$HOME/.joshrs-tunnel.log"
cloudflared tunnel --url "http://$bind:8888" --no-autoupdate > "$HOME/.joshrs-tunnel.log" 2>&1 &
tunnel_pid=$!

url=""
for _ in $(seq 1 30); do
  url="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$HOME/.joshrs-tunnel.log" | head -1 || true)"
  [[ -n "$url" ]] && break
  sleep 2
done
if [[ -z "$url" ]]; then
  echo "BLOCKED: cloudflared did not publish a URL (see $HOME/.joshrs-tunnel.log)" >&2
  kill "$tunnel_pid" 2>/dev/null || true
  exit 1
fi
echo "tunnel: $url -> http://$bind:8888"

# Allow both the hotspot origin and the public origin, then restart so the allowlist loads.
cp "$repo/tools/play274/set-allowed-origin.ts" "$target/engine/set-allowed-origin.ts"
( cd "$target/engine" && ORIGIN_TO_ALLOW="$url" npx tsx set-allowed-origin.ts )

"$repo/tools/play274/start-playable-274.sh" --stop >/dev/null 2>&1 || true
sleep 2
"$repo/tools/play274/start-playable-274.sh" --lan "$bind" > "$HOME/.joshrs-public-start.log" 2>&1
tail -1 "$HOME/.joshrs-public-start.log"

( cd "$target/engine" && node "$repo/tools/play274/verify-world.mjs" --host "${url#https://}" --secure --user verifytunnel )

echo "$url/rs2.cgi" > "$HOME/.joshrs-public-url"
echo "PUBLIC URL: $url/rs2.cgi (saved to ~/.joshrs-public-url)"
