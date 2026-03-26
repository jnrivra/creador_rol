# assets/ — AI-Generated Images

Optional AI-generated images for cinematic mode. The app works without them (falls back to CSS gradient backgrounds and emoji art).

## Directory Structure

```
assets/
├── IMAGE_PROMPTS.md        # Prompts used to generate images
├── characters/             # Character portraits (PNG, ~512x512)
│   ├── buho.png
│   ├── conejo.png
│   ├── guepardo.png
│   ├── pantera.png
│   └── zorro.png
└── scenes/                 # Scene backgrounds (PNG, ~1920x1080)
    ├── forest.png
    ├── river.png
    ├── tunnel.png
    ├── den.png
    ├── treasure.png
    └── victory.png
```

## Image Loading

`js/image-loader.js` preloads images on page load. If an image exists:
- Scene gets cinematic background with parallax effect
- Character gets portrait in team panel and victory screen
- Vignette overlay and color grading are applied per-scene

If an image is missing, the app silently falls back to CSS backgrounds.

## File Naming Convention

| Type | Filename | Maps To |
|------|----------|---------|
| Scene | `forest.png` | `bg-forest-clearing` |
| Scene | `river.png` | `bg-river` |
| Scene | `tunnel.png` | `bg-tunnel` |
| Scene | `den.png` | `bg-den` |
| Scene | `treasure.png` | `bg-treasure` |
| Scene | `victory.png` | `bg-victory` |
| Character | `{id}.png` | Character `id` from bestiary |

## Missing Portraits

3 characters don't have portraits yet: `nutria`, `erizo`, `ardilla`. These fall back to emoji display.

## Generating New Images

See `IMAGE_PROMPTS.md` for the exact prompts used. Style: **Studio Ghibli / Miyazaki-inspired**, warm colors, forest setting, kid-friendly.
