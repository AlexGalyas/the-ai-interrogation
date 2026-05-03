# Weekend 3 — Journal

> Running log for the Weekend 3 build (real case: Henry as the murderer, Marcus reassigned to innocent witness, Diana added as third vector). Filled in across the weekend; not a retrospective written after the fact.

## What I built

- Step 1 — Spec + ADR-0012 (case canon update) + ADR-0013 (double-fact crack mechanic) + journal stub. Spec lives at `docs/specs/weekend-3-real-case.md`. No code changes in this step — Step 2 onward touches `case-01-soho-gallery.ts` and the Playwright happy-path.
- Step 2 — Case canon swap and Marcus rewrite. `case-01-soho-gallery.ts`: replaced the Weekend 2 premise with the final three-paragraph briefing from spec §3.5 (Helena Voss + Honda Civic + charcoal Italian shirt fibers + Iris's $500 transfers), flipped `solution` from provisional Marcus (`['car','gallery','21:30']`) to canonical Henry (`['Henry','Adrien','shirt']` + new explanation per spec §3.6), and rewrote Marcus's `publicAlibi` / `hiddenTruth` / `lyingRules` / `crackPoint` / `personality` per spec §4.1 — same `id`/`name`, new role as innocent witness who fled the scene. `case.suspects` still contains only Marcus; Henry and Diana arrive in Steps 3 and 4. The Marcus crack point now explicitly instructs "DO NOT confess to killing her, because you did not." — load-bearing for the misdirect mechanic. ADR-0009's superseded marker (added in Step 1) is now actually load-bearing because the canonical solution is in code.
- Step 3 — Henry Whitfield added as a `Suspect` object in `case-01-soho-gallery.ts`, verbatim from spec §4.2. `case.suspects` is now `[marcus, henry]` — Marcus first by design intent (player meets the misdirect first). Henry is the actual murderer per `case.solution.murdererId = 'henry'`, so the case is now winnable through the UI for the first time in Weekend 3. The double-fact `crackPoint.triggerHint` was preserved with the explicit "Fact A / Fact B / If only A — deflect / If only B — deflect / If BOTH — confess" structure, encoded as natural-language English per ADR-0013. File stayed single-file (~160 lines, well under spec §5.3's split threshold). E2E happy-path stays `test.skip`'d — re-enabled in Step 5 after Diana lands.


## What was hard

- Step 2 leaves the case canon temporarily inconsistent: `solution.murdererId` is `'henry'` but `case.suspects` only contains Marcus. The `Case` type doesn't enforce that the murderer ID resolves to a real suspect (it's just a string), so this typechecks fine — but the game is intentionally unwinnable through the UI until Step 3 adds Henry. Documented inline in `case-01-soho-gallery.ts` next to the new `solution` block. Resolves in Step 3.
- `tests/unit/evaluate-accusation.test.ts` had eight tests hard-coded against the old `['car','gallery','21:30']` keywords; rewrote each to use Henry/Adrien/shirt with realistic accusation text, kept the test count and shape identical. `tests/unit/build-suspect-prompt.test.ts` reads Marcus's fields dynamically from `caseSohoGallery.suspects[0]`, so it kept passing without edits even though the asserted strings now point at the new content. `tests/e2e/happy-path.spec.ts` was marked `test.skip` with a comment pointing at Step 5 — Playwright reports `1 skipped` and the suite stays green.
- Step 3 — interactive smoke test in this PR was structural only. A user-owned `next dev` was already running on port 3000 (PID 96281), and Turbopack's lockfile prevented preview-tooling from spawning a parallel server. Rather than kill the user's process, I verified the change against the running server via HTTP probes: briefing premise text renders (Honda Civic / charcoal Italian / bronze statuette / Iris transfers), both `Marcus Reeve` and `Henry Whitfield` render with their oneLiners ("struggling painter" / "art critic at The Telegraph"), and the `Begin investigation` CTA is visible. The interactive checks called out in Step 3 (tab switching, InitialAvatar colors, jailbreak resistance, single-vs-double-fact crack discrimination) were NOT executed in this PR — those rely on real Anthropic streaming and a browser session. Per spec §7 Step 6, full prompt-engineering QA is the dedicated next step; the architecture here is correct and only the prompt phrasing might need tuning.
- Pre-existing leak (NOT introduced by this PR, flagging for follow-up): `src/app/page.tsx` passes the full `caseSohoGallery` object to `GameRoot` as a prop, which serializes every suspect's `hiddenTruth`, `lyingRules`, and `crackPoint.triggerHint` into the client HTML. Curl on `http://localhost:3000/` returns `Adrien`, `bloodstained`, `garage`, `plagiarism`, `side entrance` etc. — the player can read the whole confession by viewing page source. This existed for Marcus before; Henry just makes it more visible because the murderer's secrets are now also exposed. Out of scope for Step 3 (content-only); needs an architectural fix (server-side prompt composition only, or a `PublicSuspect` shape for client).


## Interesting moments worth showing on video

- First time the cast feels real — two avatars in tabs (Marcus and Henry), two characters with different voices: Marcus the self-deprecating fast-talker vs Henry the anxious overexplainer. Even though Diana isn't in yet, the contrast between Marcus and Henry is the new visible moment in Step 3 that the demo can lean on.

## Mistakes / things I'd do differently

-

## Spec deviations

-

---

Total time: TBD.

After this PR merges, the maintainer will tag the commit on `main` as `weekend-3`.
