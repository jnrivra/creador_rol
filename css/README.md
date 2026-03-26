# css/ — Stylesheets

7 CSS files organized by concern. No preprocessor, no build step.

## Files

| File | Purpose | Used By |
|------|---------|---------|
| `styles.css` | CSS variables (`:root`), reset, global layout | `index.html` |
| `animations.css` | All `@keyframes` (fadeIn, slideUp, bounce, pulse, etc.) | Both |
| `characters.css` | Character selection cards, slots, portraits | `index.html` |
| `dice.css` | Dice roll animations, die shapes, result colors | Both |
| `adventure.css` | Scene backgrounds, choice buttons, outcome panels | Both |
| `gm.css` | GM Dashboard panels, options grid, inline dice resolver | `index.html` |
| `projection.css` | Fullscreen projection overrides (larger fonts, hidden controls) | `index.html` |

## Theming

CSS variables defined in `styles.css`:

| Variable | Value | Usage |
|----------|-------|-------|
| `--gold` | `#f4a261` | Primary accent, buttons, highlights |
| `--green-dark` | `#2d5a27` | Forest backgrounds |
| `--blue-dark` | `#1a1a2e` | Base dark background |
| `--purple` | `#6c3d8e` | Pantera character color |
| `--red` | `#e76f51` | Danger, complicación |
| `--radius` | `16px` | Standard border radius |
| `--font` | Segoe UI / Comic Sans | Kid-friendly font stack |

## Player View

`player.html` has self-contained `<style>` block (not external CSS files) for:
- Scene backgrounds with CSS gradients (fallback when no AI images)
- Chapter card animations
- Victory ceremony effects
- Interactive choice and dice input styles

This keeps the player view as a standalone file that works without the full CSS directory.
