# Weekend 2 — Game Loop

> **Spec status:** Draft (pre-implementation)
> **Time budget:** ~5–5.5 hours
> **Goal:** Turn the standalone interrogation prototype into a complete, replayable game loop: briefing → interrogate → accuse → win/lose → play again. With full state persistence.

---

## 1. Context

Weekend 1 proved that the core mechanic works (Marcus stays in character, breaks on the crack-point fact). This weekend turns that mechanic into a game by adding the structural pieces around it: a briefing screen, an accusation flow, win/lose outcomes, and persistence so a refresh does not destroy progress.

We do **not** add new suspects this weekend. The architecture must support three suspects (Weekend 3's job), but only Marcus is implemented. Critically, **Marcus is provisionally the murderer for Weekend 2 only** — Weekend 3 will reassign the murder to Helena's lover and demote Marcus to "guilty conscience but innocent of the murder." This is captured in ADR-0009 below.

By the end of this weekend, a stranger should be able to open `localhost:3000`, read the briefing, interrogate Marcus, accuse him with adequate evidence, and see the Win screen. Refresh at any point should restore them exactly where they were.

---

## 2. Scope

### 2.1 In scope

- Domain types extended: `CaseSolution`, updated `Case`, `Accusation`.
- `case-01-soho-gallery` updated with a `solution` block. Marcus is provisional murderer (see ADR-0009).
- Pure function `evaluateAccusation(case, accusation): AccusationResult` under `src/lib/game/evaluate-accusation.ts` with a Vitest test suite.
- Zustand store rewritten to a per-case progress structure (`progressByCase: Record<string, CaseProgress>`) with `persist` middleware backed by `localStorage`.
- Three new screens / states managed by client-side routing inside the existing single page (no separate Next routes — see §5.4):
  1. **Briefing** — case title, premise, suspect cards, Begin button.
  2. **Investigation** — the existing chat UI, restructured into a tabbed top bar (one tab in Weekend 2, architecture supports up to three).
  3. **Accusation modal** — pick a suspect, write a free-form evidence quote, submit.
  4. **Outcome screen** — Win or Lose variant (no truth reveal on Lose, by player choice).
- "New investigation" button on Win/Lose that resets the current case's progress and returns to Briefing.
- One Playwright E2E test covering the happy path with the Anthropic API mocked at the network layer.
- Four new ADRs: persistence policy, per-case state shape, provisional murderer, lose-screen no-reveal.
- Spec file (this document) committed under `docs/specs/weekend-2-game-loop.md`.
- New journal file at `docs/journal/weekend-2.md`, kept up to date through the weekend.

### 2.2 Out of scope (deferred)

- ❌ Suspects other than Marcus — Weekend 3
- ❌ Real murderer reassignment to Helena's lover — Weekend 3
- ❌ Truth reveal on Lose screen — explicitly removed by player decision
- ❌ AI-driven accusation validation (LLM-as-judge) — outside MVP
- ❌ Pin / highlight messages as evidence — Weekend 4
- ❌ Case selection screen — Weekend 5
- ❌ Second case content — Weekend 5
- ❌ Anti-cheese minimum-question gating — outside MVP
- ❌ Tutorial overlay, onboarding — Weekend 4
- ❌ Animations, sound, noir aesthetic — Weekend 4

If something on this list seems necessary mid-weekend, add it to §10 (Open Questions) instead of expanding scope.

---

## 3. Game flow

```
              ┌─────────────┐
              │  Briefing   │ ← entry point if no progress for this case
              └──────┬──────┘
                     │ Begin investigation
                     ▼
              ┌─────────────┐
   refresh ─→ │Investigation│ ←─── back from accusation modal (cancel)
              └──────┬──────┘
                     │ Accuse button
                     ▼
              ┌─────────────┐
              │  Accusation │
              │    modal    │
              └──────┬──────┘
                     │ Submit
                     ▼
              ┌─────────────┐
              │   Outcome   │ ← refresh restores you here if accusation was made
              │  (Win/Lose) │
              └──────┬──────┘
                     │ New investigation
                     ▼
                 (reset, back to Briefing)
```

The current screen is a function of `progressByCase[currentCaseId]` state, not a route. URL stays at `/` throughout — see §5.4.

---

## 4. Functional requirements

### 4.1 Briefing screen

Shown when there is **no progress** for the current case (`messages` is empty AND no accusation submitted).

Layout:
- Page title: case title (e.g., "The Gallery Closing")
- Premise text (1–2 paragraphs from `case.premise`)
- Section "Suspects" with one card per suspect: avatar placeholder, name, one-liner. In Weekend 2 there is one card.
- Help line, always shown: *"Question suspects. Find contradictions. Accuse the murderer with evidence."*
- Button: **Begin investigation** → transitions to Investigation.

### 4.2 Investigation screen

This is the existing Weekend 1 UI, restructured.

Layout:
- **Tabbed top bar** — one tab per suspect. Each tab shows the suspect's name. The active tab also shows the suspect's one-liner under the name. In Weekend 2 there is one tab; the component must render correctly with up to three.
- **Chat area** — same as Weekend 1, but now scoped to the active suspect. Each suspect has its own conversation history; switching tabs shows the other suspect's history.
- **Input row** — same as Weekend 1.
- **Accuse button** — visible at all times in a fixed position (e.g., top-right or floating bottom-right). Available from the very first interaction, no minimum question count (per W2.1.2).

Tab-switching behaviour (per W2.2.5):
- Switching tabs while a stream is in progress: the stream **continues in the background**. The store keeps appending tokens to the now-inactive suspect's message. When the player switches back, they see the completed (or still-streaming) response.
- The store therefore tracks `isStreaming` **per suspect**, not globally.

### 4.3 Accusation modal

Triggered by the Accuse button. Renders as a modal over the Investigation screen (uses `Dialog` from shadcn/ui).

Contents:
- Heading: "Make your accusation"
- Suspect picker: a list of selectable suspect names. In Weekend 2, only Marcus.
- Textarea: free-form evidence quote. Placeholder: *"What evidence convinces you it was them?"*
- Two buttons: **Cancel** (closes modal, returns to Investigation) and **Submit accusation** (proceeds to evaluation).

Validation:
- Submit is disabled until both a suspect is selected and the evidence textarea has at least 10 non-whitespace characters.

On submit:
- Call the pure function `evaluateAccusation(case, accusation)`.
- Persist the accusation and the result into `progressByCase[currentCaseId].accusation`.
- Transition to Outcome.

### 4.4 Outcome screen

Two variants based on `progressByCase[currentCaseId].accusation.result.isCorrect`.

**Win:**
- Heading: "Case closed."
- One-line subhead: *"You found the murderer."*
- Stat: total questions asked across all suspects (`questionsAsked`).
- Button: **New investigation** (resets case progress, returns to Briefing).

**Lose:**
- Heading: "Case unsolved."
- One-line subhead: *"Your accusation didn't hold up."*
- **No reveal** of who the actual murderer was. (This is intentional — see ADR-0010.)
- Button: **New investigation** (resets case progress, returns to Briefing).

Refresh on the Outcome screen restores the same Outcome screen.

### 4.5 Persistence

Per W2.2.1 + W2.2.2: persist **everything** about per-case progress.

Stored in `localStorage` under key `the-ai-interrogation:game:v1`.

Persisted shape:
```ts
{
  currentCaseId: string;                     // 'case-01-soho-gallery'
  progressByCase: Record<string, {
    messagesBySuspect: Record<string, Message[]>;   // suspectId → conversation
    isStreamingBySuspect: Record<string, boolean>;  // ephemeral, but persisted is OK
    activeSuspectId: string;
    accusation: {
      suspectId: string;
      evidence: string;
      result: { isCorrect: boolean; matchedEvidence: string[]; missingEvidence: string[] };
      submittedAt: string;     // ISO timestamp
    } | null;
  }>;
}
```

Migration policy: if the persisted shape doesn't match the current schema, drop it silently. Bump the storage key version (`:v1` → `:v2`) on any breaking schema change.

### 4.6 Error handling

All Weekend 1 error rules continue to apply (per Weekend 1 spec §4.4). New cases:

| Situation | Behaviour |
|---|---|
| `evaluateAccusation` throws (malformed case data) | Show a system-level error in the Accusation modal: "Something went wrong. Please refresh and try again." Don't transition. |
| Persisted state fails to parse | Log to console, drop the persisted blob, start fresh. |
| Tab switched mid-stream, then refreshed mid-stream | Streaming state is lost on refresh — the partial assistant message is kept as-is in history (no `(connection lost)` marker, since the stream wasn't really alive). Player can ask a new question. |

---

## 5. Technical design

### 5.1 Domain types — additions to `src/lib/game/types.ts`

```ts
export interface CaseSolution {
  /** Suspect ID of the actual murderer. */
  murdererId: string;
  /**
   * Substrings (case-insensitive) that the player's evidence quote MUST contain
   * for the accusation to count as correct. Order does not matter. ALL must match.
   */
  requiredEvidence: string[];
  /**
   * 1–2 paragraph explanation of how the case was actually solved.
   * Currently unused (no truth reveal on Lose), but stored for future use.
   */
  explanation: string;
}

export interface Case {
  id: string;
  title: string;
  premise: string;
  suspects: Suspect[];
  solution: CaseSolution;     // NEW — required
}

export interface Accusation {
  suspectId: string;
  evidence: string;
}

export interface AccusationResult {
  isCorrect: boolean;
  /** Required evidence substrings that were found in the player's evidence. */
  matchedEvidence: string[];
  /** Required evidence substrings that were NOT found. */
  missingEvidence: string[];
}
```

### 5.2 `case-01-soho-gallery` updates

Add to the existing case file:

```ts
solution: {
  murdererId: 'marcus',  // PROVISIONAL — see ADR-0009. Changes to 'henry' in Weekend 3.
  requiredEvidence: ['car', 'gallery', '21:30'],   // case-insensitive substring match
  explanation:
    "Marcus drove to the gallery on Tuesday after Helena told him she was dropping him. " +
    "Their argument turned violent. He left around 21:35, panicked rather than calling " +
    "the police. The witness placing his car near the gallery at 21:30 was the loose thread.",
},
```

The `requiredEvidence` substrings are deliberately the same facts that constitute Marcus's crack point — so a player who actually cracked him will naturally have the language to write a winning accusation.

### 5.3 `evaluateAccusation` — `src/lib/game/evaluate-accusation.ts`

Pure function:

```ts
export function evaluateAccusation(kase: Case, accusation: Accusation): AccusationResult;
```

Algorithm:
1. If `accusation.suspectId !== kase.solution.murdererId` → `isCorrect: false`, return with `matchedEvidence: []`, `missingEvidence: kase.solution.requiredEvidence`.
2. Otherwise, lowercase both `accusation.evidence` and each `requiredEvidence` entry. For each required substring, check if it appears in the lowercased evidence text.
3. `isCorrect` is true **only if** the accused suspect is the murderer **and** all required evidence substrings are present.
4. `matchedEvidence` and `missingEvidence` always reflect the required-evidence check, regardless of who was accused.

JSDoc as per AGENTS.md §4.6.

### 5.4 No new Next routes — single-page state machine

We deliberately stay on `/` for all four screens. Reasons:
- Simpler persistence (URL doesn't need to be in sync with state)
- No router boilerplate for what is, structurally, a small state machine
- Refresh-equals-restore behaviour matches §4.5 trivially

The current screen is derived from store state:

```ts
function deriveScreen(progress: CaseProgress): 'briefing' | 'investigation' | 'outcome' {
  if (progress.accusation !== null) return 'outcome';
  const hasAnyMessage = Object.values(progress.messagesBySuspect)
    .some(msgs => msgs.length > 0);
  if (hasAnyMessage) return 'investigation';
  return 'briefing';
}
```

Note: pressing **Begin investigation** in the Briefing transitions to Investigation by setting `activeSuspectId` and (if not already set) initialising empty arrays in `messagesBySuspect`. Even with no messages, the screen is now Investigation because the player has explicitly started. We capture this with an additional flag `hasBegun: boolean` in `CaseProgress` to disambiguate "fresh briefing" from "investigation with zero questions asked":

```ts
interface CaseProgress {
  hasBegun: boolean;
  messagesBySuspect: Record<string, Message[]>;
  isStreamingBySuspect: Record<string, boolean>;
  activeSuspectId: string;
  accusation: PersistedAccusation | null;
}
```

Updated derivation:
```ts
function deriveScreen(progress: CaseProgress): Screen {
  if (progress.accusation !== null) return 'outcome';
  if (progress.hasBegun) return 'investigation';
  return 'briefing';
}
```

### 5.5 Zustand store — `src/stores/game.ts` (rewrite)

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  currentCaseId: string;
  progressByCase: Record<string, CaseProgress>;

  // Selectors
  getCurrentProgress(): CaseProgress;
  getActiveMessages(): Message[];

  // Mutations
  beginInvestigation(caseId: string): void;
  setActiveSuspect(suspectId: string): void;
  appendUserMessage(suspectId: string, content: string): void;
  startAssistantMessage(suspectId: string): string;             // returns message id
  appendToAssistantMessage(suspectId: string, id: string, chunk: string): void;
  finishStreaming(suspectId: string): void;
  submitAccusation(accusation: Accusation, result: AccusationResult): void;
  resetCurrentCase(): void;
}

const STORAGE_KEY = 'the-ai-interrogation:game:v1';
```

Use `persist` middleware with `name: STORAGE_KEY` and a custom `partialize` that excludes ephemeral fields if needed (in our shape, all fields are fine to persist).

The store's actions are **the only place** that touches `progressByCase`. Components and hooks read via selectors.

### 5.6 Hook — `src/features/interrogation/use-interrogate.ts`

Same as Weekend 1, but parameterised by `suspectId`. Each call site owns one suspect's stream. Returned imperatives: `sendQuestion(content: string)`. Internally it dispatches store actions for the right `suspectId`.

### 5.7 Components

```
src/features/
  briefing/
    BriefingScreen.tsx
    SuspectCard.tsx
  interrogation/
    InvestigationScreen.tsx       (re-uses Weekend 1 chat)
    SuspectTabs.tsx               (NEW — tab bar at top, ready for 1–3 tabs)
    AccuseButton.tsx              (floating)
    use-interrogate.ts            (existing, parameterised)
  accusation/
    AccusationModal.tsx
    SuspectPicker.tsx
  outcome/
    OutcomeScreen.tsx             (renders Win or Lose variant)
```

Page (`src/app/page.tsx`):
- Server component.
- Imports the case data.
- Renders a single client component `<GameRoot kase={case01} />` which reads `deriveScreen` from the store and conditionally renders Briefing / Investigation / Outcome. AccusationModal is rendered as a sibling that toggles via local state, not via the screen-derivation logic.

### 5.8 API — no changes required

The `/api/interrogate` endpoint and the handler in `src/api/interrogate/` keep their Weekend 1 contract (request takes `suspectId` + `messages`, returns a stream). The store now invokes it per-suspect, but the API surface is unchanged.

---

## 6. Test plan

### 6.1 Unit tests (Vitest) — required to merge

`tests/unit/evaluate-accusation.test.ts`:

- ✅ Correct suspect + all evidence keywords present → `isCorrect: true`
- ✅ Correct suspect + all evidence present in different casing → `isCorrect: true` (case-insensitive)
- ✅ Correct suspect + missing one keyword → `isCorrect: false`, `missingEvidence` lists the missing keyword
- ✅ Correct suspect + extra unrelated text + all keywords present → `isCorrect: true`
- ✅ Wrong suspect + all keywords present → `isCorrect: false`, `missingEvidence` is the full required list
- ✅ Wrong suspect + no keywords → `isCorrect: false`, `missingEvidence` is the full required list
- ✅ Empty evidence → `isCorrect: false`, `missingEvidence` is the full required list
- ✅ Function is deterministic (call twice with same inputs → same output)

Existing `build-suspect-prompt` tests must still pass.

### 6.2 E2E test (Playwright) — required to merge

`tests/e2e/happy-path.spec.ts`:

1. Navigate to `/`
2. Assert Briefing renders: case title visible, "Begin investigation" button visible
3. Click Begin
4. Assert Investigation renders: Marcus tab visible, input visible
5. Mock `/api/interrogate` (via `page.route()`) to return a fixed streamed response
6. Type a question, submit
7. Wait for the streamed response to fully render
8. Click Accuse button
9. Assert AccusationModal opens
10. Select Marcus
11. Type evidence: `"the witness saw his car at the gallery at 21:30"`
12. Click Submit
13. Assert Outcome screen shows "Case closed." (Win)
14. Click "New investigation"
15. Assert Briefing renders again (case progress reset)

Mock implementation:
```ts
await page.route('**/api/interrogate', async (route) => {
  const body = 'I was at my studio. All evening. Working.';
  // Stream as plain-text chunks of ~10 chars each, delay 20ms between chunks
  // ...
});
```

### 6.3 Manual QA — required before merging

Run against real Anthropic API. Confirm:

1. ✅ Fresh load → Briefing visible.
2. ✅ Begin → Investigation, Marcus tab active, no chat history.
3. ✅ Ask 3 questions across 2–3 attempts at the crack-point fact. Marcus eventually breaks. (This is regression coverage of Weekend 1.)
4. ✅ Refresh in the middle → land back in Investigation with full chat history.
5. ✅ Click Accuse → modal opens. Cancel works.
6. ✅ Submit with missing evidence → Outcome shows Lose, no truth reveal.
7. ✅ "New investigation" → resets to Briefing with empty history.
8. ✅ Begin again → Investigation, fresh history.
9. ✅ Run a full successful playthrough (crack Marcus, accuse with correct evidence) → Outcome shows Win.
10. ✅ Refresh on Win screen → still on Win screen.

---

## 7. Step-by-step plan

| # | Step | Time | Branch / commit |
|---|---|---|---|
| 1 | Domain types + case-01 solution + 4 new ADRs (0007, 0008, 0009, 0010) | 30m | `feat/domain-types-and-solution` → `feat(game): add CaseSolution type and case-01 solution` |
| 2 | Zustand store rewrite with persist + per-case progress | 45m | `feat/per-case-store` → `feat(store): per-case progress with persist middleware` |
| 3 | `evaluateAccusation` + Vitest tests | 30m | `feat/evaluate-accusation` → `feat(game): add evaluateAccusation with tests` |
| 4 | Briefing screen | 45m | `feat/briefing-screen` → `feat(ui): add briefing screen` |
| 5 | Investigation refactor (suspect tabs, accuse button) | 30m | `feat/suspect-tabs` → `feat(ui): refactor investigation with suspect tabs` |
| 6 | Accusation modal | 45m | `feat/accusation-modal` → `feat(ui): add accusation modal` |
| 7 | Outcome screen (Win/Lose, no truth reveal) | 30m | `feat/outcome-screen` → `feat(ui): add outcome screen` |
| 8 | Playwright setup + happy-path E2E with API mock | 45m | `test/happy-path-e2e` → `test(e2e): add happy-path coverage` |
| 9 | Manual QA, journal entries, demo recording for journal, final PR | 30m | `chore/weekend-2-done` → `chore: weekend 2 done` |

Each step is its own PR. CI must be green before merge. Squash-merge into `main`.

If a step balloons, stop and write the slippage into the journal (§9 of AGENTS.md, Definition of Done).

---

## 8. Definition of Done — Weekend 2

Per AGENTS.md §4.7, plus:

- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all pass
- [ ] All scenarios in §6.3 pass manually
- [ ] All steps from §7 are merged into `main`
- [ ] `docs/specs/weekend-2-game-loop.md` updated to reflect any spec deviations
- [ ] `docs/journal/weekend-2.md` filled in across all sections
- [ ] Four new ADRs (0007, 0008, 0009, 0010) committed under `docs/decisions/`
- [ ] Screen recording of the full happy path saved locally (for the YouTube cut later)

---

## 9. Decisions recorded during this spec

These will be promoted to ADR files during Step 1.

- **ADR-0007 — Persist all per-case progress in `localStorage`.** Refresh restoring the player's exact state (including the Outcome screen) is the most natural UX. Schema versioning via the storage-key suffix (`:v1`).
- **ADR-0008 — Per-case progress shape (`progressByCase: Record<caseId, CaseProgress>`).** Adopted now even though only one case exists, so Weekend 5 does not require a store rewrite.
- **ADR-0009 — Marcus is the provisional murderer in Weekend 2.** A real game requires a real win condition. The reassignment to Helena's lover ships in Weekend 3 alongside the new suspects. Risk: a Weekend-2 playthrough recorded for content will show "wrong" canon. Acceptable; not publishing publicly until later.
- **ADR-0010 — Lose screen does not reveal the murderer.** Hides the answer to preserve replay motivation. The `solution.explanation` field is retained in the schema for possible future use (e.g., post-replay debrief, achievements).

---

## 10. Open questions

*(empty at draft time — populated during execution)*
