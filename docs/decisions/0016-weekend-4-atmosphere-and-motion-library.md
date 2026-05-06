# ADR-0016: Weekend 4 Atmosphere Features and Motion Library Admission

**Status:** Accepted
**Date:** 2026-05-06
**Partially supersedes:** ADR-0011 (CSS-only interactions clause only)

## Context

Mini-Polish (ADR-0011) closed the visual foundation: warm-dark noir palette, three-role typography, dark-only, and an explicit deferral of `motion/react` to keep the polish weekend inside its time-box. Weekend 3 then completed the interrogation puzzle with three AI-driven suspects, the double-fact crack mechanic, and the SSR projection fix. The game now looks like a noir game and plays like a detective puzzle — but it does not yet *feel* like one.

Weekend 4 is the atmosphere weekend. The full wishlist had eleven candidate features (screen transitions, music on briefing, button click sounds, response chimes, loading skeletons, mobile-specific polish, empty states, etc.). All but five are deliberately rejected as scope-creep risk for a single ~5–6 hour session — the trap being "this one wouldn't take long" which compounds across eleven items into a maximalist weekend that ships none of them well.

The five chosen features are picked for impact-to-effort ratio against the gap between "professional prototype" and "thing you want to show people on YouTube":

1. **Char-by-char typewriter** for streamed assistant messages, decoupled from token arrival speed (Disco Elysium pacing — ~45ms/char), with a Skip button per message.
2. **SVG noise grain overlay** — a single fixed-position element with an inline `feTurbulence` data URL, `mix-blend-mode: overlay`, ~6% opacity, behind everything.
3. **Modal scale-in animation** for the accusation modal — initial scale 0.85 → 1.0 over 400ms with `cubic-bezier(0.16, 1, 0.3, 1)` plus 4px backdrop blur over 300ms.
4. **Ambient sound** (rain ~40% + room tone ~20%) on Investigation only, with explicit enable on Briefing and a `localStorage`-persisted toggle. Browsers block auto-play; the gesture is the toggle.
5. **Text jitter mechanic** — per-suspect nervousness state driven by player keywords, rendered as a CSS transform jitter on streaming assistant text, with `prefers-reduced-motion` and an explicit toggle. Documented separately in ADR-0017.

Two of these (modal animation, possibly future screen polish) need a real animation library. CSS keyframes can do the typewriter and the jitter; they cannot do scale-in with `AnimatePresence`-style enter/exit lifecycle integration cleanly. ADR-0011's "CSS-only interactions, no Motion library yet" clause is therefore the binding constraint we have to relax — narrowly, not wholesale.

A second decision has to land in the same ADR because it cascades across every task: the persisted store schema gains two new fields (`AssistantMessage.displayedContent` for typewriter, `CaseProgress.nervousnessBySuspect` for jitter). This is a migration moment. Pre-release, we do not need to preserve player saves.

## Decision

### The five W4 features ship; the other six are out of scope

The five features listed in `docs/specs/weekend-4-atmosphere.md` §2.1 are in scope: typewriter, grain, modal animation, ambient audio, text jitter. The six rejected candidates listed in §2.2 (screen transitions, button click sounds, response chimes, music on briefing, mobile-specific polish, loading skeletons, additional empty states) are not. If something rejected in §2.2 starts feeling like "wouldn't take long" mid-execution, it goes into §14 (Open questions) for Weekend 5 consideration — it does not get smuggled into a fix-PR.

### `motion/react` is admitted to dependencies, narrowly

`pnpm add motion` is authorised in Task 6 of the weekend-4 spec. The library's allowed scope this weekend is **the accusation modal animation only** (scale-in entry, scale-out exit, animated backdrop blur). All other W4 motion work — the typewriter render-tick, the grain overlay, the text jitter — stays CSS / `requestAnimationFrame` / data-driven. Hover, focus, active, and selected states across the rest of the app continue to use Tailwind transitions per ADR-0011.

ADR-0011's "CSS-only interactions, no Motion library yet" clause is therefore **partially superseded by this ADR**. ADR-0011's noir palette, three-role typography, and dark-only commitments are unaffected — those remain binding. Future weekends that want to use Motion outside the modal must extend or supersede this ADR with the new use-case explicitly named, not just import the library because it's already in the lockfile.

### Storage version bumps to `:v2` with no migration logic

`STORAGE_KEY` becomes `the-ai-interrogation:game:v2` (was `:v1`). The `persist` middleware version goes `1 → 2`. The `migrate` callback drops any `:v1` data and returns clean state — no field-by-field migration. Pre-release with no real users is exactly the moment for a clean slate; carrying migration code we'll delete before launch is busywork. This matches the Weekend 2 §4.5 policy of "schema bumps are silent drops in pre-release."

### Manual visual / sensory QA is part of Definition of Done

Five atmospheric features are a single emergent feel, not five independent additions. Task 8 in the spec is a dedicated manual QA pass against §9.3 — typewriter pacing, grain visibility, modal feel, audio mix, jitter banding, cross-feature interaction. Subjective polish issues that surface there are resolved either by a `fix/<short>` PR or recorded in `docs/journal/weekend-4.md` for Weekend 5+ — they are not silently dropped.

## Consequences

- **`motion/react` enters the dependency graph this weekend.** Bundle cost is real (~50KB gzip today) but the library tree-shakes well and we use only `motion`, `AnimatePresence`, and `motion.div`. Acceptable on the same desktop-web target the rest of the project ships on.
- **The modal animation is the one allowed Motion site for now.** Any reviewer who sees `motion/react` imported from `src/features/**` outside `accusation-modal/` should flag it; a new ADR is required to expand the scope. This rule is not lint-enforced — the type system can't see it. Convention only.
- **CSS-only stays the default elsewhere.** Hover states, focus rings, tab transitions, color swaps — Tailwind transitions over ~150ms with `ease-in-out` per ADR-0011. The typewriter and the jitter in this weekend are CSS / RAF, not Motion, on purpose: keep the budget down and keep the "Motion is exceptional" rule readable.
- **The `:v2` bump is a one-way door for any in-flight `:v1` saves.** A maintainer who had a Weekend 3 session in progress in their browser will lose that session on first load after this lands. Acceptable: the only `:v1` saves are dev-machine sessions, not real-user data.
- **The five-feature list is the contract.** §2.2's rejected items don't sneak back in — if one of them turns out to be load-bearing for "feel," that's a Weekend 5 decision, not a Weekend 4 fix-PR.
- **A future ADR may further extend Motion's scope.** Screen transitions between Briefing / Investigation / Outcome were rejected for W4 but are a plausible W5 candidate; if pursued, that ADR will reference this one rather than re-litigate ADR-0011 from scratch.

## Rationale

ADR-0011 deferred Motion deliberately to keep the Mini-Polish weekend inside its budget, with the explicit understanding that "JS-driven animation work — screen transitions, grain texture, jitter, char-by-char typewriter — is Weekend 4's territory." This ADR is the cash-out: we are in Weekend 4, and the budget for animation is genuinely available.

The narrow admission ("modal only") matters more than the headline ("Motion is in"). A blanket admission would re-open the question of whether every interaction should be Motion-driven, which is a much larger scope discussion than a one-weekend atmosphere pass should host. Keeping the rule narrow lets us ship the one site that actually needs Motion (enter/exit lifecycle for the accusation modal) without inviting a wave of "while we're here, let me also animate the suspect tabs."

The storage bump is pragmatic. We have no real users; the atomic schema change is cleaner than carrying migration logic for state shapes that have churned every weekend so far. The right time to start preserving saves is at v1.0 release, not at the third schema iteration of a hobby project.

The five-feature list is restraint as design. The eleven-item wishlist would not produce a weekend-shippable atmosphere; it would produce eleven half-finished features. Picking five that compound (typewriter pacing + audio + grain + jitter all reinforce each other; modal animation is the punctuation) is the version where the whole feels different, not just the parts.
