# Hosting the revision-274 browser world (free options)

The 274 engine serves the browser client itself, so "hosting the client" means exposing one
HTTP+WebSocket origin. The client connects to `window.location.host`, so the page and the
game must be the same origin — a static host (Vercel/Pages/Netlify) cannot work alone.

## Works today: Cloudflare quick tunnel (free, anonymous, temporary)

```sh
tools/play274/host-public.sh
```

It detects the private address, starts `cloudflared tunnel --url`, merges the public origin
into the WebSocket allowlist, restarts the world, and runs `verify-world.mjs --secure`.
Result is `https://<random>.trycloudflare.com/rs2.cgi`.

Limits: the hostname is random and changes on every run, Cloudflare gives no uptime
guarantee, and the phone must stay awake. This is a demo link, not a permanent home.

## Permanent free options

| Option | Cost | Stable URL | Needs |
|---|---|---|---|
| **Tailscale Serve** (family only) | free | `https://<node>.<tailnet>.ts.net` | Tailscale account, devices in your tailnet |
| **Tailscale Funnel** (public) | free | same `*.ts.net` hostname | Tailscale account; Funnel enabled |
| **ngrok free static domain** | free | `https://<name>.ngrok-free.app` | ngrok account + one static domain |
| **Cloudflare named tunnel + domain** | tunnel free, domain ~$10/yr | your domain | Cloudflare account + a domain |

Tailscale is the best zero-cost permanent choice and supports WebSockets. `Serve` keeps the
world private to your tailnet (recommended for family saves); `Funnel` makes it public.

## Running the world on the gaming PC (jparrisdesktop)

The engine is Node 24+, so the same 274 world runs on Windows:

1. Copy (or clone) the 274 `engine/` and `content/` next to each other, `npm install` in
   `engine/`, then `npx tsx tools/pack/Build.ts` (set `BUILD_VERIFY=false` for custom content).
2. `data/config/world.json`: set `web.port`, `engine.revision: 274`, and `web.allowedOrigin`
   to the public origin (comma-separated list is supported).
3. Start with `npx tsx src/app.ts`, then expose it with Tailscale Funnel/Serve or ngrok.
4. Do **not** bind the game to `0.0.0.0` on a network you do not control; the tunnel only
   needs to reach loopback or the private address.

## Security — read before sharing the link

This world runs in single-player login mode: **passwords are not checked**. Anyone who has
the URL can log in as any character that has a save (including `elrothiro`). For a public
link either enable the account/login server, or use Tailscale `Serve` and share the tailnet
instead of a public URL.
