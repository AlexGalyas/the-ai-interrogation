# the-ai-interrogation

An AI-powered detective game where each suspect has a hidden truth, a public alibi, and a "crack point" — a specific fact that, if surfaced by the player, forces a confession. Built in public over six weekends.

> **Status:** in development. Following along: [@AlexGalyas](https://x.com/AlexGalyas) <!-- update if your handle differs -->

## Stack

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui · Zustand · Anthropic SDK · Vitest · Playwright · Vercel

## Quick start

```bash
pnpm install
cp .env.example .env.local       # then fill ANTHROPIC_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` — dev server (Turbopack)
- `pnpm typecheck` — TypeScript
- `pnpm lint` / `pnpm lint:fix` — ESLint (+ Prettier on `:fix`)
- `pnpm format` — Prettier
- `pnpm test` — Vitest unit tests
- `pnpm test:e2e` — Playwright E2E

## Architecture

See [`AGENTS.md`](./AGENTS.md) for the full project conventions, stack, and architectural rules. Specs per weekend live under [`docs/specs/`](./docs/specs/). Architecture Decision Records live under [`docs/decisions/`](./docs/decisions/).

## License

MIT