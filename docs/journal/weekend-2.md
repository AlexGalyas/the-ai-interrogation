# Weekend 2 — Journal

> Running log for the Weekend 2 build (game loop + persistence). Filled in across the weekend; not a retrospective written after the fact.

## What I built

- Step 4 — Briefing screen + GameRoot wiring. New `src/features/briefing/{briefing-screen,suspect-card}` components and `src/features/game-root/game-root` client component that derives the active screen from store state. `app/page.tsx` is now a thin server component that just renders `<GameRoot kase={case01} />`. Investigation UI is wrapped as-is for now; outcome screen is a placeholder until Step 7.
- Expanded `case-01-soho-gallery.premise` from one meta-flavoured sentence ("Weekend 1 implements only Marcus") to two player-facing paragraphs that set the scene without spoilers, so the briefing has enough copy to read.
- Step 5 — Investigation refactor. New `SuspectTabs` (custom tab bar — controlled, with active tab showing one-liner under the name; built with plain Tailwind because shadcn Tabs wasn't installed and our needs are simple/controlled), `AccuseButton` (floating bottom-right) under `src/features/accusation/`, and `InvestigationScreen` that reads `activeSuspectId` from the store and composes tabs + existing `InterrogationRoom` + accuse button. `GameRoot`'s investigation branch now renders `<InvestigationScreen>`; the accuse callback is a `console.log` placeholder until Step 6 wires the modal.
- Step 6 — Accusation flow. New `AccusationModal` (shadcn Dialog) and `SuspectPicker` under `src/features/accusation/`. The Accuse button now opens the modal; submit calls `evaluateAccusation` and persists the result via `submitAccusation`, after which `deriveScreen` flips to the outcome placeholder. Modal local state (selected suspect + evidence textarea) resets on each open; submit is gated on a chosen suspect plus 10+ non-whitespace evidence chars.
- Step 7 — Outcome screen completes the game loop. New `src/features/outcome/outcome-screen` with Win / Lose variants (no truth reveal on Lose, per ADR-0010) and a "New investigation" button that calls `resetCurrentCase`. Added `getQuestionsAskedCount` selector to `useGameStore` (flattens `messagesBySuspect`, filters role === 'user'). `GameRoot` now renders `<OutcomeScreen>` in place of the placeholder; after reset, `deriveScreen` returns `'briefing'` automatically.
- Step 8 — Playwright happy-path E2E. New `playwright.config.ts` (chromium-only, list reporter, dev-server auto-start) and `tests/e2e/happy-path.spec.ts` covering Briefing → Investigation → streamed reply → Accusation modal → Win → reset. `/api/interrogate` is mocked at the network layer with a fixed text body so the test runs without an Anthropic key.

## What was hard

- Playwright `route.fulfill` doesn't accept a `ReadableStream` body — the type is `string | Buffer` only. Tried casting a custom stream first (per the spec example), then dropped it: a single-string body is delivered to the client as one or two chunks at the TCP layer, and the existing `streamInto` reader handles that identically to a real stream. The happy path doesn't need to assert token-by-token rendering, so the simpler mock is sufficient.

## Interesting moments worth showing on video

- First full playthrough — Briefing → cracked Marcus → correct accusation → Win screen. Worth a screen recording for the YouTube cut later.

## Mistakes / things I'd do differently

- (none of note)

## Spec deviations

- ADR numbering shifted by +1 due to a pre-existing ADR-0006 (component-file-layout) committed during Weekend 1. Spec was patched in this same commit.
- Step 4 expanded `case.premise` inline (per spec §5 contingency in the step-4 brief) since the existing one-liner wasn't long enough for a briefing screen.
- Step 8 added incidental plumbing not described in the spec: `vitest.config.ts` excludes `tests/e2e/**` so Vitest stops trying to load the Playwright spec; `.gitignore` ignores `playwright-report/`, `test-results/`, `playwright/.cache/`; README quick-start documents the one-time `pnpm exec playwright install chromium`. Considered too small to amend §2.1; logging here for traceability.

---

Total time: ~5h

After this PR merges, the maintainer will tag the commit on main as `weekend-2`.
