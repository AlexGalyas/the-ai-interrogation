# Weekend 3 — Journal

> Running log for the Weekend 3 build (real case: Henry as the murderer, Marcus reassigned to innocent witness, Diana added as third vector). Filled in across the weekend; not a retrospective written after the fact.

## What I built

- Step 1 — Spec + ADR-0012 (case canon update) + ADR-0013 (double-fact crack mechanic) + journal stub. Spec lives at `docs/specs/weekend-3-real-case.md`. No code changes in this step — Step 2 onward touches `case-01-soho-gallery.ts` and the Playwright happy-path.
- Step 2 — Case canon swap and Marcus rewrite. `case-01-soho-gallery.ts`: replaced the Weekend 2 premise with the final three-paragraph briefing from spec §3.5 (Helena Voss + Honda Civic + charcoal Italian shirt fibers + Iris's $500 transfers), flipped `solution` from provisional Marcus (`['car','gallery','21:30']`) to canonical Henry (`['Henry','Adrien','shirt']` + new explanation per spec §3.6), and rewrote Marcus's `publicAlibi` / `hiddenTruth` / `lyingRules` / `crackPoint` / `personality` per spec §4.1 — same `id`/`name`, new role as innocent witness who fled the scene. `case.suspects` still contains only Marcus; Henry and Diana arrive in Steps 3 and 4. The Marcus crack point now explicitly instructs "DO NOT confess to killing her, because you did not." — load-bearing for the misdirect mechanic. ADR-0009's superseded marker (added in Step 1) is now actually load-bearing because the canonical solution is in code.
-

## What was hard

- Step 2 leaves the case canon temporarily inconsistent: `solution.murdererId` is `'henry'` but `case.suspects` only contains Marcus. The `Case` type doesn't enforce that the murderer ID resolves to a real suspect (it's just a string), so this typechecks fine — but the game is intentionally unwinnable through the UI until Step 3 adds Henry. Documented inline in `case-01-soho-gallery.ts` next to the new `solution` block. Resolves in Step 3.
- `tests/unit/evaluate-accusation.test.ts` had eight tests hard-coded against the old `['car','gallery','21:30']` keywords; rewrote each to use Henry/Adrien/shirt with realistic accusation text, kept the test count and shape identical. `tests/unit/build-suspect-prompt.test.ts` reads Marcus's fields dynamically from `caseSohoGallery.suspects[0]`, so it kept passing without edits even though the asserted strings now point at the new content. `tests/e2e/happy-path.spec.ts` was marked `test.skip` with a comment pointing at Step 5 — Playwright reports `1 skipped` and the suite stays green.
-

## Interesting moments worth showing on video

-

## Mistakes / things I'd do differently

-

## Spec deviations

-

---

Total time: TBD.

After this PR merges, the maintainer will tag the commit on `main` as `weekend-3`.
