# Make it yours — a practical roadmap

This project is meant to be modified by you, one small part at a time.

## Level 1 — Personalize without changing mechanics

- Open `src/data/mixtapes.ts`: replace dates, dedication text, titles and track metadata.
- Try adding a new cassette entry by copying an object in `MIXTAPES`.
- Replace `public/audio/demo-1.mp3` with one of your own recordings (or change the `src` path).
- Try a new shell palette in `PhysicalCassette.tsx` under `skins`.

## Level 2 — Physical layers

Current element tree:

```text
PhysicalCassette
  .deck-tape                       plastic shell
    .deck-tape-paper               paper sleeve / printed design
      .deck-paper-head             title / side A
      .deck-window                 transparent tape window
        .deck-reel.left            left supply reel
          .deck-wind               magnetic tape rings
          .deck-spokes             rotating hub
        .deck-reel.right           right take-up reel
    .deck-screw                    metal screws
    .deck-tape-bottom              bottom guide cutout
```

A realistic shell can use a transparent PNG texture as one CSS background layer; don't cover the animated reels with a flattened full-cassette photograph. Keep the spindle SVGs/DOM elements independent. The shell and paper sleeve may receive different skins without altering mechanical state.

For a custom label, you could add an optional `labelImage` field to each `Mixtape` and place an `<img>` inside `.deck-tape-paper`, **behind** the moving reels.

## Level 3 — Improve physical motion

- Change transition duration/easing of `.deck-tape-wrap` (insertion/ejection) in `deck-original.css`.
- Adjust physical audio click frequencies in `src/utils/sfx.ts` or replace the procedural sounds with your own `.wav` files.
- In `PhysicalCassette.tsx`, modify the reel speeds; they now depend gently on progress.
- Build a hinged `CassetteDoor` component as a **separate layer**, animated only on Insert/Eject.

## Level 4 — More realism, still simple

- Replace CSS spokes with intricate transparent SVG reel artwork.
- Add imperfect brushed metal, small shadows and light scratches to the deck via texture images.
- Integrate rewind/fast-forward behavior without changing the core state model.
- Add Side B, track metadata inside the paper label and individual stickers.
- Add a minimal “reduced motion” toggle in addition to the browser's preference.

## Motion design notes (from your research)

The cassette is the protagonist. Motion primarily uses `transform` and `opacity`; reels are independently controlled and should follow real playback. Use a library-to-deck fade/slide while transitioning a sideways cassette *case* to a front-facing cassette *shell*; a literal shared-element morph would distort the geometry.

Keep important controls accessible and visible; mechanical animations are feedback, not the sole way to understand playback state. Avoid extra animation dependencies until a specific need appears. Motion manages screen transitions; CSS and requestAnimationFrame manage the physical machine.
