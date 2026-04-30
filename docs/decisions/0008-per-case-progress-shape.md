# ADR-0008: Per-Case Progress Shape (`progressByCase: Record<caseId, CaseProgress>`)

**Status:** Accepted
**Date:** 2026-04-30

## Context

Weekend 2 ships only one case (`case-01-soho-gallery`). Weekend 5 adds a second. The simplest store shape would flatten the current case's state into the root:

```ts
interface GameState {
  messages: Message[]
  activeSuspectId: string
  accusation: PersistedAccusation | null
  // ...
}
```

This works today, but two cases later we'd be facing one of:

- A store rewrite to introduce per-case scoping, plus a `localStorage` migration to move existing progress under the new shape.
- A second top-level store, doubling the surface area of selectors and actions.

Neither is appealing. The cost of adopting per-case scoping now is small (one extra layer of `Record` lookup), the cost of retrofitting it later is high.

## Decision

The store keeps a `Record<caseId, CaseProgress>` from day one, even though the record has only one entry in Weekend 2:

```ts
interface CaseProgress {
  hasBegun: boolean
  messagesBySuspect: Record<string, Message[]>
  isStreamingBySuspect: Record<string, boolean>
  activeSuspectId: string
  accusation: PersistedAccusation | null
}

interface GameState {
  currentCaseId: string
  progressByCase: Record<string, CaseProgress>
  // selectors + actions
}
```

`hasBegun: boolean` disambiguates "fresh briefing" from "investigation with zero questions asked", so the screen-derivation function does not have to inspect message arrays to decide which screen to render.

Suspect-scoped fields (`messagesBySuspect`, `isStreamingBySuspect`) live inside `CaseProgress` so that `isStreaming` can be tracked **per suspect** — required by the tab-switching behaviour in spec §4.2 (a stream continues in the background when the player switches tabs).

All mutations to `progressByCase` go through store actions; components read via selectors only.

## Consequences

- Adding a second case in Weekend 5 is a content-only change: `progressByCase[case02Id]` populates lazily on first interaction; no schema change, no migration.
- Selectors are slightly more verbose: `getCurrentProgress()` indirects through `progressByCase[currentCaseId]`. Worth it for the Weekend-5 ergonomics.
- The persisted blob carries an extra `Record` layer that is mostly empty in Weekend 2. Storage cost is negligible.
- `isStreamingBySuspect` is technically ephemeral but persisting it does no harm — on rehydrate, any `true` flags are stale but harmless because no real stream is attached to them; the next user action resolves the inconsistency.

## Rationale

The repeated lesson from previous projects is that data shapes outlive their first use case. Picking the right shape on day one is cheap; reshaping a persisted store under live users is not. We have no live users yet, but we will, and we'd rather not rewrite the store on the eve of Weekend 5.
