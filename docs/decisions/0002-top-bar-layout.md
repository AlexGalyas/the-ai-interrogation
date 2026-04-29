# ADR-0002: Top-Bar Layout on Every Viewport

**Status:** Accepted
**Date:** 2026-04-29

## Context

The interrogation page must show two things: the suspect's identity and the chat. Common layouts are split (sidebar + main) or stacked (top bar + main).

## Decision

Use a top bar with the suspect's identity above a full-width chat on every viewport — no responsive switching to a split layout on desktop.

## Consequences

- One layout to maintain across breakpoints.
- The suspect's identity reads as a "header" rather than a competing column, which matches the framing of an interrogation room.

## Rationale

Simpler, mobile-friendly without responsive logic, and stylistically aligned with the game's framing. A split layout was considered but adds complexity for a marginal aesthetic gain.
