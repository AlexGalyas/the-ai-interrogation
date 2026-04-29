# ADR-0004: Thin Route Handlers, Business Logic in `src/api/`

**Status:** Accepted
**Date:** 2026-04-29

## Context

Next.js App Router requires API routes to live at `src/app/api/<endpoint>/route.ts`. Putting all logic there couples our code to Next conventions and makes it hard to test in isolation.

## Decision

`src/app/api/*/route.ts` files are thin: they parse the request, validate with Zod, delegate to a handler in `src/api/*/handler.ts`, and return the response.

All business logic — prompt building, Anthropic SDK calls, stream adaptation — lives in plain modules under `src/api/` that have no dependency on Next runtime types.

## Consequences

- Handlers can be unit-tested in Vitest without spinning up Next.
- Migrating to a different framework (or a CLI) requires touching only `src/app/`.
- Two-file structure per endpoint instead of one (acceptable cost).

## Rationale

Testability and portability outweigh the minor verbosity of the two-file pattern.