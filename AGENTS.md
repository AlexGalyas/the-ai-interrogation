# AGENTS.md

> Instructions for AI coding assistants (Cursor, Claude Code, Codex, etc.) and human contributors working on **the-ai-interrogation**.

---

## 1. Project Context

**the-ai-interrogation** is a browser-based detective game where the player interrogates AI-driven suspects to identify a murderer. Each suspect is powered by a Large Language Model with a hidden truth, public alibi, lying rules, and "crack points" — specific facts that, if surfaced by the player, force a confession.

The project is a hobby / portfolio piece built in public. Scope is intentionally bounded: a polished MVP with two cases over six weekends (≈30 hours), released on itch.io and a custom domain.

**Goals:**

- Ship a fun, novel game experience that demonstrates prompt-engineered NPC design
- Maintain portfolio-grade code quality (typed, linted, tested, CI-protected)
- Document the build process publicly via X / dev blog posts

**Non-goals:**

- Multiplayer, accounts, monetization, persistence beyond `localStorage`
- Mobile-native apps (responsive web only)
- Generic "chat with AI" gameplay — the game lives or dies on the prompt-engineered crack-point mechanic

---

## 2. Tech Stack

| Layer           | Choice                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 15** (App Router)                                                                   |
| Language        | **TypeScript** (`strict: true`)                                                               |
| Package manager | **pnpm**                                                                                      |
| Styling         | **Tailwind CSS v4** + **shadcn/ui**                                                           |
| State           | **Zustand** (with `persist` middleware for `localStorage`)                                    |
| Animations      | **Motion** (`motion/react`)                                                                   |
| AI SDK          | `@anthropic-ai/sdk`                                                                           |
| Default model   | `claude-haiku-4-5` (re-evaluate against `claude-sonnet-4-6` in Weekend 3–4)                   |
| Lint / format   | ESLint (Next config + `eslint-plugin-tailwindcss`) + Prettier (`prettier-plugin-tailwindcss`) |
| Pre-commit      | Husky + lint-staged                                                                           |
| Tests (unit)    | **Vitest**                                                                                    |
| Tests (E2E)     | **Playwright**                                                                                |
| CI              | **GitHub Actions** (lint + typecheck + test on PR)                                            |
| Hosting         | **Vercel** (auto-deploy main, preview on PR)                                                  |

**Hard rules:**

- Never call Anthropic API from the client. All AI calls go through `src/app/api/*/route.ts`.
- No `any`. If you genuinely need an escape hatch, use `unknown` and narrow.
- No default exports **except** for React components and Next.js route handlers.

---

## 3. Architecture

### 3.1 Top-level layout

```
the-ai-interrogation/
├── src/
│   ├── app/                    # Next.js App Router (routes only — thin)
│   │   ├── api/
│   │   │   └── interrogate/
│   │   │       └── route.ts    # thin handler — parses request, calls src/api logic
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                    # Server-side business logic for API routes
│   │   └── interrogate/
│   │       ├── handler.ts
│   │       ├── schema.ts       # Zod schemas for request/response
│   │       └── stream.ts       # streaming helpers
│   ├── features/               # Feature-scoped React code
│   │   ├── interrogation/
│   │   ├── case-briefing/
│   │   └── accusation/
│   ├── components/             # Reusable UI primitives (shadcn/ui lives here)
│   │   └── ui/
│   ├── stores/                 # Zustand stores
│   │   └── game.ts
│   ├── lib/                    # Pure, framework-free utilities
│   │   ├── game/               # Game logic — pure functions, no React, no Next
│   │   │   ├── evaluate-accusation.ts
│   │   │   ├── build-suspect-prompt.ts
│   │   │   └── types.ts
│   │   ├── ai/                 # Anthropic client wrapper
│   │   └── utils.ts
│   └── content/
│       └── cases/              # Typed case definitions (TS files)
│           └── case-01-the-gallery.ts
├── docs/
│   ├── specs/                  # SDD specifications per weekend
│   ├── architecture/
│   └── decisions/              # ADRs
├── tests/
│   ├── unit/                   # Vitest
│   └── e2e/                    # Playwright
├── public/
├── .env.example
├── .env.local                  # gitignored
├── AGENTS.md                   # this file
├── CLAUDE.md                   # → references AGENTS.md
├── .cursorrules                # → references AGENTS.md
└── README.md
```

### 3.2 Architectural principles

**Hybrid organization (App Router + features + shared layers).** `src/app/` holds only routing. Business logic lives in `src/features/` (React) and `src/lib/` (pure). Reusable UI primitives in `src/components/`.

**Pure game logic, separated from React.** Anything in `src/lib/game/` must be pure: no React, no Next, no environment dependencies. Inputs and outputs are plain data. This is what gets unit-tested and what could be reused for a CLI version, mobile port, or test harness.

**Server-side AI logic in `src/api/`, route handlers stay thin.** `src/app/api/*/route.ts` parses the request, validates with Zod, calls the corresponding handler in `src/api/`, and returns the response (often a stream). The handler is where business logic lives — and it can be unit-tested in isolation from Next.js.

**Streaming from day one.** API routes return `Response` with a `ReadableStream` from the Anthropic SDK's streaming API. The client renders text token-by-token. No "non-streaming first, streaming later" — the architectural cost of retrofitting is higher than getting it right initially.

**Content as typed TypeScript modules.** Cases and suspects live as `*.ts` files exporting strongly-typed objects under `src/content/cases/`. When the game has 10+ cases, migrate to JSON + Zod validation (tracked in ADR).

**Import direction is one-way.** UI may import from `lib/` and `stores/`. `lib/` and `src/api/` **never** import from `app/`, `features/`, `components/`, or `stores/`. Enforced via `eslint-plugin-import` `no-restricted-paths`.

**Path alias.** `@/*` maps to `src/*`. Always use absolute imports.

---

## 4. Conventions

### 4.1 Git workflow

**Feature branches + PR.** Even working solo, every change goes through a PR into `main`. CI runs on PR; merge only when green. Squash-merge by default to keep `main` history clean.

`main` is protected: no direct pushes, status checks required.

### 4.2 Branch naming

`<type>/<short-kebab-description>` — e.g. `feat/streaming-api`, `fix/prompt-leak`, `docs/weekend-1-spec`, `chore/update-deps`.

### 4.3 Commit messages — Conventional Commits

Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`.

Examples:

```
feat(interrogation): add streaming response handler
fix(prompt): suspect stays in character after meta-questions
docs(adr): add ADR-002 on Zustand persistence strategy
test(game): cover evaluateAccusation edge cases
```

### 4.4 Naming

| Thing                 | Convention                                                                                                       | Example                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Files (non-component) | `kebab-case.ts`                                                                                                  | `build-suspect-prompt.ts`                        |
| Component files       | `kebab-case.tsx` inside a kebab-case folder, with an `index.ts` barrel re-exporting the component (see ADR-0006) | `chat-view/chat-view.tsx` + `chat-view/index.ts` |
| Component identifiers | `PascalCase` (React requirement)                                                                                 | `ChatView`, `SuspectTopBar`                      |
| Types / interfaces    | `PascalCase`                                                                                                     | `Suspect`, `CaseDefinition`                      |
| Constants             | `SCREAMING_SNAKE_CASE`                                                                                           | `MAX_QUESTIONS_PER_SUSPECT`                      |
| Functions / variables | `camelCase`                                                                                                      | `evaluateAccusation`                             |
| Zustand stores (hook) | `useXxxStore`                                                                                                    | `useGameStore`                                   |
| Booleans              | `is*` / `has*` / `should*`                                                                                       | `isAccusing`, `hasConfessed`                     |

### 4.5 Imports

- Always absolute: `import { useGameStore } from '@/stores/game'`
- Relative imports allowed only inside the same feature folder (sibling files)
- One-way direction enforced by ESLint (see §3.2)

### 4.6 Comments

- **JSDoc** for every public export from `src/lib/` and `src/api/` — describe purpose, params, return value, and any non-obvious behaviour.
- Inline comments only where **why** is non-obvious. Never comment **what** the code is already doing.
- React components do not require JSDoc; props must be a typed interface.

### 4.7 Definition of Done

A feature is **done** when all of the following are true:

1. Code is merged into `main` via a green PR.
2. `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass.
3. New business logic has a Vitest unit test.
4. New user-facing flow has at least one Playwright E2E covering the happy path.
5. The corresponding spec under `docs/specs/` is updated to reflect what actually shipped (SDD: spec drift is a bug).
6. If an architectural decision was made or changed, an ADR exists under `docs/decisions/`.
7. Public-facing changes are reflected in README if relevant.

---

## 5. Commands

```bash
# Setup
pnpm install
cp .env.example .env.local       # then fill ANTHROPIC_API_KEY

# Development
pnpm dev                         # Next dev server on :3000
pnpm typecheck                   # tsc --noEmit
pnpm lint                        # ESLint
pnpm lint:fix                    # ESLint + Prettier autofix
pnpm format                      # Prettier write
pnpm test                        # Vitest (unit)
pnpm test:e2e                    # Playwright

# Build
pnpm build
pnpm start                       # serve production build locally
```

---

## 6. Environment variables

Required:

- `ANTHROPIC_API_KEY` — server-side only. Never exposed to client.

`.env.local` is gitignored. `.env.example` lives in the repo as a template. Production values are managed in Vercel Environment Variables.

Any env var read from the client must be prefixed `NEXT_PUBLIC_*` and must never carry secrets.

---

## 7. Don'ts

- ❌ Don't call Anthropic API from client code. Always go through `src/app/api/*/route.ts` → `src/api/*/handler.ts`.
- ❌ Don't import from `src/app/`, `src/features/`, `src/components/`, or `src/stores/` inside `src/lib/` or `src/api/`. The dependency arrow only points toward `lib/`.
- ❌ Don't use `any`. Use `unknown` and narrow, or define the type properly.
- ❌ Don't use default exports outside React components and Next route handlers.
- ❌ Don't store secrets in the client bundle or in `NEXT_PUBLIC_*` env vars.
- ❌ Don't put game rules inside React components. Logic goes in `src/lib/game/`; components consume it.
- ❌ Don't commit directly to `main`. PR with green CI only.
- ❌ Don't suggest replacing the stack (App Router, Tailwind, Zustand, etc.) without an ADR.
- ❌ Don't write comments that restate what the code already says. Only `why`.
- ❌ Don't skip writing/updating the spec when shipping a feature. SDD discipline is non-negotiable.

---

## 8. AI assistant integration

This file is the single source of truth. To wire it into specific tools:

- **Cursor**: `.cursorrules` references this file (`See AGENTS.md for full project context, conventions, and constraints.`)
- **Claude Code**: `CLAUDE.md` references this file similarly.
- **Other agents**: most modern AI coding tools auto-detect `AGENTS.md`.

When an AI assistant proposes code that conflicts with this document, the assistant must flag the conflict and either propose an ADR or follow the existing rule.
