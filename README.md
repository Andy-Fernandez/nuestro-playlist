# Our Play List ♡

A little romantic cassette collection, with all memories, romantic notes for each song or set of songs in one place.

The app is a **single-page React/TypeScript/Vite** project, with a **mechanical tape deck** and **physical cassette** animation. It uses **HTML5 Audio** for playback, and the three included MP3s are original demo clips.

**Stack:** React + TypeScript + Vite + Motion. No database, login, Three.js or external audio service.

## Quick start

You need **Node.js 20.19+ or 22.12+** and npm.

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite (usually `http://localhost:5173`).

To check/build the app:

```bash
npm run typecheck
npm run build
npm run preview
```

## How to use the app

1. Open the romantic welcome screen and press **COMENZAR**.
2. Choose one of six cassette cases from the original **Our Mixtapes** shelf.
3. You will see the metallic LOVELINE tape deck with your chosen cassette **outside** the slot.
4. Click **INSERT TAPE** → **PLAY** → **STOP** → **EJECT**.
5. Play is never automatic. Stop retains the current audio position; Eject rewinds and takes the cassette out.
6. Use the bottom **previous/next track** buttons, **Love Note**, **Tracks**, **favorite ♡**, and **Add Audio** features.

The three shipped MP3s are original instrumental **demo clips**, not copyrighted commercial tracks. The player uses real HTML5 Audio. Ejecting or returning to the collection pauses audio.

## Where to edit what

| I want to… | Open this file |
|---|---|
| Change six mixtape titles, dates, colors, text | `src/data/mixtapes.ts` |
| Replace tracks and romantic dedication notes | `src/data/mixtapes.ts` |
| Add my own local MP3s permanently | `public/audio/` + `src/data/mixtapes.ts` |
| Change the visual tape's shell and label | `src/components/PhysicalCassette.tsx` |
| Change the cassette's physical textures and proportions | `src/styles/deck-original.css` |
| Adjust the insertion/ejection and button animation timings | `src/hooks/useTransport.ts` and `src/styles/deck-original.css` |
| Make reels move more realistically | `src/components/PhysicalCassette.tsx` |
| Change the audio playback behavior | `src/hooks/useAudioEngine.ts` |
| Change the library and phone presentation | `src/components/Library.tsx` and `src/styles/library.css` |
| Change the deck page layout / mobile UI | `src/styles/app.css` |
| Replace simulated clicks with recorded WAV sounds | `src/utils/sfx.ts` |

### Replace a demo song with your own

Put an audio file at `public/audio/our-song.mp3` and edit the data:

```ts
{ id: 's1', title: 'Our Song', artist: 'Artist Name',
  src: 'audio/our-song.mp3', note: 'The moment I hear this, I think of you.' }
```

The `src` field is relative to Vite's `public/` folder. You can also click **ADD AUDIO** to try a local file without editing the source. Those uploads are **temporary** until the browser tab/app resets: to keep them permanently, copy the file to `public/audio` and update the data. Favorites persist in your browser's `localStorage`.

## Architecture

```text
src/
  App.tsx                           # navigation, selected cassette, uploads, favorites
  data/mixtapes.ts                 # editable songs, cassette metadata & theme
  components/
    Welcome.tsx                    # original greeting screen
    Library.tsx                    # original six cassette spines
    DecorativeCassette.tsx        # decorative welcome cassette
    PlayerScreen.tsx               # track metadata, progress, notes, song menu
    MechanicalDeck.tsx            # deck shell, controls and state display
    PhysicalCassette.tsx          # independent shell, paper, tape and reels
    Icon.tsx                      # small inline SVG icons
  hooks/
    useAudioEngine.ts             # one underlying HTMLAudioElement
    useTransport.ts               # finite mechanical transitions
    useReducedMotion.ts           # reduced-motion system preference
  utils/sfx.ts                    # synthetic mechanical click sounds
  styles/
    library.css                   # preserved romantic case-shelf design
    deck-original.css             # port of our earlier LOVELINE HTML prototype
    app.css                       # integrated layout, desktop/mobile, panels
public/
  audio/                           # 3 included demo MP3s
  assets/grain.png
```

## Mechanical states

```text
OUTSIDE --Insert--> INSERTING --> READY
READY --Play--> ENGAGING --> PLAYING
PLAYING --Stop--> STOPPING --> READY
READY --Eject--> EJECTING --> OUTSIDE
PLAYING --Eject--> STOPPING --> EJECTING --> OUTSIDE
```

A new track pauses the mechanism and leaves an inserted tape at **READY**. Music playback begins on the user's PLAY click (necessary for browser audio permissions). The reels animate with `requestAnimationFrame` only when playing, pause at their current angle, and vary their speed as song progress advances. Users requesting reduced motion see stationary reels.

## A few intentional MVP limits

- The cassette and tape deck are **layered 2D CSS shapes**, not a 3D model.
- Magnetic tape winding is a subtle visual approximation, not a full conservation-of-tape physical simulation.
- The current model has a front-loading tape animation, **not yet a hinged cassette door**.
- Audio and upload data are local; there is no cloud library or streaming API.
- The welcome/library → deck transition uses fade/slide rather than morphing the sideways cassette case into its front face. This avoids a warped shared-element effect.
- No automatic advancement after a song ends: the mechanism stops at READY, by design.

For ideas on improving materials, adding real button sounds and making reels more realistic, see [docs/MAKE-IT-YOURS.md](docs/MAKE-IT-YOURS.md).

## Publishing

The project is a static Vite app. `npm run build` generates `dist/`. Deploy on a static host such as Vercel or Netlify. If deploying under a non-root URL path, configure Vite's `base` and update absolute `/assets/` CSS references. Only distribute tracks you are licensed to publish.

Original library art/data adapted from your uploaded **A Mixtape of Us** ZIP, and mechanical deck styling adapted from the earlier **LOVELINE 1987** HTML prototype.
