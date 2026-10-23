# Loveline project instructions

## Product priorities

- Loveline is a small, curated collection of songs presented as a physical cassette player. Prioritize the listening experience, atmosphere, and care in each interaction over throughput or the shortest possible animation.
- Give cassette insertion and ejection time to feel tangible: approach, alignment, seating, latch release, and removal should read as connected physical movements.
- EJECT leaves the cassette raised and available to touch. Pressing the tape or INSERT seats it again; pressing the surrounding surface, RETIRAR, or Escape removes it. Preserve the song position when ejecting and reinserting, and keep music paused until PLAY.
- A raised tape follows a mouse or touch drag. A deliberate drag or flick throws it in the released direction; a small abandoned drag returns it gently to rest without inserting it. Keep tap and keyboard reinsertion available.
- Keep motion fluid, with gradual acceleration and deceleration. Avoid abrupt appearances, snaps, exaggerated bounce, frozen holds, and artificial waiting periods.
- Acknowledge input promptly through the button's movement and mechanical sound. A deliberate animation can take longer without delaying feedback to the user's action.
- Synchronize mechanical sounds with the visible contacts and movement. Preserve the character of clicks and springs when changing animation duration; do not simply slow all audio playback.
- Keep image decoding, caching, and song buffering efficient so deliberate pacing comes from the interaction design rather than loading stalls or dropped frames.
- Respect reduced-motion preferences and keyboard access. Music starts only when the user presses PLAY.
- The RITMO button selects slow, normal, or fast cassette movement and remembers it in localStorage for that device/browser. Apply the same timing to motion and mechanical sound cues, preserve music playback speed, and do not change animation speed mid-transition. Reduced motion takes priority.
- Evaluate changes by watching and listening to a full sequence: select a tape, insert, play, stop, change tapes, and eject, on mobile and desktop.

## Implementation and verification

- Keep cassette paths, timing, and shared sound cues in `src/config/cassetteMotion.ts`.
- Let animation completion advance the cassette transport state; do not replace it with unrelated timers.
- Keep the moving cassette mounted through insertion, ready, and ejection so its layers move as one object.
- Run `npm run build`, `npm run lint`, and `git diff --check` after changes. Run `npm run test:transport` and check reduced motion and repeated interactions when editing the transport lifecycle.
