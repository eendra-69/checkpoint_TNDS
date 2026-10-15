# Deploy

## Remotes

- GitHub: `https://github.com/eendra-69/checkpoint_TNDS.git`, branch `main`.
  Upstream: `https://github.com/jrrqd/tasco-renewal-demo.git` (private), whose
  own deployment is `https://tasco-tnds-demo.vercel.app` (Vercel team `radr`).
- Vercel project: **`checkpoint-tnds`**: name it exactly that when importing,
  so the production alias is **https://checkpoint-tnds.vercel.app**, the URL
  `index.html`, README and AGENTS.md link to.

The git working tree is the repository root: a static presentation site, with
the Next.js app in `demo/`.

## First deploy (dashboard)

1. Vercel → **Add New… → Project** → import `eendra-69/checkpoint_TNDS`.
2. **Project Name:** `checkpoint-tnds`. **Root Directory:** `demo`
   (framework is detected as Next.js; leave build settings alone).
3. Environment variables (table below): at least `AUTH_SECRET`,
   `SETTINGS_SECRET` and `NEXT_PUBLIC_APP_URL=https://checkpoint-tnds.vercel.app`.
   Generate each secret with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
4. **Deploy.** Every push to `main` deploys again from then on.
5. Optional, recommended for a judged demo: an Upstash Redis database
   (console.upstash.com). Copy its REST URL and token into
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (the app reads only
   these names), then **Redeploy**.
6. Optional: the presentation site as a second project from the same repo,
   Root Directory empty, framework **Other**, no build command.

## Two deployables

The repository root is no longer the Next.js app. It now holds a static
presentation site plus the app under `demo/`.

| Target | What to publish | How |
|---|---|---|
| Presentation site | repo root (`index.html`, `site.css`, `assets/`, `docs/`) | Any static host — GitHub Pages, Vercel static, Netlify. No build step. |
| Demo app | `demo/` | Vercel, with the project **root directory set to `demo`** |

Because the demo's Vercel root moved, set **Settings → Build & Development →
Root Directory** to `demo` on the existing project, or every build will fail
looking for `package.json` one level too high.

If both are served from the same origin, the presentation site's `demo/` links
resolve directly. If they are on separate hosts, point the links at the demo's
absolute URL instead — they are all `href="demo/"` in `index.html`.

## Environment (Vercel + `demo/.env.local`)

Copy from `demo/.env.example`:

| Variable | Required | Notes |
|----------|----------|--------|
| `AUTH_SECRET` | **yes in prod** | JWT signing. Since v0.2.0 the signer **throws at boot** in production if this and `SETTINGS_SECRET` are both missing — a misconfigured deploy fails loudly instead of silently signing with a committed default. |
| `SETTINGS_SECRET` | **yes in prod** | Encrypts provider API keys stored in the session blob (AES-256-GCM). Since v0.2.0 saving a provider key throws rather than writing plaintext to Redis. Rotating it makes existing stored keys undecryptable — they fall back to the env var. |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | **strongly recommended in prod** | Without Redis there are **four** degraded stores, not one: the session is in-memory per instance, presence and the lounge feed are not shared across instances, and the audit ledger is not append-only or tamper-evident. `/admin` shows a badge for each. |
| `AI_GATEWAY_API_KEY` or provider keys | optional | Demo replies work without them |
| `AI_MODEL` | optional | Default `google/gemini-2.5-flash` |
| `ELEVENLABS_API_KEY` / `VOICE_ID` | optional | Else Web Speech |
| `NEXT_PUBLIC_APP_URL` | cert QR | Production should be the public origin. **If unset, the certificate QR code encodes `http://localhost:3000`** and scanning it goes nowhere. |

Do not commit `demo/.env.local`.

## Rate limits

`/api/chat` and `/api/workshop` are limited to 20 requests/minute per session;
`/api/presence` to 120/min and `/api/lounge` to 30/min. With Redis these are
enforced globally; without it they are per-instance and best-effort.

## Known limitation: concurrent session writes

`updateSession` serialises read-modify-write **within one process**
(`demo/src/lib/session-lock.ts`). On Vercel each serverless instance has its own
module registry, so two requests for the same session landing on *different*
instances are not serialised and the second write can discard the first.

That needs a distributed lock (`SET NX` with a token, released on completion).
It was left out deliberately: it adds a Redis round trip to every session write
and introduces its own lock-expiry failure modes, which is a poor trade for a
demo that runs on one machine. If you move this to real multi-user traffic,
implement it first.

## Local production build

```bash
npm run build   # from the repo root; forwards into demo/
```

Typecheck runs as part of `next build`.

## Vercel git-author block

Vercel may **block** deployments with:

> The deployment was blocked because the commit author doesn’t have permission to create deployments for this project.

That happens when the git author email is not a member of the Vercel team (this repo has seen `rumputyangbergoyang@yahoo.com`).

**Working workaround (do not skip restoring `.git`):**

1. `npx vercel build --prod`
2. Temporarily move `.git` aside.
3. `npx vercel deploy --prebuilt --prod --yes`
4. Move `.git` back immediately.

Deploying `--prebuilt` **from a temp directory that lacks `node_modules`** fails (`@swc/helpers` missing). Stay in the app directory; only hide git metadata.

GitHub push can still succeed while Vercel Git integration stays blocked. Prefer CLI prebuilt for production until the Vercel git author / team membership is fixed.

## Do not

- Change git `user.email` / `user.name` without the human asking.
- `--force` push `main`.
- Skip hooks.
- Upload `.next` as a substitute for `vercel build` output.

## After deploy

Confirm https://checkpoint-tnds.vercel.app loads, VI/EN toggle works, and customer → office still opens. In-memory sessions on serverless will **reset** between instances unless Upstash is configured.
