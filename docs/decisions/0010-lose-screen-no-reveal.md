# ADR-0010: Lose Screen Does Not Reveal the Murderer

**Status:** Accepted
**Date:** 2026-04-30

## Context

When a player accuses the wrong suspect (or the right suspect with insufficient evidence), the Outcome screen shows the Lose variant. A natural-feeling design instinct is to reveal the truth here: "It was actually X. The evidence you missed was Y." Many detective games do this.

For our game, two countervailing pressures matter more:

1. **Replay motivation.** The play time per case is short (5–15 minutes). If the truth is revealed on Lose, a single failed attempt ends the case forever — there is nothing left to discover. The player has no reason to interrogate again.
2. **The crack-point mechanic is the experience.** The point of the game is the "aha" moment of breaking a suspect by surfacing the right fact. A truth-reveal on Lose collapses that moment into a passive readout, undercutting the mechanic the entire design is built around.

Withholding the truth keeps the loop tight: a Lose result invites another investigation pass, this time with sharper questions.

## Decision

The Lose screen shows:

- Heading: **"Case unsolved."**
- Subhead: **"Your accusation didn't hold up."**
- A **New investigation** button that resets the case's progress and returns to Briefing.

It does **not** show:

- The actual murderer's identity.
- Which evidence keywords were missing.
- The `solution.explanation` text.

The `solution.explanation` field is retained in the case schema for possible future use — for example, a post-replay debrief unlocked after solving, an achievements view, or a "give up" button if we later add one. Keeping the field costs nothing and avoids a schema change later.

## Consequences

- Players who fail must investigate again to learn the truth. This is the intended behaviour.
- A player who exhausts patience without solving has no in-game way to find out the answer. We accept this for the MVP. If this proves frustrating in playtesting, the most likely follow-up is an opt-in "give up and reveal" affordance, not an automatic reveal.
- Tests for the Outcome screen must assert the Lose variant does **not** render `case.solution.murdererId` or `case.solution.explanation` anywhere. This is a regression risk if a future iteration adds a generic "show solution details" component.

## Rationale

Revealing the truth on Lose is cheap to add and expensive to undo, because once players see it once they expect it. We default to the more conservative choice (no reveal) and leave the schema field in place so we can add the reveal later if playtesting demands it. Easy to put in, hard to take out — so we don't put it in until we have evidence we should.
