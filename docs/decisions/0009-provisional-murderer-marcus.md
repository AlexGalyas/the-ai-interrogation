# ADR-0009: Marcus Is the Provisional Murderer in Weekend 2

**Status:** Accepted (provisional — superseded in Weekend 3)
**Date:** 2026-04-30

## Context

Weekend 2's deliverable is a complete game loop: Briefing → Investigation → Accusation → Win/Lose. A complete loop requires a real win condition, which means `case-01-soho-gallery` needs a `solution.murdererId`.

The intended canon for the case (per the original case design) is that **Helena's lover is the murderer**, and Marcus is a guilty-conscience-but-innocent suspect — he was at the scene, panicked, fled, but did not kill her. However, Helena's lover does not exist as a suspect yet: Weekend 2 ships with only Marcus. Weekend 3 introduces the additional suspects and reassigns the murder.

We have two options for Weekend 2:

1. **Ship the case with no `solution.murdererId`.** The Win path is unreachable. The game loop is structurally incomplete. Defeats the entire point of the weekend.
2. **Provisionally name Marcus as the murderer for Weekend 2 only.** The crack-point fact (his car at the gallery at 21:30) cleanly maps to `requiredEvidence`, so a player who cracked Marcus has the language to win. In Weekend 3, `solution.murdererId` flips to the new suspect (`'henry'` per current draft) and Marcus's role shifts to "suspicious but innocent."

Option 2 is the only path that produces a playable game this weekend.

## Decision

For Weekend 2, `case-01-soho-gallery.solution` is:

```ts
{
  murdererId: 'marcus',
  requiredEvidence: ['car', 'gallery', '21:30'],
  explanation: '...Marcus drove to the gallery on Tuesday...',
}
```

The inline code comment marks this as provisional and points at this ADR. Weekend 3's spec is responsible for flipping `murdererId`, rewriting `explanation`, and updating `requiredEvidence` to match the real solution.

This ADR will be **superseded** (not amended) by a follow-up ADR in Weekend 3 that records the canonical solution. This one stays in the tree as the historical record.

## Consequences

- Weekend 2 ships with a fully playable, winnable case.
- Any video/screenshot content recorded during Weekend 2 will show "Marcus did it" — which is wrong canon. The journal flags this; nothing is published publicly until after Weekend 3 lands.
- The `requiredEvidence` substrings (`'car'`, `'gallery'`, `'21:30'`) are deliberately the same facts as Marcus's crack point, so a player who actually cracked him will write a winning accusation by paraphrasing what they just learned.
- Weekend 3 must include: an updated case file, a superseding ADR, and a regression note in `tests/unit/evaluate-accusation.test.ts` whose fixtures may need updating if they hard-code `'marcus'`.

## Rationale

Shipping a complete loop with provisional content beats shipping an incomplete loop with correct content. The whole point of doing this in weekends is to learn from a working game; an unreachable Win screen produces no learning. The cost of the temporary wrong canon is one journal note and a Weekend-3 follow-up — both already on the plan.
