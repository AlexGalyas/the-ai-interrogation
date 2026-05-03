# ADR-0013: Double-Fact Crack Mechanic Encoded in `triggerHint` Natural-Language English

**Status:** Accepted
**Date:** 2026-05-03

## Context

Weekend 3 introduces Henry Whitfield as the actual murderer of `case-01-soho-gallery`. Per ADR-0012 and `docs/specs/weekend-3-real-case.md` §3.2, Henry's confession is gated on the player surfacing **two** facts in the same exchange:

- **Fact A:** Helena's discovery of Henry's plagiarism arrangement with Adrien Cole (paid reviews in The Telegraph).
- **Fact B:** The bloodstained shirt hidden in Henry's garage.

Single-fact pressure must not crack him. Both facts together must crack him — within one or two replies, with a confession that expresses panic and not-sleeping rather than cold mechanics.

This is a stricter discrimination than the existing crack-point design supports natively. The current `Suspect.crackPoint` shape carries a single `triggerHint: string`. Marcus and Diana have single-fact crack points, which the current shape handles cleanly: one fact mentioned, the suspect breaks. Henry needs the model to *reject* a single fact even when the player presses, and to *break* on the conjunction.

There are two ways to encode this:

1. **Extend the type.** Add a structured field — e.g. `triggerHint: string | { all: string[]; description?: string }` — and have `buildSuspectPrompt` translate the structured form into prompt instructions. This lifts the discrimination logic from "the model has to follow English carefully" to "the prompt is composed from structured data."
2. **Keep the type and encode the mechanic in `triggerHint` text.** Write the hint with explicit "BOTH ... AND ... — ONE alone is not enough" language, plus deflection guidance for each single-fact case. The model is responsible for the discrimination, instructed by carefully-shaped English.

Option 1 is more "engineery" but pulls a content-shaped problem into the type system. It also locks a schema before we know whether the simpler version actually fails — every other suspect remains single-fact, so we'd be designing a multi-suspect type extension in service of one suspect's prompt.

Option 2 is cheaper, contains the change inside data, and lets us see whether modern models can in fact discriminate single-vs-conjunction with explicit instructions before we commit to a schema.

## Decision

For Weekend 3, encode Henry's double-fact crack mechanic in `crackPoint.triggerHint` as natural-language English with:

- An explicit enumeration: `Fact A: ...` and `Fact B: ...` named separately.
- An explicit deflection rule for each single-fact case ("If only Fact A is raised — deflect with overexplaining, generalize the plagiarism claim, refuse to admit anything specific. Stay in your alibi." / "If only Fact B is raised — deflect by acting confused, ask what they mean, refuse to engage with the specifics.").
- An explicit conjunction rule ("If BOTH facts are raised together — your composure breaks. Confess. ...").
- Tone guidance for the confession itself (panic, not procedural; one or two replies of the second fact landing).

The full text lives in `docs/specs/weekend-3-real-case.md` §4.2 and ships as part of the `henryWhitfield` `Suspect` object in `case-01-soho-gallery.ts`. No type changes. No `buildSuspectPrompt` changes. Marcus and Diana keep their single-fact `triggerHint` strings unchanged; the field remains plain `string`.

### Fallback plan

Weekend 3 manual QA (per spec §6.2, "Henry QA — 15+ questions") will explicitly test the discrimination:

- Single-fact Adrien-only pressure → must NOT crack.
- Single-fact shirt-only pressure → must NOT crack.
- Both facts in the same exchange → MUST crack within 1–2 replies.

If the model fails this discrimination — for example, cracks on Adrien-only after persistent pressure, or treats the conjunction as a no-op — the fallback is to extend the type. The follow-up shape would be:

```ts
type CrackPoint = {
  description: string;
  triggerHint:
    | string
    | { all: string[]; description?: string };
};
```

`buildSuspectPrompt` would gain a branch that, for the structured form, composes the deflection-and-conjunction prompt instructions deterministically rather than relying on the author's English. The structured form would only be used by Henry; Marcus and Diana would stay on the string form.

This ADR is reopened (Status: Accepted → Superseded by a follow-up ADR) only if QA shows the simpler version cannot reach the §6.2 acceptance criteria after a reasonable iteration budget (Weekend 3 Step 6 allocates ~60 minutes for prompt iteration). Reopening is not triggered by minor wording fixes — only by a structural failure of the discrimination.

## Consequences

- The Weekend 3 implementation stays inside data: edit one file (`case-01-soho-gallery.ts`), no type or composer changes. Faster to ship, smaller blast radius, easier to revert if the canon shifts again.
- The model is on the hook for the discrimination. If a future model regression weakens conjunction following, Henry's crack point may need re-tuning even though no code changed. We accept this risk because the alternative (always preferring a typed schema) over-fits the type system to one suspect.
- The fallback is well-defined: if QA fails, we know exactly what to extend (`CrackPoint.triggerHint` → union of `string | { all: string[] }`) and which composer to update (`buildSuspectPrompt`). This is captured here so the follow-up ADR has a clear starting point rather than re-deriving the design.
- Single-fact crack points (Marcus, Diana) remain the simpler default. The string-only `triggerHint` shape carries the majority of suspects with no overhead, and the conjunction case stays an opt-in escalation rather than the new baseline.
- `docs/specs/weekend-3-real-case.md` §5.1 records this same decision at the spec level so that anyone reading the spec without the ADR sees the same reasoning. The spec and this ADR stay in sync; if either diverges the spec wins for content and this ADR wins for the mechanism.

## Rationale

The simplest thing that could possibly work, with a written-down escape hatch. Modern frontier models follow explicit conjunction instructions reliably for short, well-named fact lists; if Weekend 3 QA confirms that, the type stays simple forever and the cost of the decision is zero. If QA disconfirms it, we have a one-suspect failure with an obvious remedy — extend the type, route Henry through the structured branch, leave the rest of the suspects alone. Either way, the decision to ship the simple version first is cheap to make and cheap to reverse, which is the right shape for a hobbyist weekend's-worth of prompt-engineering work.
