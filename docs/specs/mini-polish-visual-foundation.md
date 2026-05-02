# Mini-Polish Weekend — Visual Foundation

> **Spec status:** Draft (pre-implementation)
> **Time budget:** ~3–4 hours (lighter than a full weekend)
> **Goal:** Move the game from "admin-panel grey Tailwind" to "noir game with character" — without straying into full Weekend 4 polish (no grain texture, no Motion-driven screen transitions, no sound). Establish a visual foundation that Weekend 4 will extend, not redo.

---

## 1. Context

Weekend 2 closed with a complete game loop, but the visual presentation is unstyled Tailwind defaults. Per the Weekend 2 retro: the maintainer reported flat enthusiasm and "the game looks weak — I want some basic improvements before Weekend 3." This is a real signal — the dopamine of "look at this thing I made" is suppressed when the thing looks like internal tooling.

This weekend addresses that explicitly. It is **not** Weekend 4. We make narrow, high-leverage visual choices: a dark noir palette, three role-typed fonts, CSS-only hover/focus interactions, and six small UX polish items. Anything heavier — grain, screen transitions, sound, char-by-char typewriter, jitter on suspect nervousness — stays on Weekend 4.

By the end of this weekend, opening `localhost:3000` should feel like opening a game, not a CRUD app.

---

## 2. Scope

### 2.1 In scope

- **Theme infrastructure**: dark-only theme; no toggle. Palette wired through Tailwind v4 `@theme` and shadcn CSS variables.
- **Fonts**: three roles wired via `next/font/google` (Crimson Text, Geist Sans, Geist Mono) and exposed as Tailwind utilities (`font-serif`, `font-sans`, `font-mono`).
- **Palette application**: every screen uses the new palette via CSS variables (no hardcoded `bg-slate-900` etc.).
- **Hover/focus states**: CSS-transitions on buttons, tabs, suspect cards, suspect picker rows, accuse button. Smooth, ~150ms ease. *(Delivered: shadcn `Button` ships `transition-all`; `suspect-tabs` and `suspect-picker` got explicit `transition-colors` during Step 4. `suspect-card` on Briefing was left static — the card is not an interactive surface in W2/MP, so a hover transition would have been a state-without-affordance. Logged in §10 as "decide on suspect-card interactivity in W3 when the second/third suspects land.")*
- **Avatars from initials**: in `suspect-card`, `suspect-tabs`, `suspect-picker` — replace the neutral square placeholder with a circular avatar showing initials over a per-suspect deterministic gradient.
- **Empty state in chat**: when active suspect has no messages yet, render muted italic line: *"Ask {suspect.name} your first question…"*.
- **Loading state for accusation submit**: while `evaluateAccusation` runs (synchronous, normally instant), the Submit button switches to a disabled state with a `Submitting…` label. *(Delivered as label-change only — no spinner icon. The "spinner" phrasing in this bullet conflicts with §4.5 which explicitly defers the icon to W4; §4.5 is the binding text. Pattern is in place — `isSubmitting` gates Submit and Cancel — and ready for W5's planned LLM-as-judge accusation validation, where the in-flight state will actually be visible.)*
- **Textarea placeholder rewrite**: "What do you want to ask?" (chat input) and "What evidence convinces you it was them?" (accusation modal — already specced).
- **Briefing visual hierarchy**: premise text as a typographic block with `font-serif`, generous line-height, max-width for readability.
- **Improved typing indicator**: three dots with CSS keyframes (staggered pulse), replacing whatever Weekend 1 shipped.
- **A new ADR** capturing the palette + font + dark-only decision (ADR-0011 if free, otherwise the next available number — see numbering check at Step 1).
- **Spec file** (this document) committed under `docs/specs/mini-polish-visual-foundation.md`.
- **Journal file** at `docs/journal/mini-polish.md`.
- **Updated screen recording** of a Win playthrough showing the new look (for future YouTube cut).

### 2.2 Out of scope (explicitly Weekend 4)

- ❌ Film-grain / noise texture overlay
- ❌ Motion / Framer Motion library — no screen transitions, no animated mount
- ❌ Char-by-char typewriter rendering for streamed text (we keep token-rate from Weekend 1)
- ❌ Text jitter / tremor when suspect "nervous"
- ❌ Sound — ambient, click, response chime, anything audible
- ❌ Music
- ❌ Light mode
- ❌ Theme toggle
- ❌ Animated modal entry (a CSS scale/opacity transition is fine; a Motion-driven physics one is not)
- ❌ Mobile-specific polish beyond "doesn't break on narrow viewports"
- ❌ Custom shadcn variants beyond what palette swap gives us

If something on this list "wouldn't take long" — that's the trap. Add it to §10 (Open questions) and revisit on Weekend 4.

---

## 3. Visual decisions (locked)

### 3.1 Tone

Noir-classic. Warm darkness, brass-and-paper accents, no neons. Reference points: stills from *Chinatown* (1974) and *L.A. Confidential* (1997), interrogation-room scenes specifically.

### 3.2 Palette

All values are HSL or hex; final implementation uses CSS custom properties so shadcn's `bg-background`, `text-foreground`, etc. all resolve correctly.

| Role | Hex | Notes |
|---|---|---|
| Background | `#0F0E0C` | Near-black, warm undertone (NOT pure `#000`) |
| Surface (cards, modal, popover) | `#1A1816` | One step lighter than background |
| Border | `#2B2724` | Subtle, never shouty |
| Text primary | `#E8DFCF` | Cream, like aged paper |
| Text muted | `#9A8E7A` | Warm tan-grey for secondary copy |
| Accent (primary) | `#C19A4F` | Brass / dim-lamp gold |
| Accent foreground | `#0F0E0C` | Background color, used on accent buttons |
| Destructive | `#A94442` | Restrained red — error states only, not "Lose" headlines |
| Ring (focus) | `#C19A4F` (50% opacity) | Same as accent, for keyboard focus rings |

The palette is **not final-final** — Weekend 4 may dial individual values. But the relationships (warm-dark base, single brass accent, restrained red) are committed.

### 3.3 Fonts

Loaded via `next/font/google` for performance and zero-FOUC.

| Role | Font | Weight(s) | Usage |
|---|---|---|---|
| Serif | **Crimson Text** | 400, 600, 700 | Headings, briefing premise, outcome screen titles |
| Sans (UI) | **Geist Sans** | 400, 500, 600 | Buttons, tabs, labels, inputs, generic body |
| Mono | **Geist Mono** | 400, 500 | Suspect chat messages, evidence display, anything "transcript-like" |

Geist Sans and Geist Mono are likely already configured from the shadcn Nova preset — we verify and add Crimson Text alongside.

### 3.4 Spacing and rhythm

- Base font-size: 16px
- Reading-block max-width: `65ch` (briefing premise, outcome subhead)
- Chat message line-height: `1.6` for readability of monospace
- Generous vertical rhythm between sections — `space-y-6` minimum on Briefing and Outcome

No grid system overhaul, no design-token formalization. We use Tailwind utilities directly with the new variables underneath.

### 3.5 Interactions (CSS-only)

- All interactive elements transition `colors`, `border`, `opacity` over 150ms with `ease-in-out`
- Buttons (primary): brass background, dark text, slight darken on hover (`hover:bg-accent/90`)
- Buttons (ghost / cancel): transparent background, muted text, surface-color background on hover
- Tabs: muted text by default, accent text and accent bottom-border when active; transition only on color, not on the indicator (the indicator can swap instantly — feels snappier)
- Suspect picker rows: subtle border, accent ring (`ring-2 ring-accent`) when selected, surface-color background on hover when not selected
- Inputs (textarea): muted border by default, accent border on focus (`focus:border-accent`)

No JS-driven animations. No `motion/react`. Period.

---

## 4. Functional requirements

### 4.1 Theme infrastructure

- `src/app/globals.css` (or wherever shadcn put it) defines CSS variables for both default light and dark in shadcn convention. We replace the dark scheme with our palette, and **drop the light scheme entirely** (or set it identical to dark — shadcn convention is fine either way).
- `<html>` element gets `class="dark"` in the root layout, unconditionally. No theme provider, no toggle, no `next-themes`.
- Tailwind v4 `@theme` block exposes accent/destructive/ring as named utilities (`bg-accent`, `text-accent-foreground`, etc.) consistent with shadcn defaults. Existing shadcn components must keep working without code changes — we're swapping CSS variable values, not renaming utilities.

### 4.2 Font wiring

- In `src/app/layout.tsx`, import Crimson Text via `next/font/google`. Geist Sans and Geist Mono should already be there from shadcn — verify and reuse.
- Each font exposes a CSS variable (`--font-serif`, `--font-sans`, `--font-mono`). The `<body>` gets all three CSS variables in its `className`.
- Tailwind's `@theme` maps `font-serif`, `font-sans`, `font-mono` to those variables.
- The `font-sans` is the body default. `font-serif` and `font-mono` are applied per-component as needed.

### 4.3 Avatars from initials

A small reusable component, `src/components/initial-avatar/initial-avatar.tsx` + `index.ts` per ADR-0006:

- Props: `{ name: string; size?: 'sm' | 'md' | 'lg' }`
- Computes initials from `name` (first letter of first two whitespace-separated tokens, uppercased — "Marcus Reeve" → "MR")
- Computes a deterministic background gradient from the name (simple hash of the string into a hue, then `linear-gradient(135deg, hsl(hue 40% 30%), hsl(hue 30% 18%))`). The 40%/30% saturation and 30%/18% lightness keep the gradient muted and within our palette range (no neon greens).
- Renders a circular div with the gradient background, initials centered in `font-sans font-semibold`, color `text-foreground`.
- Sizes: `sm` = 32×32 (tabs), `md` = 48×48 (briefing cards, picker rows), `lg` = 64×64 (reserved for future use).

Replace the existing initial-square placeholders in `suspect-card`, `suspect-tabs`, and `suspect-picker` with this component.

### 4.4 Empty state in chat

When `messagesBySuspect[activeSuspectId]` is empty in the investigation screen:
- The chat area renders a single muted line, vertically centered in the chat area:
  *"Ask {suspect.name} your first question…"* (with a Unicode ellipsis, not three dots)
- Style: `text-muted-foreground italic font-sans`, centered, no border or surface — just floating text.
- Disappears the moment the first message exists.

### 4.5 Loading state on accusation submit

In the accusation modal:
- Local `isSubmitting` state in the modal component, defaulting to `false`.
- On Submit click: set `isSubmitting = true` → call `evaluateAccusation` → call `submitAccusation` mutation → close modal. The state is short-lived (mostly invisible), but architecturally correct.
- While `isSubmitting`: the Submit button is disabled, its label changes to "Submitting..." (no spinner icon needed in this weekend; that's polish for Weekend 4 if we want it). Cancel button is also disabled to avoid race conditions.
- If anything throws synchronously, set `isSubmitting = false` and surface the error per Weekend 2 §4.6 ("malformed case data" path).

### 4.6 Textarea placeholders

Two textareas to update:
- Chat input (in `investigation-screen` or wherever the input lives): placeholder = `"What do you want to ask?"`
- Accusation modal: placeholder stays `"What evidence convinces you it was them?"` (already specced in Weekend 2 — verify).

### 4.7 Briefing typographic block

In `briefing-screen`:
- Page title: `font-serif text-4xl md:text-5xl font-semibold` — `kase.title`
- Premise text: wrapped in a `<div className="font-serif text-lg leading-relaxed max-w-prose">` block. Paragraphs split on `\n\n`, each rendered in `<p className="mb-4 last:mb-0">`.
- Section heading "Suspects": `font-sans text-sm uppercase tracking-wider text-muted-foreground` — small, modest, label-style.
- Help line: `font-sans text-sm text-muted-foreground italic` — beneath the suspect cards.
- Begin button: shadcn primary `Button`, full-width on mobile, fixed-width (`min-w-[240px]`) on desktop. Centered.

### 4.8 Improved typing indicator

Three dots, staggered pulse animation, pure CSS:

```css
@keyframes dot-pulse {
  0%, 60%, 100% { opacity: 0.2; }
  30% { opacity: 1; }
}
```

Each dot has the same animation, with `animation-delay` of `0ms`, `150ms`, `300ms` respectively. Animation duration `1.4s`, infinite, ease-in-out.

Dot color: `bg-muted-foreground`, size 6×6px, rounded-full, gap of 4px between.

The typing indicator replaces whatever Weekend 1 shipped — find it (likely in the chat-message component or a `typing-indicator` component) and update.

---

## 5. Technical design

### 5.1 File-level changes (per ADR-0006 folder+barrel structure)

| File | Action |
|---|---|
| `src/app/globals.css` | Replace dark CSS variables with the new palette; remove or normalize light variant |
| `src/app/layout.tsx` | Add Crimson Text via `next/font/google`; add `class="dark"` to `<html>`; expose three font CSS vars on `<body>` |
| `tailwind.config.ts` (or `@theme` block) | Map `font-serif`, `font-sans`, `font-mono` to the CSS vars |
| `src/components/initial-avatar/initial-avatar.tsx` (NEW) | The avatar component |
| `src/components/initial-avatar/index.ts` (NEW) | Barrel |
| `src/components/typing-indicator/typing-indicator.tsx` (NEW or replace existing) | Animated dots |
| `src/components/typing-indicator/index.ts` (NEW) | Barrel |
| `src/features/briefing/suspect-card/suspect-card.tsx` | Use `<InitialAvatar>` |
| `src/features/interrogation/suspect-tabs/suspect-tabs.tsx` | Use `<InitialAvatar size="sm">` |
| `src/features/accusation/suspect-picker/suspect-picker.tsx` | Use `<InitialAvatar>` |
| `src/features/briefing/briefing-screen/briefing-screen.tsx` | Apply typographic block per §4.7 |
| `src/features/interrogation/investigation-screen/investigation-screen.tsx` (or wherever the chat empty state belongs) | Render empty state per §4.4; update placeholder per §4.6 |
| `src/features/accusation/accusation-modal/accusation-modal.tsx` | Add `isSubmitting` state per §4.5 |
| Whatever component renders chat messages | Apply `font-mono` to assistant message bodies, keep `font-sans` for player messages |

The chat-message styling split is deliberate: monospace for the suspect creates a "transcript" feel; the player's own questions stay in sans for contrast.

### 5.2 ADR

A new ADR captures the visual decisions. Number: **next available** — at draft time the highest is ADR-0010, so this would be ADR-0011 unless something else landed. Step 1 of the implementation plan re-checks before writing.

ADR title: `0011-noir-palette-and-typography.md` (adjust number if needed).

Content covers: tone choice (noir-classic over modern-minimal or cyberpunk), dark-only commitment, three-role typography, palette values with rationale (warm darkness > cold black; brass > saturated gold; restrained red > horror red).

### 5.3 No game logic changes

Nothing in `src/lib/game/` is touched. `evaluateAccusation`, `buildSuspectPrompt`, types — all unchanged. Pure visual layer + a new defensive loading state in the accusation modal.

### 5.4 No new tests

Visual changes don't get unit tests. The existing `evaluate-accusation` and `build-suspect-prompt` Vitest suites must still pass. The Playwright happy-path E2E from Weekend 2 must still pass — the locators are role-based, so palette and font changes shouldn't break it. **If E2E breaks, that's a regression to fix, not an accepted side effect.**

---

## 6. Test plan

### 6.1 Existing tests must still pass

- `pnpm typecheck` — passes
- `pnpm lint` — passes
- `pnpm test` — Vitest unit tests pass (no new tests in this weekend)
- `pnpm test:e2e` — Playwright happy-path passes unchanged

### 6.2 Manual visual QA

Run `pnpm dev` after all changes. Walk through:

1. **Landing on Briefing**: page is dark with warm undertone, title in serif, premise reads as a typographic block, Marcus card has a circular gradient avatar with "MR" initials, help line is subtle italic.
2. **Begin investigation**: smooth color transition on button hover. Click. Investigation renders.
3. **Empty chat**: muted italic line "Ask Marcus Reeve your first question…" centered in chat area.
4. **Type a question, send**: typing indicator is three pulsing dots, not whatever the old static dots were. Response streams; suspect text is monospace, player message is sans.
5. **Tabs (only Marcus exists)**: active tab has accent color and bottom border, smooth color transition; avatar in the tab is a small circular gradient.
6. **Click Accuse**: modal opens. Suspect picker row has Marcus's avatar. Selecting it shows accent ring. Submit button is brass, disabled until evidence is typed.
7. **Submit accusation**: button text briefly says "Submitting..." (will be near-invisible since evaluateAccusation is sync — that's fine). Outcome screen renders.
8. **Outcome (both Win and Lose)**: heading in serif, button in brass, layout centered, palette consistent.
9. **Refresh on Outcome**: still on Outcome, palette intact (no flash of unstyled content — Tailwind v4 + next/font handle this).
10. **Mobile (DevTools 375px width)**: layouts don't break, text remains readable, no horizontal overflow.

If a bug is found, fix it in this same PR if it's visual (e.g., spacing, missing transition); fix it in a separate `fix/*` PR if it's a regression in game logic or test failure.

### 6.3 Updated screen recording

Re-record the Win playthrough now that the game looks different. The Weekend 2 recording is replaced — the old "ugly grey" footage is no longer the canonical reference. Save as before, outside the repo.

---

## 7. Step-by-step plan (~3.5 hours, ±buffer)

| # | Step | Time | Branch / commit |
|---|---|---|---|
| 1 | ADR + spec commit + journal stub. Verify next ADR number, write `0011-noir-palette-and-typography.md`, commit this spec, create empty journal | 20m | `docs/mini-polish-spec` → `docs: add mini-polish spec and ADR-0011` |
| 2 | Theme: replace globals.css palette, lock `class="dark"` in layout, drop light variant | 30m | `feat/dark-noir-theme` → `feat(theme): switch to noir palette and dark-only` |
| 3 | Fonts: wire Crimson Text, expose vars, map Tailwind utilities, apply `font-serif` and `font-mono` where specced | 30m | `feat/typography` → `feat(theme): add crimson text and role-typed typography` |
| 4 | InitialAvatar component + replace placeholders in suspect-card, suspect-tabs, suspect-picker | 30m | `feat/initial-avatar` → `feat(ui): add initial-avatar component and use in suspect surfaces` |
| 5 | Empty chat state + textarea placeholder + improved typing indicator | 30m | `feat/chat-polish` → `feat(ui): empty state, placeholder, animated typing indicator` |
| 6 | Briefing typographic block | 20m | `feat/briefing-typography` → `feat(ui): apply typographic block to briefing` |
| 7 | Accusation submit loading state | 15m | `feat/accusation-submit-loading` → `feat(ui): add loading state to accusation submit` |
| 8 | Manual QA per §6.2; record new Win playthrough; fill in journal; final PR | 30m | `chore/mini-polish-done` → `chore: mini-polish weekend done` |

Each step is its own PR, squash-merged. CI green required.

If a step balloons (say, Step 2 takes 60 minutes because shadcn variables don't cooperate), STOP and journal it. Don't push past the time budget.

---

## 8. Definition of Done — Mini-Polish weekend

Per AGENTS.md §4.7, plus:

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all pass
- [x] All scenarios in §6.2 pass manually
- [x] All steps from §7 are merged into `main` (Steps 1–7 merged via PRs #15–#22; Step 8 lands with this PR)
- [x] `docs/specs/mini-polish-visual-foundation.md` updated to reflect any spec deviations (this Step 8 commit — see §2.1 annotations and §10)
- [x] `docs/journal/mini-polish.md` filled in across all sections
- [x] ADR-0011 committed under `docs/decisions/0011-noir-palette-and-typography.md` (only ADR added this weekend)
- [ ] New screen recording of Win playthrough saved locally (replaces Weekend 2 ugly grey footage) — *manual deliverable, the maintainer records after this PR merges*
- [ ] Tag `mini-polish` pushed to GitHub after the final PR merges — *manual, post-merge*

---

## 9. Decisions recorded

Promoted to ADR-0011 in Step 1. **No additional ADRs were created during execution** — the font-loading approach (renaming `--font-geist-*` → `--font-sans` / `--font-mono`) was a bug fix to existing wiring, not a new architectural decision.

- **Tone is noir-classic** over modern-minimal or cyberpunk. Maintains atmosphere of the genre and gives Weekend 4 a coherent base to extend.
- **Dark-only, no toggle.** A game has a single intended look. Light mode would dilute atmosphere and add scope.
- **Three role-typed fonts** (serif headings, sans UI, mono suspect transcript). Visual division reinforces the "interrogation transcript" framing.
- **CSS-only interactions, no Motion library yet.** Polish under-budget; full animation work owns Weekend 4.

---

## 10. Open questions

- **Suspect-card hover state on Briefing.** Step 4 added avatars but left `suspect-card` non-interactive (no hover, no click target). With one suspect this is fine. When Henry and the third suspect land in W3, decide whether the card should be a click target ("read full bio") or stay decorative — adding a hover transition without a navigation target would be a state-without-affordance.
- **Out-of-scope items that didn't sneak in.** Verified §2.2 was respected: no film grain, no Motion library, no typewriter, no jitter, no sound, no music, no light mode, no theme toggle, no Motion-driven modal physics. The Mini-Polish weekend stayed inside its budget.
- **Visible loading state for the accusation Submit button.** The `isSubmitting` label flip currently never paints because `evaluateAccusation` is synchronous and React batches the open/close in the same flush. W5's LLM-as-judge accusation validation will make this visible naturally — no proactive change needed in W4.
