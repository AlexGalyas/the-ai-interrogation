# ADR-0007: Persist All Per-Case Progress in `localStorage`

**Status:** Accepted
**Date:** 2026-04-30

## Context

Weekend 2 introduces a multi-screen game loop (Briefing → Investigation → Accusation → Outcome). A refresh in any of these screens must not destroy player progress: chat history, the active suspect tab, an in-flight accusation, and the resulting Win/Lose screen all need to survive a page reload.

The MVP has no backend, no accounts, and no server-side storage. Two realistic options:

1. **Persist nothing.** A refresh sends the player back to Briefing every time. Simplest, but breaks the most basic UX expectation for a 5–15 minute interrogation session.
2. **Persist everything to `localStorage`.** A single source of truth — the Zustand store — is mirrored to disk via the `persist` middleware. A refresh rehydrates the store and the screen-derivation logic puts the player back where they were.

There is no in-between worth pursuing for an MVP: partial persistence (e.g., chat history but not screen state) would mean a refresh on the Outcome screen drops the player back into Investigation with the accusation gone, which is worse than no persistence at all.

## Decision

Persist the entire `GameState` object (`currentCaseId` + `progressByCase`) to `localStorage` under the key `the-ai-interrogation:game:v1` using Zustand's `persist` middleware.

The current screen is derived from store state at render time — it is **not** persisted as its own field. This guarantees the screen and the underlying data can never disagree.

Schema versioning is handled by the storage-key suffix. Any breaking change to the persisted shape bumps the suffix (`:v1` → `:v2`) and the prior blob is dropped silently. We do not write migration code for the MVP — the cost of building a migration pipeline is greater than the cost of a one-time progress reset for the handful of pre-launch playtesters.

If `localStorage` parsing fails (corrupted JSON, schema mismatch), log to console and start fresh.

## Consequences

- A single Zustand store with `persist` is the only thing the UI talks to. No other persistence layer exists.
- Refresh-equals-restore is the default behaviour for free, including on the Win/Lose screen.
- We owe the player a "New investigation" button to deliberately reset progress, since refresh no longer does that.
- Schema changes require a version bump and silently wipe progress for any player who upgrades. Acceptable while we have zero shipped users; revisit if we ever ship to production with real players.
- Multi-tab edits will race (last write wins). Not a concern for a single-player game.

## Rationale

`localStorage` + `persist` is the lowest-effort path that satisfies the UX requirement. Anything more (IndexedDB, server sync, structured migrations) is overkill for a hobby/portfolio MVP whose persistence needs are bounded by one player on one device. The architecture leaves room to swap the storage backend later by replacing the `persist` config — call sites do not change.
