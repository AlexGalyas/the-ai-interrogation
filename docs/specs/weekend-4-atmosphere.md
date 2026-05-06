# Weekend 4 — Atmosphere

> **Spec status:** Draft (pre-implementation)
> **Time budget:** ~5–6 hours (focused scope, not maximalist)
> **Goal:** Transform the game from "looks like a noir game" (Mini-Polish baseline) to "feels like a noir game" (atmosphere). Five focused features, deliberately chosen for impact-to-effort ratio.

---

## 1. Context

Mini-Polish established the visual foundation: warm-dark palette, role-typed typography, deterministic avatars, polished chat. Weekend 3 made the game a real detective puzzle with three convincing AI-driven suspects.

Weekend 4 is about atmosphere — the "feel" between mechanics and visuals that gives a game its emotional weight. The full Weekend 4 wishlist had 11 candidate features. We deliberately choose **five**, rejecting the rest as scope-creep risk for a single weekend. The chosen five maximize the gap between "professional prototype" and "thing you want to show people on YouTube."

By the end of this weekend, opening `localhost:3000` and questioning Henry should feel substantively different from the same action at the end of Weekend 3 — slower in pacing, atmospherically grounded, with a unique mechanic (text jitter) that no other detective game has.

References anchoring the tone: **Knives Out** (modern + classical mystery with humor underneath tension) and **Disco Elysium** (read-heavy game where atmospheric ambient and pacing carry as much weight as content).

---

## 2. Scope

### 2.1 In scope (the five focused features)

1. **Char-by-char typewriter rendering for streamed assistant messages** with skip-to-end button
2. **SVG noise grain overlay** on background, subtle
3. **Modal scale-in animation** for accusation modal, theatrical entry with backdrop blur
4. **Ambient sound (rain + room tone)** on Investigation screen only, with explicit enable on Briefing
5. **Text jitter mechanic** driven by per-suspect `nervousnessTriggers` field, with `prefers-reduced-motion` and explicit toggle support

### 2.2 Out of scope (deliberately rejected from W4)

- ❌ Screen transitions between Briefing/Investigation/Outcome — nice but not transformative
- ❌ Sound effects (button clicks, response chimes) — additive, fine without
- ❌ Music on Briefing — licensing complexity, can be added in W6 release prep
- ❌ Mobile-specific polish — V5 if real mobile users emerge
- ❌ Loading states / skeleton screens — server is fast enough that they don't register
- ❌ Empty states beyond chat — current empty state in chat is sufficient

If something on this list "wouldn't take long" — that is the trap. Add to §14 (Open questions), revisit at the end of the project or in Weekend 5.

### 2.3 Inherited from Mini-Polish (no changes)

- Palette, fonts, avatars, chat polish — stay as-is from Mini-Polish weekend
- shadcn components — stay as-is
- Briefing typography (serif title, premise block, small-caps suspects label) — unchanged

Anything that worked in Mini-Polish must keep working.

---

## 3. Feature 1 — Char-by-char typewriter

### 3.1 Behaviour

When the assistant streams a message, the displayed text appears character-by-character at a fixed pace, **independent of token arrival speed**. The buffer fills from API tokens; a separate "render tick" consumes from buffer at typewriter speed.

- **Speed:** 45ms per character (Disco Elysium-style pacing — ~4 words/second average, comfortable read speed for English)
- **Skip:** A clickable "Skip" button appears next to the streaming message bubble. Clicking it instantly flushes the buffer to displayed content. After skip, behaviour matches Weekend 1 (no typewriter for that message).
- **Per-message scope:** Skip applies only to the currently streaming message. Each new assistant response starts fresh with typewriter on.

### 3.2 Buffer + queue architecture

Per W4.2.3 decision A: typewriter is decoupled from API streaming.

```
API tokens arrive (variable speed)
        ↓
   buffer (string queue per message)
        ↓
   render-tick consumer at 45ms/char
        ↓
   messagesBySuspect[id][msg].displayedContent grows
```

- New field on assistant messages: `displayedContent: string`. Existing `content` becomes the "full received from API" buffer.
- Render reads `displayedContent`, not `content`.
- A timer (set up via `requestAnimationFrame` accumulator) advances `displayedContent` one char per ~45ms while there is buffered content (`content.length > displayedContent.length`).
- When stream ends AND buffer is fully consumed → typewriter for that message is done.
- When user clicks Skip → `displayedContent = content`, timer disposed for that message.

The store gains:
- A `tick(suspectId, messageId): void` action that advances one char on the matching message
- A `skipTypewriter(suspectId, messageId): void` action

The render hook (or a dedicated `useTypewriter(suspectId, messageId)` hook) sets up the requestAnimationFrame loop, calling `tick` when 45ms has accumulated since last tick.

### 3.3 Edge cases

- **Refresh mid-typewriter:** `displayedContent` is persisted in the store along with `content`. After refresh, the message renders with whatever `displayedContent` was at the last write — no replay of typewriter from start. Fine.
- **Player message:** No typewriter — player messages render instantly. Only assistant messages get the effect.
- **Empty stream / very short response:** Typewriter still applies; on a 5-char response it's just 225ms total. Fine.
- **Network drop mid-stream:** Buffer freezes at whatever was received. Typewriter continues to display what's in buffer. When stream is marked finished (with `(connection lost)` per Weekend 1 §4.4), typewriter completes the existing buffer.

---

## 4. Feature 2 — SVG noise grain overlay

### 4.1 Implementation

Per W4.2.4 decision A — generated SVG noise filter, not a PNG texture.

A single fixed-position element overlays the entire viewport, behind everything else (just above background). It uses an SVG `<filter>` with `<feTurbulence>` to generate procedural noise:

```html
<div class="grain-overlay" aria-hidden="true" />
```

```css
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;  /* above background, below content (which is z-index: 1+) */
  pointer-events: none;
  opacity: 0.06;  /* per W4.2.5 decision A: 5-8% range */
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/></svg>");
  mix-blend-mode: overlay;
}
```

- Inline data URL — no separate file, no network request
- `mix-blend-mode: overlay` makes the noise visually "live in" the surface beneath it rather than sitting on top
- Per W4.2.6 decision A: applies to **background only** — does not affect text or interactive elements directly because everything else has higher `z-index`

### 4.2 Where it lives in the layout

Mounted in the root `layout.tsx`, just inside `<body>`. Renders on every screen (Briefing, Investigation, Outcome). Always visible, no toggle.

### 4.3 Performance

- A single fixed-position element with a static SVG background — zero runtime cost
- `mix-blend-mode: overlay` is GPU-accelerated in all modern browsers
- No layout thrash, no animation, no JS

---

## 5. Feature 3 — Modal scale-in animation

### 5.1 Library

Add `motion/react` (formerly Framer Motion) as a dependency:

```bash
pnpm add motion
```

We deliberately avoid Motion in Mini-Polish (per ADR-0011) but allow it now (per ADR introduced in Task 1 below). Mini-Polish ADR-0011 is partially superseded — see Task 1.

### 5.2 Animation parameters

Per W4.3.2 decision B — theatrical scale-in:

```tsx
<motion.div
  initial={{ scale: 0.85, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={{ scale: 0.95, opacity: 0 }}
  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}  // easeOut spring-like cubic-bezier
>
  {modalContent}
</motion.div>
```

- Initial scale `0.85` — noticeable but not jarring
- Duration `400ms` — gives the moment weight; player registers the transition
- `cubic-bezier(0.16, 1, 0.3, 1)` — eased-out, slight overshoot feel without literal spring physics
- Exit reverses with smaller scale dropoff (`0.95` not `0.85`) — exit feels lighter than entry, like the modal is "released"

### 5.3 Backdrop blur

Per W4.3.3 decision B — subtle 4px blur on backdrop:

```tsx
<motion.div
  className="fixed inset-0 bg-black/60"
  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
  animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
  exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
  transition={{ duration: 0.3 }}
/>
```

- 4px blur — content behind modal is muffled but not unreadable
- 60% black overlay — combined with blur, focus is firmly on modal content
- Slightly faster than modal animation (300ms vs 400ms) — backdrop appears first, then modal "pops in"

### 5.4 Integration with shadcn Dialog

shadcn Dialog uses Radix UI under the hood. Radix supports custom rendering via `asChild`:

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <AnimatePresence>
    {open && (
      <DialogPortal forceMount>
        <DialogOverlay asChild>
          <motion.div ... />
        </DialogOverlay>
        <DialogContent asChild>
          <motion.div ... />
        </DialogContent>
      </DialogPortal>
    )}
  </AnimatePresence>
</Dialog>
```

`forceMount` keeps the element in the DOM during exit animation; `AnimatePresence` from motion handles enter/exit timing.

If integration with Radix proves too complex (sometimes it does), fallback approach: replace shadcn Dialog with a custom Motion-driven modal in `accusation-modal/` only. Same API surface, more control. Decide during implementation, document choice in Task 6 closure notes.

---

## 6. Feature 4 — Ambient sound (rain + room tone)

### 6.1 Audio assets

Per W4.3.7 decision A — sourced from freesound.org under CC0 or CC-BY licenses.

Two loops needed:
- **Rain ambient** — gentle rain on window, no thunder, ~30–60 second loop, under 200KB at MP3 96kbps
- **Room tone** — quiet office hum, very subtle, ~30–60 second loop, under 100KB at MP3 96kbps

Combined in playback (both play simultaneously, mixed in browser via two `<audio>` elements). Total disk footprint: under 300KB.

Files placed in `public/audio/`:
```
public/audio/rain-loop.mp3
public/audio/room-tone-loop.mp3
```

For each file, attribution is recorded in `docs/audio-credits.md` (new file) — even for CC0, recording the source is good practice.

### 6.2 Browser audio policy

Per W4.3.5 decision A — no auto-play. Browsers block audio without user interaction; we make the gesture explicit.

On Briefing screen, beneath the Begin button, add a subtle row:

```
[icon] Atmosphere: [Off]
```

When clicked:
- Initialize two `<audio>` elements with `loop`, `volume: 0.4` (rain) / `0.2` (room tone)
- Play both
- Toggle text changes to `[On]`
- Persist user preference in localStorage key `the-ai-interrogation:audio:enabled` so future sessions remember the choice (still requires gesture, but the toggle UI shows "On" so player knows it's wanted)

### 6.3 Where audio plays

Per W4.3.6 decision A — Investigation screen only.

- On Briefing: audio is enabled (gesture) but actual playback **doesn't start** until Investigation
- On Investigation: if audio enabled, both loops play
- On Outcome: audio fades out over 1 second (silence as drama)
- Returning to Briefing: audio remains enabled but stopped (until next Investigation)

This is implemented via a small `<AudioController>` client component mounted in `game-root` that observes the derived screen and starts/stops loops accordingly.

### 6.4 Volume and toggle UX

- Default volumes: rain 40%, room tone 20% (room tone is supporting, rain is the foreground feel)
- No volume slider in W4 — fixed mix. If user feedback wants control, V5 can add it.
- Toggle persists across sessions but always defaults to "Off" on first ever visit (consistent with browser policy and not surprising new users)

---

## 7. Feature 5 — Text jitter mechanic

This is the most ambitious feature of W4. It introduces a new game mechanic: per-suspect nervousness state that drives subtle visual feedback during interrogation. The mechanic is **frontend-only** (no API or model changes — per W4.4.1 decision C).

### 7.1 Type extension

`Suspect` gets one new optional field:

```ts
export interface Suspect {
  // ... existing fields ...
  nervousnessTriggers?: {
    keywords: string[];   // case-insensitive substrings; if any match player's message, increment fires
    increment: number;    // 0–100; how much to add per match (cap at 100)
  };
}
```

If absent (`undefined`), the suspect has no jitter behaviour. Backwards-compatible — Marcus, Henry, Diana from W3 work unchanged until we update them.

### 7.2 Per-suspect nervousness configuration

Per W4.4.3 decision A — all three suspects get the mechanic, with calibrated intensity per character.

- **Marcus** (innocent witness, mild lying):
  - keywords: `['key', 'gallery', '21:30', '22:00', 'car', 'Civic']`
  - increment: `15`
  - rationale: lying about presence, but not about murder. Moderate stakes.

- **Henry** (actual murderer, double-fact crack):
  - keywords: `['Adrien', 'plagiarism', 'shirt', 'garage', 'blood', 'bronze', 'statuette', 'Telegraph editor']`
  - increment: `25`
  - rationale: highest stakes. Each prodding word brings real fear.

- **Diana** (cool professional, espionage to hide):
  - keywords: `['Iris', 'bank', 'transfer', 'five hundred', 'espionage']`
  - increment: `10`
  - rationale: smallest reaction; she's deliberately controlled. Nervousness is more "cracking armor" than "panic."

### 7.3 Store extension

The game store gains per-suspect nervousness state, persisted alongside conversation:

```ts
interface CaseProgress {
  // ... existing fields ...
  nervousnessBySuspect: Record<string, number>;  // suspectId -> 0..100
}
```

Two store actions:
- `bumpNervousness(suspectId, message: string)`: scans `message` (player input) for matching keywords (case-insensitive substring); for each match, adds `increment`; caps at 100.
- `decayNervousness(suspectId)`: called after each player message that didn't trigger any keyword; multiplies current value by `0.8` (cooldown). Caps at minimum 0.

Wired into the existing message flow:
- After `appendUserMessage`, call `bumpNervousness(activeSuspectId, content)`
- If no keywords matched, call `decayNervousness(activeSuspectId)` instead

### 7.4 Visual rendering

Per W4.4.2 decision A — CSS transform jitter via animation.

A wrapper component `<JitteringText nervousness={value}>` applies a CSS class that drives keyframe animation. The intensity is parameterized via a CSS custom property:

```css
@keyframes jitter {
  0%, 100% { transform: translate(0, 0); }
  25%      { transform: translate(calc(var(--jitter-intensity) * -1px), 0); }
  50%      { transform: translate(0, calc(var(--jitter-intensity) * 0.5px)); }
  75%      { transform: translate(calc(var(--jitter-intensity) * 0.5px), 0); }
}

.jitter {
  display: inline-block;
  animation: jitter 0.15s steps(4) infinite;
}
```

The component sets `--jitter-intensity` based on nervousness, with progressive reveal per W4.4.4 decision A:

- **0–20:** No jitter applied (no class, no animation)
- **20–50:** `--jitter-intensity: 0.5` (sub-pixel; barely visible)
- **50–80:** `--jitter-intensity: 1.0` (1px max; subtle but noticeable)
- **80–100:** `--jitter-intensity: 1.5` (1.5px max; clearly nervous)

### 7.5 Where jitter applies

Only to streaming **assistant messages** (not player messages, not static UI). Specifically:
- Wrap each assistant message bubble's text content in `<JitteringText>` keyed on the active suspect's nervousness
- The wrapper updates as the message streams; entire message bubble jitters together
- Once a message is fully rendered AND finished streaming, the jitter persists (it's still "the suspect's voice")

### 7.6 Accessibility — `prefers-reduced-motion` and toggle

Per W4.4.5 decision B+C:

```css
@media (prefers-reduced-motion: reduce) {
  .jitter {
    animation: none;
  }
}
```

This handles users with system-level motion preferences automatically.

Plus an explicit toggle in the UI for users who don't have system setting but find jitter distracting:
- Added to the same row as the Audio toggle on Briefing
- Stored in localStorage key `the-ai-interrogation:reduceMotion:enabled`
- When enabled: applies a `.reduce-motion` class to `<html>` or `<body>` that disables jitter via CSS overrides equivalent to the `prefers-reduced-motion` media query

### 7.7 Decay window and feel

A subtle aspect: how fast does nervousness decay, and how does it feel?

- After each "non-trigger" player message, decay multiplier `0.8`
- Example: Marcus at 60 nervousness, player asks generic question → 60 × 0.8 = 48 → still mid-band visible jitter
- Three generic questions in a row: 60 → 48 → 38.4 → 30.7 → still in 20–50 band
- Player gets sense that "Marcus is calming down" after a string of unrelated questions, but the topic still "warms" memory
- After 5+ generic questions, nervousness approaches 0 again — fresh slate

This decay rate feels right intuitively but may need tuning in QA. If too slow (jitter persists too long after pressing on triggers), increase decay (try 0.7). If too fast (player can't tell when jitter spiked vs faded), decrease (try 0.85).

---

## 8. Technical design summary

### 8.1 New types

```ts
// Suspect type extension (optional — backward compatible)
export interface Suspect {
  // ... existing ...
  nervousnessTriggers?: { keywords: string[]; increment: number };
}

// Message type extension
export interface AssistantMessage {
  // ... existing ...
  displayedContent: string;  // for char-by-char rendering
}

// CaseProgress type extension
export interface CaseProgress {
  // ... existing ...
  nervousnessBySuspect: Record<string, number>;
}
```

Storage key bumps to `:v2` because of schema change; `persist` middleware migration drops `:v1` data silently per Weekend 2 §4.5 policy.

### 8.2 New store actions

- `tick(suspectId, messageId): void` — advance one char in displayedContent
- `skipTypewriter(suspectId, messageId): void` — flush displayed to full content
- `bumpNervousness(suspectId, message): void` — keyword matching + increment + cap
- `decayNervousness(suspectId): void` — multiply by 0.8 + floor at 0
- `getNervousness(suspectId): number` — selector

### 8.3 New / changed components

```
src/components/
  audio-controller/
    audio-controller.tsx        — new, screen-aware audio player
    index.ts
  audio-toggle/
    audio-toggle.tsx            — new, on/off toggle for ambient sound
    index.ts
  motion-toggle/
    motion-toggle.tsx           — new, on/off toggle for jitter/animations
    index.ts
  jittering-text/
    jittering-text.tsx          — new, CSS-driven jitter wrapper
    index.ts
  grain-overlay/
    grain-overlay.tsx           — new, fixed positioned SVG-noise overlay
    index.ts

src/features/
  interrogation/
    chat-message/
      chat-message.tsx          — modified: wraps assistant text in JitteringText, tracks displayedContent, renders Skip button while streaming
  accusation/
    accusation-modal/
      accusation-modal.tsx      — modified: motion-driven scale-in + backdrop blur
  briefing/
    briefing-screen/
      briefing-screen.tsx       — modified: adds Atmosphere and Reduce Motion toggles
  game-root/
    game-root/
      game-root.tsx             — modified: mounts AudioController and GrainOverlay
```

### 8.4 Schema migration

- `STORAGE_KEY = 'the-ai-interrogation:game:v2'` (was `:v1`)
- `persist` middleware version bumped from `1` to `2`
- `migrate` callback: if version `1` data is present, drop it and start fresh — no migration logic. (We're not in production yet; clean slate is fine.)

### 8.5 Audio file packaging

Files in `public/audio/` are served as static assets by Next. `<audio>` elements use `src="/audio/rain-loop.mp3"`, etc. No imports, no bundling.

---

## 9. Test plan

### 9.1 Existing tests must still pass

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all green at every step
- Vitest `build-suspect-prompt` tests still pass (Suspect type extended with optional field — non-breaking)
- Vitest `evaluate-accusation` tests still pass — no logic change
- Playwright happy-path E2E from W3 still passes:
  - Locators are role-based, atmospheric changes don't affect them
  - Mock body still streams plain text — typewriter just buffers it slowly, but eventually all content is rendered. Playwright's `expect(text).toBeVisible()` waits for the text to actually appear in DOM; with 45ms/char typewriter, a 60-char mock body takes ~2.7 seconds to fully render. Add a generous timeout (3 seconds) on the streaming-text assertion if needed.
  - Modal animation runs on entry — Playwright waits for `dialog` role to be visible, which Radix marks visible the moment it's portaled, regardless of motion state. Should still work.
  - Audio is off by default — no autoplay in tests
  - Jitter is off if `prefers-reduced-motion` is set in test viewport, OR if test viewport has standard settings, jitter just runs but doesn't affect locators

### 9.2 New tests

Vitest unit tests for the new pure logic:

`tests/unit/nervousness.test.ts`:
- `bumpNervousness` increments by `increment` per matching keyword
- Multiple matches in single message stack: "I know about your shirt and your plagiarism" with both keywords → adds 2× increment
- Caps at 100
- Case-insensitive matching: "ADRIEN" matches `'Adrien'`
- Substring matching: "the shirt" matches `'shirt'`
- `decayNervousness` multiplies by 0.8
- Decay floors at 0 (or epsilon — define and stick with it)

`tests/unit/typewriter.test.ts`:
- `tick` advances `displayedContent.length` by 1 if `content.length > displayedContent.length`
- `tick` is no-op if already caught up
- `skipTypewriter` sets `displayedContent = content`
- Both actions handle missing/invalid messageId gracefully

### 9.3 Manual visual / sensory QA

This is where subjective polish lives. Goals:

- **Char-by-char typewriter feel:** Pace feels like reading; not too fast, not maddeningly slow. Skip button works and doesn't feel like a hidden feature.
- **Grain visibility:** Subtle. Visible if you look for it; doesn't reduce text legibility.
- **Modal entry:** Modal "lands" visibly. Not jarring, not delayed-feeling. Backdrop blur registers without being heavy.
- **Audio:** When enabled, atmosphere genuinely changes. Rain doesn't drown out reading. Toggling off is silent and immediate. Audio file size is reasonable (under 300KB total).
- **Jitter:** Try generic questions for Henry — no visible jitter. Try one trigger word — slight, almost subliminal jitter on his next response. Try multiple trigger words rapid-fire — clearly visible jitter. Try 5 generic questions in a row after that — jitter fades. The "feel" of investigative pressure should be real.
- **Reduce motion:** Toggle the explicit option, observe jitter stops immediately. Set `prefers-reduced-motion` in DevTools, refresh, observe jitter never appears.
- **Cross-feature interaction:** All five features active simultaneously — does the experience feel cohesive or chaotic? Adjust if any single feature dominates.

### 9.4 Updated screen recording

A new full Win playthrough recording captures the atmospheric Weekend 4 — typewriter, grain, modal, audio (capture this with system audio), jitter on Henry's name during the right phase. Saves outside repo, replaces W3 recording as the canonical demo.

---

## 10. Tasks (step-by-step plan)

This section is the **single source of truth** for implementation order, scope per task, acceptance criteria, and documentation requirements. Each task is self-contained: a coding agent should be able to execute one task end-to-end using only the spec sections it references and the inputs explicitly listed.

### 10.0 Conventions (apply to every task)

1. **Branch naming:** as listed in each task.
2. **Commit message:** as listed in each task (Conventional Commits format).
3. **Each task is its own PR.** Squash-merge into `main`. CI green required.
4. **Before starting a task:** `git checkout main && git pull origin main && git checkout -b <branch>`. Re-read the task block in this spec. Confirm scope. Do NOT exceed scope; if scope is ambiguous or seems insufficient, stop and ask the maintainer.
5. **Before declaring a task done:** see §11 (Per-task closure protocol) — fill in §12 (Task tracking) for that task and append to journal.

---

### Task 1 — Spec, ADRs, journal stub

**Branch:** `docs/weekend-4-spec`
**Commit message:** `docs: weekend 4 spec, ADRs for atmosphere and text jitter, journal stub`
**Estimated time:** 30m

**Inputs:**
- This spec file
- `docs/decisions/0011-css-only-interactions.md` (or whatever Mini-Polish ADR-0011 is named) — to be partially superseded
- Existing `docs/decisions/` contents — to verify next available ADR numbers

**Scope (do, exactly):**
1. Verify next available ADR numbers via `ls docs/decisions/`. If 0014 and 0015 are taken, use the next free pair.
2. Place this spec at `docs/specs/weekend-4-atmosphere.md`. Verify it lints cleanly.
3. Create `docs/decisions/<NUM1>-weekend-4-atmosphere-and-motion-library.md`:
   - Standard ADR format (Status: Accepted, Date, Context, Decision, Consequences, Rationale)
   - Source content: §13 first bullet of this spec
   - Edit existing ADR-0011: change Status to "Partially superseded by ADR-<NUM1> (modal animation only)"; add cross-reference. CSS-only rule remains binding for non-W4 components.
4. Create `docs/decisions/<NUM2>-text-jitter-mechanic.md`:
   - Source content: §13 second bullet of this spec
5. Create `docs/journal/weekend-4.md` with the five-section template (What I built / What was hard / Interesting moments worth showing on video / Mistakes / Spec deviations).

**Scope (do NOT):**
- Install Motion library
- Touch any code, tests, or runtime behaviour
- Touch any ADR other than 0011 (and only its Status header line)

**Acceptance criteria — automatic:**
- `pnpm typecheck` passes
- `pnpm lint` passes
- `pnpm test` passes
- `pnpm test:e2e` passes

**Acceptance criteria — manual:**
- Spec file exists at `docs/specs/weekend-4-atmosphere.md`
- Both new ADRs exist with correct numbers
- ADR-0011 has Status updated and cross-reference
- `docs/journal/weekend-4.md` exists with five empty stubs

**Closure (per §11):** Update §12 with status, list of changed files, ADR numbers used, and any deviations.

---

### Task 2 — Storage migration + state extensions

**Branch:** `feat/storage-and-state-extensions`
**Commit message:** `feat(state): bump storage to v2; extend types for typewriter and nervousness`
**Estimated time:** 60m

**Inputs:**
- §3.2, §7.3, §8.1, §8.2, §8.4 of this spec
- Existing store at `src/stores/game.ts` (or wherever it lives)
- Existing types in `src/lib/game/types.ts`

**Scope (do):**
1. Extend types per §8.1:
   - `Suspect.nervousnessTriggers?` (optional)
   - Assistant message gets `displayedContent: string`
   - `CaseProgress.nervousnessBySuspect: Record<string, number>`
2. Update `STORAGE_KEY` from `:v1` to `:v2`. Update `persist` middleware version `1 → 2`. `migrate` callback drops `:v1` data and returns clean state.
3. Update store actions per §8.2:
   - `appendAssistantMessage` (or equivalent) initialises `displayedContent: ''` for new assistant messages
   - Add `tick(suspectId, messageId)`: advance `displayedContent` by one char if `displayedContent.length < content.length`. No-op otherwise.
   - Add `skipTypewriter(suspectId, messageId)`: set `displayedContent = content`
   - Add `bumpNervousness(suspectId, message)`: keyword scan, sum increments per match, cap at 100
   - Add `decayNervousness(suspectId)`: multiply by 0.8, floor at 0
   - Add selector `getNervousness(suspectId)`
4. When player sends a message: after `appendUserMessage`, check if active suspect has `nervousnessTriggers`. If yes, scan; if any keyword matches, call `bumpNervousness`; otherwise call `decayNervousness`.
5. Add Vitest tests:
   - `tests/unit/nervousness.test.ts` per §9.2
   - `tests/unit/typewriter.test.ts` per §9.2

**Scope (do NOT):**
- Render anything yet (no JitteringText, no skip button, no rendering of `displayedContent`)
- Update suspect data with `nervousnessTriggers` (that's Task 5)
- Touch components or UI

**Acceptance criteria — automatic:**
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` pass
- New tests in `tests/unit/nervousness.test.ts` and `tests/unit/typewriter.test.ts` pass (target: at least the cases listed in §9.2)

**Acceptance criteria — manual:**
- Open DevTools → Application → Local Storage during a fresh session: storage key is `the-ai-interrogation:game:v2`
- If old `:v1` data exists from W3 sessions, it gets dropped on first load (verify by clearing console errors, no migration crash)
- After sending a message in dev: `displayedContent` field exists on the new assistant message in store state (DevTools React/Zustand inspector)

**Closure (per §11):** Update §12. Note any test cases added beyond the §9.2 minimum. Note if migration logic was different from spec (e.g., if a user had v0 and v1).

---

### Task 3 — Char-by-char typewriter rendering

**Branch:** `feat/typewriter-rendering`
**Commit message:** `feat(ui): render assistant messages char-by-char with skip button`
**Estimated time:** 45m

**Inputs:**
- §3.1, §3.2, §3.3 of this spec
- Existing `src/features/interrogation/chat-message/` (or equivalent)
- Task 2 store actions: `tick`, `skipTypewriter`

**Scope (do):**
1. Create or update `useTypewriter(suspectId, messageId)` hook:
   - Sets up `requestAnimationFrame` loop
   - Accumulates time, calls `tick` when 45ms+ has passed since last tick
   - Stops the loop when `displayedContent.length === content.length` AND streaming is finished
   - Cleans up loop on unmount
2. Update assistant message rendering: render `displayedContent` instead of `content`
3. Add Skip button next to streaming assistant message:
   - Visible only while `displayedContent.length < content.length` AND streaming/typewriter not done
   - Click → call `skipTypewriter(suspectId, messageId)`
   - Style: subtle, small, font-sans (UI element, not transcript)
4. Player messages render `content` directly — no typewriter effect

**Scope (do NOT):**
- Apply jitter (Task 5)
- Add Motion / animations beyond the typewriter
- Change message bubble styling

**Acceptance criteria — automatic:**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` pass
- `pnpm test:e2e` passes — Playwright happy-path adapted if needed (timeout for streaming text assertion may need a small bump per §9.1 note; do this minimally)

**Acceptance criteria — manual:**
- `pnpm dev`, clear localStorage, ask Marcus a question
- Marcus's response appears char-by-char visibly, ~45ms per character
- Skip button visible during streaming, click → text completes immediately
- Player questions render instantly (no typewriter)
- Refresh mid-typewriter: message renders at the saved `displayedContent` snapshot, no replay
- Multiple questions in a row: each new response gets fresh typewriter

**Closure (per §11):** Update §12. If E2E timeout was bumped, note the new value and reasoning.

---

### Task 4 — Grain overlay

**Branch:** `feat/grain-overlay`
**Commit message:** `feat(ui): add SVG noise grain overlay`
**Estimated time:** 20m

**Inputs:**
- §4 of this spec

**Scope (do):**
1. Create `src/components/grain-overlay/grain-overlay.tsx` per ADR-0006 folder+barrel:
   - Renders the fixed-position div with the inline SVG noise URL per §4.1
   - `aria-hidden="true"`
2. Create `src/components/grain-overlay/index.ts` (barrel)
3. Mount `<GrainOverlay />` in `src/app/layout.tsx` just inside `<body>`, before `{children}`
4. CSS for `.grain-overlay` per §4.1 — placed in `globals.css` or a co-located CSS module (match existing project convention)

**Scope (do NOT):**
- Add toggle for grain (it's always on per §4.2)
- Animate the grain
- Touch any other component

**Acceptance criteria — automatic:**
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` pass

**Acceptance criteria — manual:**
- Open the page on a dark area: subtle noise visible if you look closely
- Text is fully readable; grain does not interfere with legibility
- Visible on Briefing, Investigation, and Outcome screens
- Grain layer does NOT capture mouse events (all interactions still work)

**Closure (per §11):** Update §12.

---

### Task 5 — Suspect nervousness config + JitteringText component

**Branch:** `feat/text-jitter`
**Commit message:** `feat(ui): add text jitter mechanic with per-suspect nervousness triggers`
**Estimated time:** 60m

**Inputs:**
- §7 of this spec (all of it)
- Task 2 store actions and selectors
- Existing suspect data in `src/content/cases/case-01-soho-gallery.ts` (or split files)

**Scope (do):**
1. Update three suspects with `nervousnessTriggers` per §7.2:
   - Marcus: keywords `['key', 'gallery', '21:30', '22:00', 'car', 'Civic']`, increment `15`
   - Henry: keywords `['Adrien', 'plagiarism', 'shirt', 'garage', 'blood', 'bronze', 'statuette', 'Telegraph editor']`, increment `25`
   - Diana: keywords `['Iris', 'bank', 'transfer', 'five hundred', 'espionage']`, increment `10`
2. Create `src/components/jittering-text/jittering-text.tsx` per ADR-0006:
   - Props: `{ children: ReactNode; nervousness: number }`
   - Per §7.4 progressive reveal: 0–20 no class; 20–50 `.jitter-low`; 50–80 `.jitter-mid`; 80–100 `.jitter-high`
   - Set `--jitter-intensity` CSS variable per band
3. Create `src/components/jittering-text/index.ts` (barrel)
4. CSS keyframes and `.jitter-*` classes per §7.4 in globals.css. Include `prefers-reduced-motion` media query per §7.6.
5. In assistant message rendering: wrap message text in `<JitteringText nervousness={getNervousness(suspectId)}>`
6. Skip button does NOT need to be inside JitteringText (it's UI, not transcript)

**Scope (do NOT):**
- Add the explicit toggle yet (Task 7)
- Change suspect content beyond adding `nervousnessTriggers`
- Apply jitter to player messages or UI

**Acceptance criteria — automatic:**
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` pass
- Existing `build-suspect-prompt` tests still pass (Suspect type extended optionally; existing prompts unaffected)

**Acceptance criteria — manual:**
- Ask Henry a generic question (no trigger keywords): jitter is off (`getNervousness` is 0 or low)
- Ask Henry "tell me about Adrien Cole": jitter visible on his next response (subtle band)
- Ask Henry several trigger-heavy questions in a row: jitter intensifies, may reach high band
- Ask Henry 5 generic questions: jitter fades to invisible
- DevTools → set `prefers-reduced-motion: reduce`: jitter stops entirely
- Marcus, Diana also exhibit jitter on their respective trigger words at appropriate intensities

**Closure (per §11):** Update §12. Note any keyword adjustments made if QA reveals false-positive triggers (e.g., "gallery" matching mid-conversation accidentally — rare but possible).

---

### Task 6 — Accusation modal animation (Motion)

**Branch:** `feat/modal-animation`
**Commit message:** `feat(ui): scale-in modal animation with backdrop blur`
**Estimated time:** 45m

**Inputs:**
- §5 of this spec
- Existing `src/features/accusation/accusation-modal/`

**Scope (do):**
1. Install Motion: `pnpm add motion`
2. Update accusation modal per §5.2 and §5.3:
   - Wrap content in `motion.div` with `initial`, `animate`, `exit` per §5.2
   - Backdrop in `motion.div` per §5.3
   - Use `AnimatePresence` for exit animations
3. Integrate with shadcn Dialog per §5.4. If Radix `asChild` integration is too complex, fallback: replace shadcn Dialog with custom Motion modal in this component only (per §5.4 note). Document choice in §12.

**Scope (do NOT):**
- Add Motion to other components (jittering already uses CSS, screens stay static)
- Add screen transitions (out of scope per §2.2)

**Acceptance criteria — automatic:**
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` pass
- Playwright happy-path: modal `dialog` role becomes visible after Accuse click. Animation duration is well under default 5s timeout. No changes expected.

**Acceptance criteria — manual:**
- Click Accuse on Investigation screen: modal scales in from 85% with 400ms easing; backdrop blurs in over 300ms
- Cancel or close: modal scales out to 95% over 300ms; backdrop blur clears
- Animation is GPU-smooth (no jank), tested on a dev laptop
- Backdrop blur is visible (~4px); content behind is muffled but recognizable

**Closure (per §11):** Update §12. Note whether shadcn Dialog integration succeeded or fallback to custom Motion modal was used.

---

### Task 7 — Audio assets + audio controller + toggles

**Branch:** `feat/ambient-audio-and-toggles`
**Commit message:** `feat(ui): ambient audio with explicit enable; motion-reduce toggle`
**Estimated time:** 60m

**Inputs:**
- §6 of this spec
- §7.6 of this spec (motion toggle)
- The maintainer must have placed two audio files in `public/audio/` before starting (see Pre-task)

**Pre-task (the maintainer, NOT the agent, does this):**
- Find a `rain-loop.mp3` (~30–60s, gentle rain, no thunder, ~96kbps, < 200KB) on freesound.org under CC0 or CC-BY
- Find a `room-tone-loop.mp3` (~30–60s, quiet office hum, ~96kbps, < 100KB) on freesound.org under CC0 or CC-BY
- Place both in `public/audio/`
- Note source URLs and licenses for the credits file

**Scope (do):**
1. Create `docs/audio-credits.md`. List both files with source URL and license. (If maintainer pre-filled, verify and extend; otherwise use placeholder text and ask maintainer to fill.)
2. Create `src/components/audio-controller/audio-controller.tsx` per §6.3:
   - Reads current screen from store (`deriveScreen` selector)
   - Reads `audioEnabled` from localStorage key `the-ai-interrogation:audio:enabled`
   - On mount and on screen change: if enabled AND screen is `'investigation'` → play both loops; otherwise pause/stop
   - On Outcome: fade out volumes to 0 over 1 second, then pause
   - Two `<audio>` elements: rain volume 0.4, room tone volume 0.2
3. Create `src/components/audio-controller/index.ts` (barrel)
4. Mount `<AudioController />` in `game-root.tsx`
5. Create `src/components/audio-toggle/audio-toggle.tsx`:
   - Renders "Atmosphere: [Off/On]" with subtle styling
   - Reads/writes `the-ai-interrogation:audio:enabled` in localStorage
   - Triggers re-render of audio controller on toggle (via store or React context — prefer store for consistency)
6. Create `src/components/motion-toggle/motion-toggle.tsx`:
   - Renders "Reduce Motion: [Off/On]" with subtle styling
   - Reads/writes `the-ai-interrogation:reduceMotion:enabled` in localStorage
   - When On: applies a `.reduce-motion` class to `<html>` or `<body>` that disables jitter and Motion-driven animations (e.g., `.reduce-motion .jitter-low, .reduce-motion .jitter-mid, .reduce-motion .jitter-high { animation: none !important; }`)
7. Add both toggles to Briefing screen, just below the Begin button, in a single subtle row
8. Both toggles' state persists across sessions; defaults are Off on first ever visit

**Scope (do NOT):**
- Add volume sliders (out of scope; fixed mix per §6.4)
- Auto-play audio (browser blocks; out of scope per §6.2)
- Apply music or sound effects (out of scope per §2.2)

**Acceptance criteria — automatic:**
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` pass
- Audio is off in test environment (no autoplay), so E2E unaffected

**Acceptance criteria — manual:**
- Briefing shows two toggles below Begin button: "Atmosphere" and "Reduce Motion"
- Click "Atmosphere": label changes to "On". Begin investigation: both loops start playing on Investigation screen
- Toggle off mid-Investigation: audio stops immediately
- Reach Outcome screen: audio fades out over 1 second
- Refresh on Investigation with audio On: audio resumes (after first user interaction with the page if browser policy requires it; gesture from previous toggle may not transfer across refresh — accept limitation, it's expected)
- Click "Reduce Motion": jitter on assistant messages stops immediately. Modal scale-in still works (Motion library, not jitter — design choice; document in journal)
- DevTools `prefers-reduced-motion: reduce` setting also disables jitter, regardless of explicit toggle
- `docs/audio-credits.md` lists both files with source and license

**Closure (per §11):** Update §12. List actual audio file sources used and confirm licenses. Note if Motion-driven modal animation was disabled by the Reduce Motion toggle or kept enabled.

---

### Task 8 — Manual sensory QA + adjustments

**Branch:** as-needed (`fix/<short>` for any specific issue, OR none if no issues)
**Estimated time:** 45m

**Inputs:**
- §9.3 of this spec
- All previous task outputs

**Scope:**
1. Execute the full §9.3 QA list. For each feature, observe the manual criteria.
2. Identify subjective polish issues:
   - Typewriter speed feel (too fast / too slow / right)
   - Grain visibility (too strong / right / invisible)
   - Modal animation feel (right / too fast / too slow)
   - Audio mix (rain too loud / right / room tone wrong)
   - Jitter intensity per band (subtle band actually visible / mid band too aggressive / etc.)
   - Cross-feature interaction (does anything dominate or conflict?)
3. For each issue found:
   - If trivial parameter adjustment (e.g., "typewriter is 50ms not 45ms"): create a `fix/<short>` PR with that single change
   - If non-trivial (e.g., "audio doesn't fade on Outcome"): create a `fix/<short>` PR with the targeted change
4. Record a fresh Win playthrough screen recording per §9.4 (use OBS, Screen Studio, or QuickTime; capture system audio so ambient is in the recording). Save outside repo.

**Acceptance criteria — manual:**
- §9.3 QA list reviewed in full; each item subjectively passing or with logged issue
- Any logged critical issues fixed via `fix/<short>` PRs
- Subjective non-blocking issues recorded in `docs/journal/weekend-4.md` for Weekend 5+ consideration
- New screen recording exists locally

**Closure (per §11):** Update §12. List all `fix/<short>` PRs created and their resolutions. Note any items that were intentionally NOT fixed and the rationale (subjective preference vs measurable bug).

---

### Task 9 — Final chore PR: journal, spec verification, tag prep

**Branch:** `chore/weekend-4-done`
**Commit message:** `chore: weekend 4 done`
**Estimated time:** 30m

**Inputs:**
- §11 (per-task closure protocol) — verify all tasks 1–8 have been closed in §12
- `docs/journal/weekend-4.md` — verify all five sections have content

**Scope (do):**
1. Verify §12 is fully populated for tasks 1–8. If any task is incomplete or missing closure, stop and ask the maintainer.
2. Verify `docs/journal/weekend-4.md` has content in all five sections. If any section is empty, write `(none of note)` instead of leaving blank.
3. Audit branch hygiene: `git branch --merged main`. Delete merged local branches (`git branch -d <name>`).
4. Spec drift check: re-read §2.1 and §2.2. Did anything from §2.1 ship differently? Did anything from §2.2 sneak in? Update §2 if so. Cross-check §10's per-task acceptance against the actual delivered behaviour. Note in §12 if any acceptance criteria were not strictly met but accepted with rationale.
5. Add to bottom of journal: "After this PR merges, the maintainer will tag the commit on main as `weekend-4`."
6. Final test run: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e`. All pass.

**Scope (do NOT):**
- Push the tag (manual step by maintainer after PR merge)
- Make code changes (this is documentation-only)

**Acceptance criteria — automatic:**
- All checks pass

**Acceptance criteria — manual:**
- §12 fully populated
- Journal has content in all five sections
- No stale local branches
- Spec is self-consistent (§2 reflects reality)

**Closure (per §11):** Mark task 9 complete in §12. This is the final task — `weekend-4` tag is pushed by maintainer after the PR merges.

---

## 11. Per-task closure protocol

After completing the scope of any task above, before opening the PR, the agent (or maintainer) must do the following:

1. **Update §12 (Task tracking) with the appropriate task row:**
   - Set `status` to `Done`
   - Fill in `files_changed` with the comma-separated list of paths actually modified (this is what `git diff main --name-only` reveals)
   - Fill in `notes` with: any deviations from spec, any decisions made under "decide during implementation" license in §10, any fix-PRs that the task spawned, any acceptance criteria that were not strictly met (with rationale)
   - Fill in `verified_by` with one of: `automatic` (only programmatic checks), `manual` (subjective QA in addition), `both`
2. **Append a bullet to `docs/journal/weekend-4.md` under "What I built"** describing this task's outcome in one or two sentences. If the task surfaced something hard, also add to "What was hard". If the task showed something demo-worthy (e.g., "first time the audio kicked in and the room felt different"), add to "Interesting moments worth showing on video".
3. **Verify acceptance criteria:** all "automatic" criteria pass. Manual criteria observed and signed off (the agent reports observation to the maintainer; the maintainer confirms before PR merge).

If any acceptance criterion is NOT met but the task is otherwise complete, the agent must:
- Not declare the task done
- Open `docs/journal/weekend-4.md` and add to "What was hard": the failed criterion, observed behaviour, hypothesis on cause
- Stop and report to the maintainer with the specific failure transcript or screenshot before continuing

**Spec drift policy:** If during a task it becomes clear that the spec is wrong or insufficient, the agent does NOT silently work around it. The agent stops, opens an "Open question" entry in §14 of this spec describing the gap, and asks the maintainer for guidance. The fix is either (a) clarify the spec in the same PR with explicit note, or (b) defer and continue with a documented limitation. Either way it is recorded in §12's `notes` for the affected task.

---

## 12. Task tracking

The agent updates this table after closing each task. Status starts as `Not started` for all tasks; transitions to `In progress` when branch is created; transitions to `Done` only after §11 closure protocol is met. PR URLs are added when the PR is opened.

| # | Task | Status | PR | Files changed | Verified by | Notes |
|---|---|---|---|---|---|---|
| 1 | Spec + ADRs + journal stub | Done | [#32](https://github.com/AlexGalyas/the-ai-interrogation/pull/32) | docs/specs/weekend-4-atmosphere.md, docs/decisions/0011-noir-palette-and-typography.md, docs/decisions/0016-weekend-4-atmosphere-and-motion-library.md, docs/decisions/0017-text-jitter-mechanic.md, docs/journal/weekend-4.md | automatic | ADR numbers used: 0016 (atmosphere + Motion admission, partially supersedes ADR-0011's CSS-only clause) and 0017 (text jitter mechanic). ADR-0011 status header rewritten in place per §10's "only its Status header line" constraint — cross-reference embedded in the Status line itself rather than as a separate field. No deviations from spec scope; no code touched. |
| 2 | Storage migration + state extensions | Done | [#33](https://github.com/AlexGalyas/the-ai-interrogation/pull/33) | src/lib/game/types.ts, src/lib/game/nervousness.ts, src/stores/game.ts, tests/unit/game-store.test.ts, tests/unit/nervousness.test.ts, tests/unit/typewriter.test.ts | automatic | Pure-logic deviation: extracted `applyNervousnessBump` / `applyNervousnessDecay` / `countNervousnessMatches` to `src/lib/game/nervousness.ts` so the keyword-scan and decay logic could be unit-tested without booting the store and without needing to add `nervousnessTriggers` to the actual Marcus/Henry/Diana suspects (Task 5 scope). Store actions wrap these pure helpers. Decay floors residuals below 1 to 0 (rather than carrying epsilon values forever) — defines the "or epsilon" wording in §9.2 explicitly. `Message` carries `displayedContent: string` uniformly (user messages get `content` mirrored; assistant messages start at `''`); chose unified shape over discriminated union to avoid breaking every existing consumer. Store reads the FULL `caseSohoGallery` (not the public projection) for nervousness-trigger lookup — acceptable per ADR-0014's already-acknowledged JS-bundle leak. Test count: 26 new tests (16 nervousness + 10 typewriter); all 71 unit tests + E2E happy-path green. |
| 3 | Char-by-char typewriter rendering | Not started | — | — | — | — |
| 4 | Grain overlay | Not started | — | — | — | — |
| 5 | Text jitter mechanic | Not started | — | — | — | — |
| 6 | Modal scale-in animation | Not started | — | — | — | — |
| 7 | Ambient audio + toggles | Not started | — | — | — | — |
| 8 | Manual sensory QA + adjustments | Not started | — | — | — | — |
| 9 | Chore: weekend 4 done | Not started | — | — | — | — |

---

## 13. Decisions recorded

To be promoted to ADRs in Task 1.

- **ADR — Weekend 4 atmosphere features and Motion library admission.** Five focused features (typewriter, grain, modal animation, audio, jitter) chosen for impact-to-effort. Motion (`motion/react`) library admitted to dependencies, partially superseding ADR-0011's CSS-only commitment — ADR-0011 still stands for non-W4 components, but accusation modal animation is the authorized use of Motion. Storage version bumped to `:v2` with no migration logic (clean slate acceptable pre-release).

- **ADR — Text jitter mechanic via per-suspect `nervousnessTriggers`.** Visual feedback during interrogation. Three-tier intensity (subtle/visible/strong) with progressive reveal. Frontend-only (no API/model changes). Accessibility-aware (`prefers-reduced-motion` + explicit toggle). Decay rate 0.8 per non-trigger message. The mechanic is unique to this game and is the W4 signature feature.

---

## 14. Open questions

*(empty at draft time — populate during execution if spec drift surfaces)*
