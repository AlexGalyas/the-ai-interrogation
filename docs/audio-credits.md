# Audio Credits

Ambient audio assets used by the Investigation screen (see `src/components/audio-controller/` and spec §6).

## `public/audio/rain-loop.mp3`

- **Source:** https://freesound.org/people/Nimlos/sounds/423610/
- **Author:** Nimlos
- **License:** [CC0 1.0 Universal (Public Domain Dedication)](https://creativecommons.org/publicdomain/zero/1.0/)

CC0 does not require attribution legally, but we record the source here so future contributors can find the original, verify the license, or replace the asset if needed.

## Notes

Spec §6.1 originally called for two loops — gentle rain plus a quiet room-tone hum, mixed simultaneously. Task 7 shipped with **rain only** (decision made during the pre-task asset hunt); the room-tone loop is deferred and may be added in Task 8 sensory QA or in a follow-up weekend if playtesting shows the atmosphere needs more body. The audio controller is structured around a single `<audio>` element today; adding a second loop later is a small additive change (another ref + another `play/pause` branch).
