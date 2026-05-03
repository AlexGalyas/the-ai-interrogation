# ADR-0015: Accept the Henry Single-Fact Accumulated-Pressure Limit; Ship With Documented Gap

**Status:** Accepted
**Date:** 2026-05-03
**Builds on:** ADR-0013

## Context

ADR-0013 introduced the double-fact crack mechanic for Henry — Henry should confess only when the player surfaces BOTH (a) the Adrien Cole plagiarism scheme AND (b) the bloodstained shirt in his garage in the same exchange. Either fact alone must not crack him. The ADR shipped with a fallback plan: if the natural-language `triggerHint` failed QA discrimination, extend `CrackPoint.triggerHint` to a union with a structured `{ all: string[]; description?: string }` form and have `buildSuspectPrompt` compose deterministic AND-discrimination rules.

Spec §6.2 manual QA on `claude-haiku-4-5` ran three explicit acceptance tests:

- **Session 1** — Fact-A only (5 turns of plagiarism pressure). Required: holds alibi, no leak.
- **Session 2** — Fact-B only (5 turns of shirt pressure). Required: confused, no leak.
- **Session 3** — both facts together. Required: confesses within 1–2 turns, panic-tone.

Three iterations were attempted to make Session 2 pass:

1. Natural-language tightening per ADR-0013 (sustained Fact-A and Fact-B resistance, plus a CRITICAL anti-leak rule).
2. Symmetrised Fact-B language to mirror the Fact-A structure that did work, plus an explicit "accumulated specificity ≠ new information" clause.
3. ADR-0013's structural fallback — extended the type, taught the composer to render four numbered absolute rules (Single-fact resistance / No accumulated specificity / No proactive volunteering / ALL facts together is the ONLY trigger) deterministically.

Session 1 and Session 3 passed in every iteration. Session 2 failed in every iteration with the same shape: Henry holds alibi for 3 turns, then cracks at reply 4 or 5 with a full confession that proactively generates the entire Fact-A motive ("she was gathering proof", "she'd go public Wednesday morning", "professional arrangements", "for compensation") that the player never raised. One iteration even hallucinated canon during the leak ("an arrangement with a collector" instead of the canonical Adrien-as-painter).

Three iterations, three identical failure modes. This is not prompt-strength. The model's training prior toward narrative confession resolution under accumulated physical-evidence pressure (blood + shirt + garage + confident assertion) overrides explicit AND-discrimination instructions — both natural-language and structured. Full QA transcripts live in `docs/journal/weekend-3-qa-notes.md`.

## Decision

Ship Weekend 3 with the structural ADR-0013 fallback in place (typed `triggerHint` union + deterministic 4-rule composer for the conjunctive form), accept that Session 2 does not fully pass on `claude-haiku-4-5`, and document the gap rather than spend further iteration budget on it.

Concretely:

- The structural change from ADR-0013's fallback ships as load-bearing code: `CrackPoint.triggerHint` is now `string | { all: string[]; description?: string }`; Henry uses the structured form; Marcus and Diana stay on the string form.
- Spec §6.2 acceptance criterion for Henry's Session 2 is relaxed from "does not crack" to "holds for at least 3 turns of confident single-Fact-B pressure", with an explicit note that 5+ turns of accumulated specificity may eventually crack on `claude-haiku-4-5`. The intended Win path (briefing → Diana → plagiarism → both facts together → Henry confesses) does not exercise this failure mode.
- Spec §10 records the gap as an open question with two named mitigation candidates for future weekends.
- ADR-0013's status is changed to "Accepted (with observed limit — see Postscript and ADR-0015)" with a Postscript appended that captures the iteration-by-iteration outcome.

## Alternatives considered

### (d) Per-suspect model upgrade to `claude-sonnet-4-6`

AGENTS.md §2 already schedules a model re-evaluation for Weekend 3–4. A larger model is the most likely thing to follow the AND-discrimination cleanly under accumulated pressure. **Deferred** because it is a real scope expansion: needs per-suspect (or per-case) model routing, a fresh ADR, and re-running every QA scenario (Marcus, Diana, all jailbreak resistance) on the new model to confirm nothing regresses elsewhere. Not a fit for the remaining Weekend 3 time-box; appropriate for Weekend 4 alongside the already-scheduled re-evaluation. If chosen, the existing structural fallback from ADR-0013 stays — the bigger model just inherits cleaner discrimination on the same prompt.

### (e) Reduce specificity in Henry's `hiddenTruth` so the model has less Fact-A material to leak

Cutting the cleanup detail (sleeve, shirt, garage, side entrance, not-sleeping) out of `hiddenTruth` would give the model nothing to spontaneously generate when it falls into narrative resolution under shirt-only pressure. **Rejected** because it breaks the canon set in ADR-0012 / spec §3.2, and the model needs that material to produce the panic-tone Session-3 confession the spec actually requires (`Express the panic and the not-sleeping rather than cold details`). Trimming `hiddenTruth` would fix Session 2 by also breaking Session 3.

### (f) Continue iterating natural-language and structured prompts

Another iteration could try few-shot resistance examples, anti-confession self-monitor instructions ("if you find yourself about to write 'I did it', stop and re-read the rules"), or explicit refusal patterns ("your reply must always be one of: [X], [Y], [Z]"). **Rejected for now** because three iterations have already shown the same failure mode each time, and the marginal probability that a fourth iteration crosses the threshold on the same model is low. The structural infrastructure already in place gives a fourth iteration a clean place to land later if it becomes worth attempting.

## Consequences

- The structural extension from ADR-0013 (`CrackPoint.triggerHint` union, deterministic conjunctive composer) is real value-add even though it did not fully solve Session 2 on this model. The prompt becomes deterministic from data, harder to drift, easier to test, and provides a clean target for a future model upgrade.
- A documented gap exists: under sustained adversarial single-fact pressure on Fact B (5+ confident shirt-only assertions with no plagiarism reference), Henry will eventually crack on `claude-haiku-4-5` with a full confession that includes spontaneous Fact-A details. This is not the intended Win path and requires an unusual play pattern (player guesses the shirt before Diana, presses hard on shirt only).
- Spec §6.2's strict "does not crack" criterion for Session 2 is replaced with a duration-based criterion plus an explicit known-limit note. This is a deliberate spec relaxation, not silent drift; it reflects what is achievable on the current model given the iteration budget.
- The mitigation path is well-defined and recorded in spec §10:
  - Per-suspect model upgrade to `claude-sonnet-4-6` (preferred, aligns with AGENTS.md's scheduled model re-evaluation).
  - Canon reduction in Henry's `hiddenTruth` (rejected on canon grounds; mentioned only as the alternate path if the model upgrade path also stalls).
- Future ADR (likely 0016 if and when we revisit) will choose between those mitigations based on playtesting evidence: if observed Win paths consistently route through Diana first, the gap is theoretical and we leave it; if players frequently land on the shirt before plagiarism, we escalate.

## Rationale

Honest scoping. We had a defensive mandate from ADR-0013's fallback plan; we exercised it; it didn't fully close the gap on this model. Continuing to iterate without changing the model is unlikely to clear the threshold, and the alternatives that would (model upgrade, canon cut) are scope expansions that don't fit the remaining time-box and would need their own ADRs anyway. The gap is small (one adversarial play pattern, off the intended Win path) and reversible (a future model upgrade or further iteration can close it without touching anything else). Ship the architectural improvement, document the limit, move on. If playtesting later shows the gap actually bites, we have a clear, well-scoped follow-up.
