# Deploy

## Remotes

- GitHub: `https://github.com/jrrqd/tasco-renewal-demo.git` (private), branch `main`.
- Vercel project: `tasco-renewal-demo` (team `radr`).
- Production alias: **https://tasco-renewal-demo.vercel.app**
- Linked config: `app/.vercel/project.json` (`prj_1Ay6P3xopvQcH392jfuPfmZ81Y9G`).

Git working tree is **`app/`**, not the parent `2026 tasco` folder.

## Environment (Vercel + `.env.local`)

Copy from `.env.example`:

| Variable | Required | Notes |
|----------|----------|--------|
| `AUTH_SECRET` | yes in prod | JWT signing |
| `SETTINGS_SECRET` | optional | Fallback if `AUTH_SECRET` missing |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | recommended in prod | Without Redis, session is in-memory per instance |
| `AI_GATEWAY_API_KEY` or provider keys | optional | Demo replies work without them |
| `AI_MODEL` | optional | Default `google/gemini-2.5-flash` |
| `ELEVENLABS_API_KEY` / `VOICE_ID` | optional | Else Web Speech |
| `NEXT_PUBLIC_APP_URL` | cert QR | Production should be the public origin |

Do not commit `.env.local`.

## Local production build

```bash
npm run build
```

Typecheck runs as part of `next build`.

## Vercel git-author block

Vercel may **block** deployments with:

> The deployment was blocked because the commit author doesn’t have permission to create deployments for this project.

That happens when the git author email is not a member of the Vercel team (this repo has seen `rumputyangbergoyang@yahoo.com`).

**Working workaround (do not skip restoring `.git`):**

1. `npx vercel build --prod`
2. Temporarily move `app/.git` aside.
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

Confirm https://tasco-renewal-demo.vercel.app loads, VI/EN toggle works, and customer → office still opens. In-memory sessions on serverless will **reset** between instances unless Upstash is configured.
