# ¡A la Carrera! — AI Context

Kids RPG companion app (Scurry! board game). Dual-screen: GM (`index.html`) + Player (`player.html`). Pure vanilla JS, zero dependencies.

## Architecture
- **GM Dashboard**: `app.js` → `adventure.js` (scene engine) → `sync.js` → Player
- **Player View**: `player-view.js` receives + sends via `sync.js` (bidirectional)
- **Sync**: 3-layer fallback: postMessage → BroadcastChannel → localStorage
- **Audio**: 100% procedural via Web Audio API (`audio.js`), no sound files
- **Data**: `js/data/` — bestiary (8 chars), adventures (2), items (15), badges (30), events (15)

## Key Conventions
- All game state lives in `window.Carrera` namespace
- `tipo` and `rareza` fields are **identifiers** (no accents): `'consumible'`, `'comun'`, `'desafio'`
- Display strings (nombre, descripcion) use proper Spanish accents
- Scene `backgroundClass` must match CSS: `bg-forest-clearing`, `bg-river`, `bg-tunnel`, `bg-den`, `bg-treasure`, `bg-victory`
- Adventures self-register via `window.Carrera.adventureRegistry.register()`
- Mid-adventure checkpoint stored in `campaign.checkpoint` (sceneId, flags, clock, difficultyBonus); cleared on victory

## Player Interactivity
Player can drive the entire game from `player.html`:
- Clicks choice → `player_choice_select` → GM auto-resolves
- Enters dice → `player_dice_roll` → GM resolves inline
- Clicks continue → `player_continue` → GM loads next scene
- When `state.playerDriven = true`, resolution proposals are skipped (auto-sends original text)

## Testing
No test framework. Validate JS syntax with `node -c <file>`. Adventure paths verified via simulation script (373,248 paths, 0 errors).

## GM Keyboard Shortcuts (scene screen)
- `Space` — focus dice input
- `N` — send narrative · `C` — send choices · `R` — resend state · `T` — toggle team panel
- `U` — undo last roll (kids miscount) · `M` — mute audio · `1-5` — jump to scene
- `?` or `H` — show/hide shortcut overlay · `Esc` — close overlay

## File Protocol
App works on `file://` — BroadcastChannel disabled, falls back to localStorage sync.
