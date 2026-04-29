# ADR-0005: Pure Game Logic in `src/lib/game/`

**Status:** Accepted
**Date:** 2026-04-29

## Context

The game has logic that is independent of UI: building system prompts, evaluating accusations, validating case definitions. This logic could live inside React components, hooks, or stores — but doing so couples it to React.

## Decision

All game logic lives as pure functions in `src/lib/game/`. No React, no Next, no I/O. Inputs and outputs are plain data.

## Consequences

- Game logic is unit-testable with Vitest in milliseconds.
- The same logic can be reused in a CLI version, a test harness, or a non-React port without modification.
- React components and stores act as thin adapters that call into `lib/game/`.

## Rationale

Pure functions are the cheapest abstraction with the highest testing payoff. The cost of separating them is negligible; the cost of un-separating them later is high.
