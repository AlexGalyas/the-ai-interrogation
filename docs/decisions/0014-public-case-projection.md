# ADR-0014: Public vs. Private Case Projection

**Status:** Accepted
**Date:** 2026-05-03

## Context

`Case` and `Suspect` carry both player-facing fields (id, name, oneLiner, premise, title) and answer-key fields that exist only to drive the server-side prompt and the server-side accusation evaluator:

- `Suspect.publicAlibi`, `Suspect.hiddenTruth`, `Suspect.lyingRules`, `Suspect.crackPoint`, `Suspect.personality` — embedded into the system prompt by `buildSuspectPrompt` to shape the model's lying behaviour and crack-point dynamics.
- `Case.solution.murdererId`, `Case.solution.requiredEvidence`, `Case.solution.explanation` — used by `evaluateAccusation` to decide Win vs. Lose.

Until this change, `src/app/page.tsx` rendered `<GameRoot kase={caseSohoGallery} />` and every downstream React component was typed against the full `Case`. Because Next.js serializes the props of client components into the SSR HTML payload, the answer key was visible directly in `view-source:` — `requiredEvidence: ['Henry', 'Adrien', 'shirt']`, Henry's bloodstained shirt and the Iris/Cole tip-off were all shipped to the browser. A player reading the page source could read the solution before asking a single question.

`AccusationModal` also called `evaluateAccusation(kase, accusation)` directly on the client, which both required `kase.solution` to exist on the client and made a server-side enforcement boundary impossible to add later.

The leak is not a styling problem to be patched at the rendering layer. It is a type problem: the client should never be handed types whose fields it has no business reading.

## Decision

Introduce two projected types in `src/lib/game/types.ts`:

```ts
interface PublicSuspect { id: string; name: string; oneLiner: string }
interface PublicCase { id: string; title: string; premise: string; suspects: PublicSuspect[] }
```

These contain only the fields the UI renders. They deliberately exclude `solution` and the prompt-shaping suspect fields.

Add `toPublicCase(case: Case): PublicCase` in `src/lib/game/to-public-case.ts` — a pure function that does the projection. `src/app/page.tsx` calls `toPublicCase(caseSohoGallery)` before passing the value to `<GameRoot />`. All downstream components (`GameRoot`, `BriefingScreen`, `SuspectCard`, `InvestigationScreen`, `SuspectTabs`, `InterrogationRoom`, `SuspectTopBar`, `SuspectPicker`, `OutcomeScreen`, `AccusationModal`) take `PublicCase` / `PublicSuspect` props instead of `Case` / `Suspect`. The Zustand store (`src/stores/game.ts`) likewise narrows its `CASES_BY_ID` map and `lookupCase` / `blankProgress` signatures to `PublicCase`.

Move accusation evaluation server-side. Add a thin `POST /api/accuse` route at `src/app/api/accuse/route.ts` that delegates to `src/api/accuse/handler.ts`, which calls the existing pure `evaluateAccusation` on the server with the full `caseSohoGallery`. The Zod request schema lives in `src/api/accuse/schema.ts` (per ADR-0004 thin route handlers). `AccusationModal` now `fetch`es `/api/accuse` and feeds the JSON `AccusationResult` into `submitAccusation`. `evaluateAccusation` itself is unchanged — it stays pure and stays in `src/lib/game/`, but the only caller is now the server-side handler.

## Consequences

- **The SSR HTML no longer contains the answer key.** `curl -s http://localhost:3000/ | grep -oE 'Adrien|bloodstained|garage|plagiarism|side entrance'` returns no matches after this change. This is the explicit acceptance test for the fix.
- **The full `Case` type and `caseSohoGallery` content module are still imported by client code paths.** The store imports `caseSohoGallery` to derive its default-case id, and `toPublicCase` runs at module init. Tree-shaking does not remove the secret string fields from the bundled JS — a determined player can still read them from the JS bundle. The fix here closes the SSR leak that the `view-source:` of the rendered page exposes; closing the bundle leak fully would require either annotating the case content module with `'server-only'` (and routing case metadata to the client through a separate public-only module) or splitting the case file into public + private halves. Both are larger surgery than this ADR's scope. Recorded as a follow-up.
- **`evaluateAccusation` becomes a server-side concern.** Direct client imports of it are now incorrect by construction — the full `Case` it requires no longer flows through the client. Existing unit tests at `tests/unit/evaluate-accusation.test.ts` continue to call it directly with the full `caseSohoGallery` because they run server-side; no test changes are needed.
- **`PublicSuspect` and `PublicCase` are the only suspect/case types client code should ever reference.** A future reviewer who sees `Case` or `Suspect` imported from `src/features/**` or `src/components/**` should treat that as a regression and either narrow the import or move the consumer server-side. No lint rule enforces this yet; the type system is the only guardrail.
- **`/api/accuse` is now a network call.** The previous client-side eval was synchronous and free; the new path adds a round trip, which is fine for an end-of-game submission but means the modal's submit button now has a real "Submitting…" state with real latency. Error states (network failure, non-200) surface through the existing `console.error` + retry-by-resubmit affordance — no dedicated failure UI is added because accusation submission is a single user-initiated action, not a streamed loop.

## Rationale

The leak was small and the temptation was to patch it locally — strip a few fields from a single prop, ship it, move on. We chose the typed-projection version instead because the underlying mistake (client components typed against `Case`) is structural: any future component added under `src/features/` would be free to read `kase.solution` again. A new type that *cannot* hold the secrets is a guardrail the type checker enforces on every PR; a stripped-prop fix is a guardrail that lasts until the next refactor.

The accusation API endpoint is the same shape: the pure `evaluateAccusation` could have stayed callable from the client if we had passed only `solution` instead of the full `Case`, but that re-introduces the same exposure (the client would then receive `solution.requiredEvidence`). Moving the call server-side and reducing the client's view to `PublicCase` is the version where the secrets simply do not exist on the client side of the wire.

The remaining JS-bundle leak is an honest tradeoff. Within a weekend's budget, the SSR fix gets the headline benefit (no answer key in `view-source:`, no answer key in the first byte the user sees) at the cost of one new ADR, one new helper, one new API route, and a wave of trivial type narrowings. The bundle-level fix would require splitting case content along a server-only seam, which is real surgery and is best done when there are multiple cases and the seam matters for more than secrecy. Recorded here so the follow-up has context, deferred until then.
