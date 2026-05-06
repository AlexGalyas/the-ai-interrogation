# ADR-0011: Noir Palette, Three-Role Typography, Dark-Only

**Status:** Accepted; partially superseded by ADR-0016 (CSS-only interactions clause only — Motion library admitted for the accusation modal animation in Weekend 4; CSS-only rule remains binding for all non-Weekend-4 components, and the noir palette / three-role typography / dark-only commitments are unaffected)
**Date:** 2026-05-02

## Context

Weekend 2 closed with a complete game loop but unstyled Tailwind defaults — the maintainer described the result as "looking like internal tooling," which suppressed the dopamine of shipping. The Mini-Polish weekend (`docs/specs/mini-polish-visual-foundation.md`) addresses this with a focused visual foundation that Weekend 4 will extend, not redo.

Three visual choices need to be locked before any component or theme work begins, because they cascade into every screen:

1. **Tone.** What kind of game does this look like?
2. **Palette.** What are the actual color values, and how dark is "dark"?
3. **Typography.** One font for everything, or multiple roles?

We considered three tone candidates:

- **Modern-minimal** (Linear / Vercel-style: high-contrast neutral greys, single accent, generous whitespace). Cheap to ship, but generic — the game would read as "another well-built SaaS dashboard," not as a detective game.
- **Cyberpunk** (saturated neons on near-black, glitch effects, RGB shifts). Strong identity, but mismatched: the case is a 1990s Soho gallery murder, not a hacker thriller. It also locks us into VFX work (glow, scanlines) that belongs on Weekend 4 if at all.
- **Noir-classic** (warm darkness, brass-and-paper accents, restrained palette, serif headings). Matches the genre, leaves room for atmosphere without forcing animation, and gives Weekend 4 a coherent base to extend (grain, vignette, sound) rather than a pivot.

We also weighed dark-only versus a light/dark toggle. A toggle adds scope (theme provider, persisted preference, every component verified in both modes) and dilutes atmosphere — a noir interrogation room is not a thing one views in light mode. Games typically have a single intended look; the dark-only commitment matches that.

For typography, a single sans-serif across the whole app is the path of least resistance, but the game has three distinct content roles that benefit from being visually distinguishable: narrative copy (briefing premise, outcome titles), UI controls (buttons, tabs, labels), and suspect dialogue (which we want to read as a "transcript"). A single font collapses these into one register.

## Decision

### Tone: noir-classic

The game's visual identity is noir-classic — warm darkness, brass and aged-paper accents, no neons, no high-saturation. Reference points: stills from *Chinatown* (1974) and *L.A. Confidential* (1997), interrogation-room scenes specifically. This decision constrains everything downstream: palette, accent choices, future texture work (grain over scanlines), and any Motion-driven polish in Weekend 4.

### Dark-only, no toggle

`<html>` carries `class="dark"` unconditionally in the root layout. There is no theme provider, no `next-themes`, no light variant. The shadcn light scheme is dropped (or set identical to dark — convention is fine either way). A single intended look matches the game's atmosphere and removes a per-component verification axis.

### Palette

| Role | Hex | Rationale |
|---|---|---|
| Background | `#0F0E0C` | **Warm darkness, not cold black.** Pure `#000` reads as void or terminal; `#0F0E0C` reads as a dim room. The R/G/B skew toward warm matches the brass accent and aged-paper foreground. |
| Surface | `#1A1816` | One step lighter than background — enough lift for cards and modals to register as objects without bright-on-dark contrast. |
| Border | `#2B2724` | Subtle, never shouty. Borders on dark are most often *too* visible; we err toward muted. |
| Text primary | `#E8DFCF` | Cream, like aged paper. Avoids the high-contrast `#FFF` on `#000` look that reads as "phone OLED" rather than "noir film." |
| Text muted | `#9A8E7A` | Warm tan-grey for secondary copy. Matches the cream foreground in hue, drops in luminance. |
| Accent (primary) | `#C19A4F` | **Brass / dim-lamp gold, not saturated gold.** A saturated `#FFD700`-style gold reads as treasure-chest or trophy; brass at this saturation reads as period-appropriate metal — door handles, lamp fittings, evidence plate frames. The single-accent commitment matters: every interactive affordance and every "this is selected / focused / important" cue uses this one hue. |
| Accent foreground | `#0F0E0C` | Background color, used on accent buttons so brass-on-dark reverses cleanly to dark-on-brass. |
| Destructive | `#A94442` | **Restrained red, not horror red.** A bright `#FF0000`-style red would scream emergency; we want "error state in a desk lamp's reach." Used only for error messaging — not for the Lose headline (that's serif text in the regular foreground, per ADR-0010's "no truth reveal" tone). |
| Ring (focus) | `#C19A4F` at 50% opacity | Same as accent. Keyboard focus uses the brass hue at half strength so it reads as "highlighted" without competing with hover or selected states. |

The relationships are committed (warm-dark base, single brass accent, restrained red); individual values may dial during Weekend 4. Implementation goes through CSS custom properties so shadcn's `bg-background`, `text-foreground`, `bg-accent`, etc. resolve correctly without component changes.

### Typography: three roles

Three fonts loaded via `next/font/google`, each bound to a CSS custom property and a Tailwind utility. The choice is deliberate: visual division reinforces the "interrogation transcript" framing.

| Role | Font | Tailwind utility | Where |
|---|---|---|---|
| Serif | **Crimson Text** (400 / 600 / 700) | `font-serif` | Headings, briefing premise, outcome screen titles. Period-appropriate, readable at body size, pairs cleanly with sans/mono. |
| Sans (UI) | **Geist Sans** (400 / 500 / 600) | `font-sans` (default) | Buttons, tabs, labels, inputs, generic body. Already configured from the shadcn Nova preset; we reuse it. |
| Mono | **Geist Mono** (400 / 500) | `font-mono` | Suspect chat messages, evidence display, anything "transcript-like." The mono register makes assistant output read as recorded testimony rather than chat-app text. Player questions stay in `font-sans` for contrast. |

Geist Sans is the body default. Serif and mono are applied per-component as the spec calls out.

### CSS-only interactions, no Motion library yet

All hover, focus, active, and selected states use Tailwind/CSS transitions over ~150ms with `ease-in-out`. `motion/react` is not introduced this weekend. JS-driven animation work — screen transitions, grain texture, jitter, char-by-char typewriter — is Weekend 4's territory and would inflate the polish-only weekend's scope past its 3–4 hour budget.

## Consequences

- Every screen rendered in Mini-Polish onward must use the new CSS variables. Hardcoded `bg-slate-900` / `text-white` / `bg-amber-500` etc. are regressions to find and remove during palette application.
- Weekend 4 inherits a coherent base: it can layer grain, vignette, modal physics, and sound on top of these decisions. It does not need to re-litigate tone, palette family, or typography roles.
- The noir-classic tone forecloses some directions cheaply: no neon glows, no glitch text, no saturated accent shifts on hover. If a future case demands a different register (e.g., a daylight-set case), we'd revisit this ADR rather than smuggle in a counter-aesthetic.
- The dark-only commitment means no light mode work in any future weekend unless this ADR is superseded. Any "could you also support light mode?" request is a scope conversation, not a styling tweak.
- Three roles means one extra font (Crimson Text) loaded at the document level. `next/font` self-hosts and inlines the CSS, so the runtime cost is negligible and there is no FOUC.
- The palette values are not final-final — Weekend 4 may dial individual values. The relationships (warm-dark base, single brass accent, restrained red) are the committed part of this decision, and any change to *those* requires a superseding ADR.

## Rationale

Tone, palette, and typography are decisions that compound: every component built on top of them inherits the choice, and changing any one of them later means revisiting every screen. Locking them now — before any theme or component work in the Mini-Polish steps — keeps the rest of the weekend mechanical (apply variables, swap utilities) rather than exploratory (re-pick colors mid-step).

Picking noir-classic specifically is the choice that does the most for the least cost: the genre alignment carries atmosphere on its own, the warm-dark / brass / cream palette is small enough to verify by eye, and the three-role typography decision is the single highest-leverage thing we can do to make the game read as "transcript" rather than "chat UI." The CSS-only deferral keeps Mini-Polish at its budget and gives Weekend 4 a clean canvas to add motion to, instead of motion to argue with.
