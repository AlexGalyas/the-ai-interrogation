# ADR-0012: Case-01 Canon Update — Henry Is the Murderer; Marcus Reassigned to Innocent Witness

**Status:** Accepted
**Date:** 2026-05-03
**Supersedes:** ADR-0009 (provisional-murderer-marcus)

## Context

Weekend 2 shipped `case-01-soho-gallery` with a provisionally-named murderer (Marcus Reeve) so the game had a winnable end state. ADR-0009 recorded that choice as a temporary scaffold and explicitly deferred the canonical solution to Weekend 3, which would introduce additional suspects and reassign the murder to its intended owner.

Weekend 3 (`docs/specs/weekend-3-real-case.md`) is now under way. The case is being promoted from a one-suspect prototype to a real three-suspect detective case with a coherent timeline, false leads, and earned wins. The architecture stays as-is; this is a content + prompt-engineering weekend. The canon needs to be locked before any suspect content is written or any test fixture is updated, because every downstream artifact (suspects, premise, solution, E2E test, screen recording) flows from it.

The intended canon was sketched in ADR-0009's "Context" section but never recorded as a decision in its own right. This ADR records it.

## Decision

For `case-01-soho-gallery`, the canonical solution is:

- **Murderer:** Henry Whitfield — Helena's partner of two years, art critic at The Telegraph. Compound motive: Helena had discovered Henry's plagiarism arrangement with painter Adrien Cole (paid reviews) and was simultaneously revealed as sleeping with Adrien. She refused to give Henry a quiet exit and had begun assembling proof for the Telegraph editor. Henry drove to the gallery on Tuesday around 21:30 to negotiate, was refused, and struck Helena with a bronze statuette from her desk in an unpremeditated act. He left through the cameraless side entrance. The bloodstained shirt is hidden in his garage; he has not been able to dispose of it.
- **Marcus Reeve — reassigned to innocent witness.** Same suspect ID, same name, same one-liner. New `hiddenTruth`: Helena had told him on Monday she was dropping him from the gallery; he drove there around 21:50 on Tuesday with a key to the artist entrance to plead his case again, found her already dead, panicked, and fled without calling the police. He is guilty of fleeing the scene, not of the murder. He functions as a designed misdirect — appears suspicious (timeline-adjacent, lies about being there) but is timeline-incompatible with the actual killing.
- **Diana Reyes — new third suspect.** Art-dealer rival at Reyes Contemporary. Solid, true alibi at a Tate Modern vernissage on Tuesday evening. Hidden truth: she has been paying Helena's gallery assistant Iris £500/month for eighteen months in exchange for inside information on Voss Gallery artists and acquisitions. She is not a killer; she is a rival who got caught snooping. She is the third investigative vector and the canonical bridge by which the player learns about Henry's plagiarism scheme — once cracked on the bank-transfer fact, she voluntarily discloses what Iris told her about Helena's Monday-night call.

Concretely in `case-01-soho-gallery.ts`:

```ts
solution: {
  murdererId: 'henry',
  requiredEvidence: ['Henry', 'Adrien', 'shirt'],
  explanation: '<see spec §3.6 for full text>',
}
```

The full premise text, fact-distribution map, and per-suspect prompts live in `docs/specs/weekend-3-real-case.md` §§3–4. This ADR records the *decision*; the spec carries the *content*.

ADR-0009's status changes from Accepted to Superseded with a pointer to this ADR. ADR-0009 stays in the tree as the historical record of why Weekend 2 shipped with provisional content — that history is part of the project's public build narrative and should not be erased.

## Consequences

- `case-01-soho-gallery.ts` is fully rewritten in Weekend 3 Step 2 onward: new premise, new solution block, Marcus rewritten, Henry and Diana added as new `Suspect` objects.
- The Playwright happy-path E2E (`tests/e2e/happy-path.spec.ts`) is updated to accuse Henry with evidence containing `'Henry'`, `'Adrien'`, `'shirt'`. The Anthropic API mock stays generic — the test proves the streaming pipeline, not suspect believability.
- Any screen recording or screenshot from Weekend 2 that shows "Marcus did it" is now wrong canon and is superseded by the Weekend 3 Win-playthrough recording. Nothing from Weekend 2 has been published publicly; the journal already flagged this risk.
- The case is now solvable through reasoning rather than guessing: the briefing surfaces all four investigative leads, the suspects expose interlocking facts, and the intended path (Diana → plagiarism disclosure → Henry double-fact crack) is discoverable from the briefing alone.
- The crack-point mechanic itself is unchanged. `evaluateAccusation`, `submitAccusation`, the store, the API routes, and the components all work as-is. This is purely a content change.
- Future cases (Weekend 5's potential Case 2) inherit a worked example of how a case should resolve: a misdirect suspect with a partial-truth confession, a real murderer with a compound motive and a hard crack, and a third suspect whose hidden truth is the bridge between the two.

## Rationale

ADR-0009 was explicit that the provisional Marcus-as-murderer assignment would be superseded, not amended, when the canonical solution was decided. Recording the canon as its own ADR — rather than editing ADR-0009 in place — preserves the build history (why Weekend 2 chose what it chose) and gives the canonical decision its own discoverable home (anyone reading `docs/decisions/` chronologically sees the provisional choice, then the supersession, with the reasoning for both).

The compound motive (plagiarism + sexual betrayal + denied honourable exit) and the double-fact crack point (Adrien plagiarism AND bloodstained shirt) are the design choices that make Henry's confession feel earned rather than guessed. Diana's role as the bridge suspect — her crack voluntarily reveals the plagiarism thread — turns the case from "ask every suspect about everything" into a real puzzle with an intended path. These are content decisions, not architectural ones, but they are load-bearing for whether the game is *good*; this ADR records them so that future content additions have a precedent for the shape of a working case.
