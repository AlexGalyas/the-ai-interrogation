# Weekend 4 — Journal

> Running log for the Weekend 4 build (atmosphere: typewriter, grain, modal animation, ambient audio, text jitter). Filled in across the weekend; not a retrospective written after the fact.

## What I built

- Task 1 — Weekend 4 spec, ADRs, and journal stub. Spec lives at `docs/specs/weekend-4-atmosphere.md` (the contract for the five-feature atmosphere pass: typewriter, grain, modal animation, ambient audio, text jitter). Promoted spec §13's two recorded decisions to full ADRs: ADR-0016 (atmosphere + Motion library admission, narrowly scoped to the accusation modal) and ADR-0017 (text jitter via per-suspect `nervousnessTriggers`, frontend-only, with `prefers-reduced-motion` + explicit toggle). ADR-0011 status header rewritten in place to record the partial supersession — the CSS-only clause is the only thing relaxed; noir palette / typography / dark-only stay binding. Journal stub created with the five-section template. No code or runtime behaviour touched; `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` all green.
- Task 2 — Storage migration + state extensions. `Suspect` gains optional `nervousnessTriggers` (`{ keywords; increment }`); `Message` gains uniform `displayedContent: string` (mirrors `content` for user messages; starts at `''` for assistant messages and grows via `tick`); `CaseProgress` gains `nervousnessBySuspect: Record<string, number>`. Storage key bumps to `the-ai-interrogation:game:v2` with `persist` version `1 → 2` and a clean-slate `migrate` callback (any `:v1` data is dropped on first hydration, per ADR-0016). Five new store actions land: `tick`, `skipTypewriter`, `bumpNervousness`, `decayNervousness`, and `getNervousness` selector. `appendUserMessage` is wired so that when the active suspect has `nervousnessTriggers` it bumps on any keyword match and decays otherwise — frontend-only, no API/model changes. Pure helpers extracted to `src/lib/game/nervousness.ts` (`applyNervousnessBump`, `applyNervousnessDecay`, `countNervousnessMatches`) so the keyword-scan and decay logic can be unit-tested without booting the store and without prematurely committing keywords to actual suspects (Task 5's job). 26 new unit tests added (`tests/unit/nervousness.test.ts`, `tests/unit/typewriter.test.ts`); all 71 unit tests + the E2E happy-path stay green. No UI rendering touched — typewriter render and jitter visuals are Task 3 / Task 5.

## What was hard

- (stub — populated as tasks close per spec §11)

## Interesting moments worth showing on video

- (stub — populated as tasks close per spec §11)

## Mistakes / things I'd do differently

- (stub — populated as tasks close per spec §11)

## Spec deviations

- (stub — populated as tasks close per spec §11)
