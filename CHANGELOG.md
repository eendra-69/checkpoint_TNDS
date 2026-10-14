# Changelog

All notable changes to the TASCO TNDS renewal demo. Versions are tags on `main`;
`v0.2.0` is the current baseline for new work.

## [0.2.0] — 2026-10-14

Baseline release. Persona's welcome home, two new walkable rooms, a rendering
performance pass, and a repository restructure.

### Added

- **Per-persona welcome screen at `/`.** Six roles get a distinct home: the
  customer is greeted and told what they can do; telesales gets today's to-do
  list plus renewals-vs-target; admin gets live platform analytics (tickets
  solved, renewals issued, premium, audit events, PII reveals, escalations).
  Every figure is derived from real session state — case states, certificates,
  campaigns, claims, handovers, the audit ledger and lounge messages. The two
  assumed figures (`DAILY_RENEWAL_TARGET`, `BASELINE_RENEWAL_RATE`) are surfaced
  in a labelled "assumption notes" block rather than presented as real.
  - `demo/src/lib/welcome.ts`, `demo/src/components/welcome/welcome-screen.tsx`
  - New `welcome` block in both the VI and EN dictionaries
  - `/` still serves the marketing landing page when signed out, because Home
    is the only nav entry an anonymous visitor can see
- **Virtual Workshop** (`/workshop`) — two service bays on lifts, an inspection
  pad and a claims desk.
- **Virtual Lounge** (`/lounge`) — moderated Zalo-style chat, shared presence.
- **Presentation site at the repository root.** Plain HTML + CSS, no build and no
  dependencies. Explains the demo and links into `demo/`. Reuses the app's own
  palette and its three typefaces, so the front door and the product read as one
  thing.
- `npm run site` — zero-dependency static server (`scripts/serve-site.mjs`) that
  also redirects `/demo/…` to the running dev server, so the two behave like one
  origin locally.

### Fixed

- **The lounge could not be moved in.** The collision grid does double duty: it
  is both the tileset index handed to `TiledFloor` *and* the `0`-means-solid grid
  for `isWalkable`. The lounge used `TILESET.marble` for its floor threshold —
  and marble is tileset cell `0`. The entire threshold ring, including the row the
  player spawns on, therefore resolved as solid, so `canMoveTo()` returned false
  in every direction and the player was permanently wedged. The threshold now
  uses `TILESET.pale` (a visually equivalent flat stone slab under the same warm
  tint).
- `buildWorldMap` now warns in development if a `floor()` function returns `0`
  for an interior cell, so this class of bug cannot land silently again.

### Performance

The three rooms rendered **712 individual floor meshes**. Now:

| Change | Before | After |
|---|---|---|
| Floor draw calls (all three rooms) | 712 | **13** |
| Floor buffer geometries | 712 | **13** |
| Prop geometries / materials | 58 / 58 | **30 / 25** |
| Prop atlas texture clones | 29 | **22**, and 0 on remount |
| Player React re-renders while moving | 20/sec, whole Canvas subtree | **0** |
| Device pixel ratio cap | 1.5 | **1.25** (~30% less fragment work) |

- `TiledFloor` merges the grid into one `BufferGeometry` per distinct tileset
  index, baking the old per-mesh rotation into the vertices. Verified
  vertex-identical against the previous transforms across four grid shapes.
- Prop and character geometries, materials and atlas cells are pooled and shared
  instead of allocated per instance, and properly disposed on unmount.
- `WorldPlayer` writes its position straight to the scene graph instead of
  driving the whole Canvas subtree through React state 20 times a second.
- The post-processing chain was audited against the installed library source:
  `resolutionScale` is a no-op on both `EffectComposer` and `Bloom`,
  `stencilBuffer` already defaults off, and `multisampling={0}` was already
  beating the wrapper's default of 4. Only the DPR cap was worth changing; the
  rest is documented in `Effects.tsx` so the dead knobs are not "optimised" into
  regressions later.

### Changed

- **Repository restructure.** The Next.js app now lives in `demo/`. The root is
  the presentation site plus documentation. Root `package.json` scripts forward
  into `demo/`, so `npm run dev|build|lint|typecheck` behave as before.
- `turbopack.root` pinned in `demo/next.config.ts`. Next was walking upward past
  the git root and adopting an unrelated `package-lock.json` from the parent
  folder as its workspace, warning on every boot.
- Asset pipeline rewritten as a single deterministic JS path over raw RGBA
  buffers (`demo/scripts/process-office-assets.mjs`), removing a `sharp`
  `premultiplied` alpha round-trip that was corrupting generated sprites.

### Known issues at this baseline

- 12 pre-existing `react-hooks` lint errors in older components, unchanged
  throughout this release.
- The office follow-camera sits behind the spawn, so the room's south edge and
  the void beyond it are visible in the office view. Cosmetic, pre-existing.
- `demo/public/worlds/raw/` (≈30 MB of magenta-keyed source sheets) is committed
  so `npm run assets` stays reproducible.

[0.2.0]: https://github.com/jrrqd/tasco-renewal-demo/releases/tag/v0.2.0