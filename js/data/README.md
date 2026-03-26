# js/data/ — Game Content

Static game data files. All attach to `window.Carrera` namespace. No logic — pure data definitions.

## Files

| File | Namespace | Content |
|------|-----------|---------|
| `bestiary.js` | `Carrera.bestiary` | 8 playable characters with abilities |
| `items.js` | `Carrera.itemDefs` | 15 loot items across 3 types |
| `badges-definitions.js` | `Carrera.badgeDefs` | 30 achievement badges across 5 categories |
| `random-events.js` | `Carrera.randomEventDefs` | 15 random encounter events |
| `scenes.js` | _(legacy)_ | Duplicate of tesoro-titanes.js — **not loaded** |
| `adventures/` | | Multi-adventure system (see [adventures/README.md](adventures/README.md)) |

## Characters (bestiary.js)

| ID | Name | Species | Ability | Tool |
|----|------|---------|---------|------|
| `guepardo` | Rayo | Guepardo | Velocidad Relámpago | Capa de Hojas |
| `pantera` | Sombra | Pantera | Sigilo de las Sombras | Gema Brillante |
| `zorro` | Astuto | Zorro | Olfato Rastreador | Mapa Antiguo |
| `buho` | Sabia | Búho | Visión de Águila | Catalejo de Corteza |
| `conejo` | Brinco | Conejo | Excavar Túneles | Pala de Piedra |
| `nutria` | Chapoteo | Nutria | Nadar como Pez | Bote de Corteza |
| `erizo` | Pinchos | Erizo | Hacerse una Bola | Bolsa de Bellotas |
| `ardilla` | Cascabel | Ardilla | Trepar a Toda Velocidad | Cuerda de Enredadera |

Each character has 4 tags: **habilidad** (ability), **herramienta** (tool), **talento** (talent), **rasgo** (trait).

## Items (items.js)

| Type | Count | Examples |
|------|-------|---------|
| `consumible` | 5 | Bellota Mágica (reroll), Miel Curativa (clock -1) |
| `permanente` | 3 | Amuleto de Suerte (+1 rolls), Brújula de Titán (diff -1) |
| `cosmetico` | 7 | Corona de Hojas, Capa de Estrellas, Aura Dorada |

**Important**: `tipo` and `rareza` fields are **identifiers without accents** (`'comun'`, `'cosmetico'`). Display strings use proper accents.

## Badges (badges-definitions.js)

| Category | Count | Examples |
|----------|-------|---------|
| aventura | 5 | Primera Aventura, Explorador Total |
| dados | 7 | Primer Crítico, Triple Estrella, Racha Imparable |
| equipo | 5 | Manada Completa, Dúo Dinámico |
| reloj | 3 | Reloj Congelado, Victoria Agotada |
| secretos | 10 | Amigo de Don Gruñón, La Rana Guía (hidden) |

## Random Events (random-events.js)

| Type | Count | Description |
|------|-------|-------------|
| `encuentro` | 5 | Narrative encounters with XP/item rewards |
| `desafio` | 5 | Mini-challenges with a quick roll |
| `social` | 5 | Roleplay encounters with NPC animals |

**Important**: `tipo: 'desafio'` (no accent) — used as identifier in `adventure.js`.
