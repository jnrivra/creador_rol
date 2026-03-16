# 🐆🐈‍⬛ ¡A la Carrera! - Aventura de Rol Interactiva

Aplicación web companion para el juego de rol **"¡A la Carrera!"** (Scurry!) de [Devir](https://devir.es/a-la-carrera) / [Stout Stoat Press](https://www.stoutstoat.co.uk/).

Una aventura interactiva de ~15 minutos diseñada para jugar con niños pequeños, con un Game Master (padre/madre) guiando la historia.

## 🎮 Características

- **Creador de Personajes**: 8 bestias con habilidades únicas (Guepardo, Pantera, Zorro, Búho, Conejo, Nutria, Erizo, Ardilla)
- **Aventura Interactiva**: "La Búsqueda del Tesoro de los Titanes" - 5 escenas con opciones y tiradas de dados
- **Sistema de Dados Decreciente**: d8 → d6 → d4 con reloj de 4 segmentos (mecánica fiel al juego original)
- **Audio Procedural**: Ambiente sonoro generado en tiempo real (pájaros, río, cueva, etc.) sin archivos externos
- **Modo Proyección**: Pantalla completa para TV/monitor con visuales grandes y coloridos
- **Panel de Game Master**: Notas por escena, controles manuales, ajuste de volumen

## 🚀 Cómo usar

### Opción 1: Abrir directamente
Simplemente abre `index.html` en tu navegador (Chrome, Safari, Firefox).

### Opción 2: Servidor local (opcional)
```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve .
```
Luego visita `http://localhost:8000`

## 🎲 Mecánicas del juego

Basado en las reglas de **Scurry!** (3ra edición) de Brian Tyrrell:

| Resultado | Tirada | Efecto |
|-----------|--------|--------|
| ⭐ Crítico | Máximo del dado | ¡Éxito espectacular! |
| ✅ Éxito | 4 o más | La acción funciona |
| ⚠️ Complicación | 2-3 | Funciona pero con un costo (reloj +1) |
| 🎪 Juerga | 1 | ¡Algo caóticamente gracioso sucede! |

### Tags y Ventaja
Cada personaje tiene 4 tags: **Habilidad**, **Herramienta**, **Talento** y **Rasgo**. Si un tag es relevante para la acción, se tiran **2 dados** y se elige el mejor resultado.

La **Habilidad** tiene auto-éxito en su primer uso, luego da ventaja.

### Reloj
Cada complicación llena 1 segmento del reloj (4 total). Cuando se llena, el dado se reduce: d8 → d6 → d4.

## 🎯 Diseñado para niños

- **Botones grandes** y coloridos (mínimo 70px)
- **Emojis** como comunicación visual principal
- **Sin derrota**: la aventura siempre termina con éxito
- **Juergas** que generan momentos de risa
- **Audio ambiental** para inmersión
- **Texto narrado por el GM** (el niño de 4 años no necesita leer)

## 📁 Estructura del proyecto

```
├── index.html              # Aplicación principal (SPA)
├── css/
│   ├── styles.css          # Variables, reset, layout
│   ├── animations.css      # Keyframes
│   ├── characters.css      # Tarjetas de personajes
│   ├── dice.css            # Dados y reloj
│   ├── adventure.css       # Escenas y panel GM
│   └── projection.css      # Modo proyección
├── js/
│   ├── data/
│   │   ├── bestiary.js     # 8 personajes con stats
│   │   └── scenes.js       # 5 escenas de la aventura
│   ├── audio.js            # Web Audio API procedural
│   ├── dice.js             # Sistema de dado decreciente
│   ├── clock.js            # Reloj de 4 segmentos
│   ├── characters.js       # Selector de personajes
│   ├── adventure.js        # Motor de aventura
│   ├── projection.js       # Fullscreen API
│   └── app.js              # Controlador principal
```

## 🛠️ Tecnología

- **HTML/CSS/JS puro** - sin frameworks ni dependencias
- **Web Audio API** - audio 100% procedural, sin archivos de sonido
- **CSS Art** - fondos y decoraciones sin imágenes
- **Fullscreen API** - modo proyección
- Compatible con protocolo `file://`

## 📜 Créditos

- Juego original: **Scurry!** por [Brian Tyrrell / Stout Stoat Press](https://www.stoutstoat.co.uk/)
- Edición en español: **¡A la Carrera!** por [Devir](https://devir.es/a-la-carrera)
- Esta aplicación es un companion fan-made y no está afiliada oficialmente con Devir ni Stout Stoat Press
