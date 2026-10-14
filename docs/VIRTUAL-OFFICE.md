# Virtual Office (HD-2D)

Customer default surface. Route: `/office`. Implementation: `demo/src/components/office/`.

## Intent

A walkable **pixel / HD-2D JRPG** Tasco office (not a 3D isometric building). Player walks a tiled floor, talks to NPCs, opens JRPG-styled panels for CS, claims, and case tracking.

## Controls

- Desktop: WASD / arrows, **E** to interact, **Esc** to close.
- Mobile: on-screen `TouchPad` + **A** interact.
- The header **Tour** locks movement while it is open (`OnboardingProvider.locksOffice`).

## File map

| File | Role |
|------|------|
| `OfficeExperience.tsx` | HUD, station panels, locale, intro dialogs |
| `OfficeScene.tsx` | R3F canvas, camera follow |
| `world/map.ts` | Collision grid, spawn, props, interactables |
| `world/TileWorld.tsx` | Floor from tileset atlas |
| `world/Props.tsx` | Desks, plants, VETC kiosk, board |
| `Player.tsx` / `Npc.tsx` | Sprite characters |
| `controls/useControls.ts` | Keyboard + touch state |
| `Effects.tsx` | Tilt-shift, bloom, vignette (capped for perf) |
| `panels/CsPanel.tsx` | Same `/api/chat` as Classic |
| `panels/ClaimsPanel.tsx` | Demo claim upload |
| `panels/AdminPanel.tsx` | Case state, cert link, consent |
| `office-copy.ts` | Station names / intros VI+EN |
| `ui/JrpgDialog.tsx` | Portrait + typewriter intro |

Dynamic import of `OfficeScene` with `ssr: false`.

## Map

- Size: **20 × 14** tiles, tile size 1 world unit.
- Collision: `COLLISION[y][x] === 0` is solid. Desks/sofas are blocked cells.
- Spawn: tile (10, 11) facing into the lobby.

Stations (`OfficeStation`): `reception` · `cs` (right) · `claims` (left) · `admin` (board) · `vetc` (kiosk → `/vetc/{id}`).

Proximity uses `INTERACTABLES[].radius`. NPC sheets: `/office/npc-cs.png`, `npc-claims.png`, `npc-reception.png`.

## Assets

Processed output in `demo/public/office/`. Raw magenta-keyed grids in `demo/public/office/raw/` (if present).

```bash
npm run office:assets
```

`demo/scripts/process-office-assets.mjs` (sharp):

- Keys magenta / hot-pink (JPEG bleed tolerant).
- Slices character grids, nearest-neighbor resize.
- Writes atlases + `demo/public/office/manifest.json`.

Do not smooth-scale pixel art. Keep nearest-neighbor sampling in materials (`SpriteCharacter.tsx`).

If a sheet looks magenta-fringed, re-key with a higher tolerance or recrop before slicing.

## Brand

Office copy and textures should stay Tasco navy / sky. Pixel brand helpers: `brand-textures.ts`. Backdrop windows sit behind the floor, not a solid ceiling that eats the camera (earlier 3D office bug).

## Locale

`OfficeExperience` receives `locale` from the office page (`getLocale()`). Station text: `officeCopy(locale)`. CS/Claims panels take the same locale so chips and errors match the header toggle.

## Performance

Effects are modest on purpose. Avoid extra lights/post stacks. Test desktop **and** a mobile-width viewport before shipping office changes.
