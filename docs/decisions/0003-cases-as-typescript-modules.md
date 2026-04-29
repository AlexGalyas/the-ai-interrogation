# ADR-0003: Cases as Typed TypeScript Modules

**Status:** Accepted
**Date:** 2026-04-29

## Context

Case content (premise, suspects, alibis, crack points) needs a storage format. Options considered: TypeScript modules, JSON files validated with Zod, MDX files with frontmatter.

## Decision

For the MVP, cases live as `.ts` files under `src/content/cases/` exporting strongly-typed `Case` objects.

## Consequences

- Editing a case requires rebuilding the project (acceptable in dev).
- Refactors of the `Case` shape propagate to all cases via the type system.
- Migration to JSON+Zod is a future task once content reaches ~10 cases.

## Rationale

TypeScript modules give the strongest authoring experience (autocomplete, type-safe refactors) at a stage where there are 1–3 cases and no need for runtime content updates. JSON/Zod overhead is unjustified at this scale.