# ADR-0017: Text Jitter Mechanic via Per-Suspect `nervousnessTriggers`

**Status:** Accepted
**Date:** 2026-05-06

## Context

Weekend 4 commits to atmosphere — the gap between "professional prototype" and "thing you want to show people on YouTube." Four of the five features (typewriter, grain, modal animation, ambient audio) are recognisable polish moves any detective game might use. The fifth is the signature feature — something this game has that no other detective game does: **text jitter on suspect dialogue, driven by a per-suspect nervousness state that responds to the player's interrogation pressure.**

The mechanic asks two questions:
- What makes the suspect's text jitter? — i.e. what is "nervousness," and what is its data shape?
- What does the jitter actually look like? — i.e. how is the visual feedback rendered, and how does it stay accessible?

Several encodings were considered for the data shape:

1. **Hand-written natural-language rules in the prompt.** Tell each suspect "if the player mentions Adrien, get nervous." Rejected: the model already has lying rules, deflection rules, and crack-point rules; another layer of nervousness instructions would compete with them and is exactly the brittle natural-language-discrimination ground we paid for in ADR-0013 and ADR-0015. Worse, nervousness is a UI signal, not a model behaviour — adding it to the prompt couples them.
2. **Sentiment analysis on each player message.** A second model call ("rate hostility 0–10") gates the nervousness bump. Rejected: cost (extra API call per turn), latency (blocks the streaming response), brittleness (a model rating "tell me about Adrien" as low-hostility would defeat the mechanic), and complexity (now we have two AI surfaces to debug).
3. **Per-suspect keyword list with a fixed increment, frontend-only.** Each suspect declares a list of "nervous-making" keywords and a per-match increment. The store scans player messages and updates a numeric nervousness value. Selected.

For the visual encoding, the candidates were CSS transform jitter, an SVG/canvas distortion shader, or a live transform-driven jitter via `requestAnimationFrame`. The CSS transform option wins on cost (zero JS per frame), accessibility (one media query and one toggle disable it), and simplicity (a keyframe + a CSS variable for intensity). The shader version is the more visually impressive option but is wildly out of scope for a single weekend feature.

The accessibility surface is non-negotiable: jitter is a motion effect, and a fraction of users have vestibular sensitivities. `prefers-reduced-motion` must be honoured, and an explicit toggle must exist for users without the system setting who still find the effect distracting. Both are in scope; this ADR records why both are required, not just one.

## Decision

### Mechanic shape

`Suspect` gains one optional field:

```ts
nervousnessTriggers?: {
  keywords: string[];   // case-insensitive substrings
  increment: number;    // 0..100, added per match, capped at 100
}
```

If absent, the suspect has no jitter behaviour. Backwards-compatible: existing suspects without the field render exactly as before.

`CaseProgress` gains:

```ts
nervousnessBySuspect: Record<string, number>;  // suspectId -> 0..100
```

Two store actions drive the state:

- `bumpNervousness(suspectId, message)` — case-insensitive substring scan against `keywords`; sum `increment` per match; cap at 100.
- `decayNervousness(suspectId)` — multiply current value by `0.8`, floor at 0.

After each player message: if the active suspect has `nervousnessTriggers` and any keyword matched, call `bumpNervousness`; otherwise call `decayNervousness`. The mechanic is **frontend-only** — no API or model changes, no prompt changes, no extra inference call.

### Per-suspect calibration

Three suspects, three increments — calibrated to character:

- **Marcus** — innocent witness, mild lying about presence. Increment `15`. Keywords: `['key', 'gallery', '21:30', '22:00', 'car', 'Civic']`.
- **Henry** — actual murderer, double-fact crack. Increment `25`. Keywords: `['Adrien', 'plagiarism', 'shirt', 'garage', 'blood', 'bronze', 'statuette', 'Telegraph editor']`.
- **Diana** — cool professional with bank-record exposure. Increment `10`. Keywords: `['Iris', 'bank', 'transfer', 'five hundred', 'espionage']`.

Different increments encode different stakes — Henry's reaction is the loudest, Diana's the most controlled. Marcus sits in the middle: lying about location, not about murder. Numbers may need tuning in QA per Task 8 / spec §9.3; the relationships (Henry > Marcus > Diana) are the committed part.

### Visual encoding

CSS transform jitter via keyframes, parameterised by a `--jitter-intensity` CSS custom property. Progressive reveal across four bands of the 0–100 nervousness range:

- **0–20:** no class applied, no animation
- **20–50:** `--jitter-intensity: 0.5` (sub-pixel, barely visible)
- **50–80:** `--jitter-intensity: 1.0` (subtle but noticeable)
- **80–100:** `--jitter-intensity: 1.5` (clearly nervous)

A `<JitteringText>` wrapper component reads the active suspect's nervousness from the store and applies the matching class to its child text. Applied only to **streaming assistant messages** — never to player messages, never to static UI. Skip button (a UI element, not transcript) sits outside the jitter wrapper.

### Accessibility

Both:

1. **`prefers-reduced-motion: reduce`** — a media query in `globals.css` sets `animation: none` on the `.jitter-*` classes. Users with system-level motion preferences get a fully static experience automatically.
2. **Explicit toggle** — "Reduce Motion: Off / On" on the Briefing screen, persisted in `localStorage` under `the-ai-interrogation:reduceMotion:enabled`. When On, applies a `.reduce-motion` class to `<html>` (or `<body>`) that overrides the same `.jitter-*` classes with `animation: none !important`. This serves users who don't have the system setting but still find the effect distracting.

Both paths are required because the system preference is only set on a fraction of devices that need it; the UI toggle is the user-facing escape hatch when the system pref isn't.

The Reduce Motion toggle disables jitter only — the modal scale-in animation (Motion library, ADR-0016) stays enabled even when Reduce Motion is on. Rationale: scale-in is a punctuation-tier animation tied to a single user-initiated action (clicking Accuse), not an ambient effect, and disabling it leaves the modal popping in suddenly with no acknowledgement of the transition. If user feedback shows this is wrong, a future revision can extend the toggle's scope.

### Decay rate

`0.8` per non-trigger player message. Examples:

- Marcus at 60 nervousness, three generic questions in a row → 60 → 48 → 38.4 → 30.7 (still in 20–50 band — calming visibly)
- Marcus at 60, five generic questions → ~19.7 (below 20-band threshold — fresh slate)

The decay rate is calibrated to feel like "the suspect calms down after a string of unrelated questions, but the topic still warms memory." Tunable in QA: too slow (jitter persists too long) → try `0.7`; too fast (player can't see the warmth) → try `0.85`. The 0.8 starting point is a round-number compromise that should at least feel right by ear.

## Consequences

- **The jitter is the W4 signature feature.** It is the one thing in this weekend that no other detective game has, and the demo / video story for the weekend leans heavily on showing a Henry-cracking exchange where jitter visibly intensifies as the player closes in.
- **Per-suspect keyword lists are content, not code.** Tuning a suspect's reactivity is editing a TypeScript object literal — no compositor or composer changes. New cases in future weekends can ship their own calibrations without touching the mechanic.
- **The mechanic is data-driven and decoupled from the prompt.** Unlike the crack-point rules (which the model has to follow), nervousness lives in the frontend and the store. A model regression cannot break it; a content edit to keywords cannot leak to the model.
- **`prefers-reduced-motion` and the explicit toggle are both load-bearing.** Removing either is an accessibility regression. The CSS implementation makes both straightforward (one media query + one class override) — there is no excuse for shipping only one.
- **Jitter on streaming text is a pure CSS effect; the JS cost is one substring scan per player message.** No `requestAnimationFrame`, no per-frame work. The keyword scan is O(keywords × messageLength), with at most ~10 keywords per suspect — negligible.
- **The Reduce Motion toggle's narrow scope is a deliberate choice.** A future ADR may broaden it (e.g. to also disable modal animation, or to a tri-state Off/Reduced/Off-everything). That decision should be driven by user feedback, not pre-emptive engineering.
- **False-positive matches are possible** (e.g. "I have no idea who Iris is" matching `'Iris'` for Diana). The substring-scan design accepts this: keyword choice is a content responsibility, and Task 8 QA has a hook to adjust keywords if mid-conversation false positives emerge.
- **Storage carries one new field.** `nervousnessBySuspect` is persisted alongside conversation state, so refresh mid-interrogation preserves the current nervousness for each suspect. Combined with ADR-0016's `:v2` bump, no migration is needed.

## Rationale

A signature feature has to be cheap to build, hard to copy in spirit, and accessible by default. Keyword-driven nervousness with CSS transform jitter hits all three: cheap because everything is data + CSS, hard to copy because the magic is in per-suspect keyword choice (a content-design problem, not an engineering one), accessible because the motion is a single CSS class that two independent paths can disable.

The keyword-list encoding deliberately keeps the model out of it. ADR-0013 and ADR-0015 spent the weekend's prompt-engineering budget proving that natural-language rules for delicate model discrimination are fragile; nervousness is a UI signal and belongs entirely on the frontend, where its behaviour is deterministic, testable, and observable. If we ever need richer triggers (regex, phrase combinations, temporal patterns) the type can extend; the current shape is the smallest thing that delivers the feel.

The progressive reveal — four bands from "no jitter" to "clearly nervous" — gives the player a continuous-feeling signal rendered with discrete CSS classes. A truly continuous CSS transform via inline style would also work, but the band structure makes the QA loop clearer ("is the 50–80 band visible enough? is the 80–100 band too aggressive?") and makes the per-suspect calibration legible (Marcus rarely passes 50; Henry can hit 80; Diana stays under 30).

The dual accessibility path is the version that respects both system-level preferences and individual choice. A user with vestibular issues but no system setting still gets a clean off-switch. A user with the system setting gets the right behaviour by default. Both cost almost nothing to implement, and shipping only one is the avoidable mistake.
