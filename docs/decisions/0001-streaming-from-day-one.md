# ADR-0001: Streaming from Day One

**Status:** Accepted
**Date:** 2026-04-29

## Context

The interrogation game involves real-time conversation with an AI suspect. Anthropic's SDK supports both streaming and non-streaming responses. Streaming text token-by-token improves immersion (the suspect feels like they are speaking), while non-streaming is simpler to implement.

We considered shipping non-streaming first and adding streaming on Weekend 4 with the rest of the polish.

## Decision

Streaming is implemented from Weekend 1.

## Consequences

- API routes return `Response` with a `ReadableStream` from day one.
- Client uses `fetch` + `getReader()` to consume the stream incrementally.
- The Zustand store has a dedicated path for incrementally appending tokens to an in-flight assistant message.

## Rationale

Retrofitting streaming later means rewriting the API route, the store, and the message-rendering component. The cost of doing it right initially is roughly equal to the cost of doing it without streaming, and the user-facing payoff (immersion + a more compelling demo clip) is immediate.