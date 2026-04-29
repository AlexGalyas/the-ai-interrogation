# ADR-0006: Component File Layout — Folder per Component, kebab-case Files, index.ts Barrel

**Status:** Accepted
**Date:** 2026-04-29
**Supersedes (in part):** AGENTS.md §4.4 row "Component files"

## Context

Originally AGENTS.md §4.4 specified `PascalCase.tsx` for component files and placed components as flat files inside their feature folder. As the interrogation feature grew, several issues surfaced:

- Component files mixed with hooks, helpers, and styles inside one folder makes intent unclear at a glance.
- A single component often grows companion files (tests, hooks, sub-components, styles) that have no obvious home.
- Casing inconsistency: every other file convention in the project (utilities, lib, content) is kebab-case. The PascalCase exception for components is the only one.
- Imports of `@/features/interrogation/SuspectTopBar` mix a kebab folder with a PascalCase file, which is visually noisy.

## Decision

Every component written in this codebase lives in its own folder under its feature, named in kebab-case. The folder contains:

- `<component-name>.tsx` — the component definition. File name in kebab-case.
- `index.ts` — a barrel that re-exports the component.

The React component identifier itself **remains PascalCase** because React requires it to render JSX correctly (`<ChatView />`, not `<chat-view />`).

### Layout

```
src/features/interrogation/
├── chat-view/
│   ├── chat-view.tsx          ← exports `ChatView`
│   └── index.ts               ← `export { ChatView } from './chat-view';`
├── message-input/
│   ├── message-input.tsx
│   └── index.ts
├── suspect-top-bar/
│   ├── suspect-top-bar.tsx
│   └── index.ts
└── interrogation-room/
    ├── interrogation-room.tsx
    └── index.ts
```

### Import shape

```ts
import { ChatView } from '@/features/interrogation/chat-view';
```

The barrel makes the import path point at the folder, not the file — companion files (tests, hooks, sub-components) can be added later without touching call sites.

### Scope

Applies to:
- Components under `src/features/**`
- First-party components under `src/components/**` (i.e. anything we author)

**Does not apply to** `src/components/ui/` shadcn primitives. Those are vendored by the shadcn CLI and follow shadcn's own naming convention (`button.tsx`, `textarea.tsx`, no folder, no barrel). Forcing our convention on them would break `shadcn add` updates.

## Consequences

- Adding a hook, test, or sub-component next to a component is now a no-brainer — drop it in the same folder.
- Imports become `@/features/.../chat-view` instead of `@/features/.../ChatView` — fully kebab path, consistent with the rest of the project.
- Slight extra file count: every component gains one `index.ts`. Worth it for the consistency dividend.
- AGENTS.md §4.4 must be updated to reflect this; see AGENTS.md change in the same PR as this ADR.

## Rationale

The cost of one extra barrel file per component is negligible. The benefits — predictable home for companion files, uniform kebab-case paths, and the ability to add structure inside a component without breaking call sites — compound as the feature surface grows. A six-weekend MVP is small enough to make this change cheaply now and large enough to suffer if we delay.
