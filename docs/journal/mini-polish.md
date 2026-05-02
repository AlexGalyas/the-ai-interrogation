# Mini-Polish Weekend — Journal

> Running log for the Mini-Polish weekend (visual foundation: noir palette, typography, small UX polish). Filled in across the weekend; not a retrospective written after the fact.

## What I built

- Step 1 — Spec + ADR + journal stub. Committed `docs/specs/mini-polish-visual-foundation.md` as the contract for the weekend, recorded the tone/palette/typography decision as `docs/decisions/0011-noir-palette-and-typography.md`, and seeded this journal file. No code changes in this step — Step 2 onward touches theme, fonts, and components.
- Step 2 — Noir palette + dark-only. Replaced shadcn's default light/dark OKLCH variables in `src/app/globals.css` with the noir palette per ADR-0011 (background `#0F0E0C`, surface `#1A1816`, border `#2B2724`, foreground `#E8DFCF`, muted-foreground `#9A8E7A`, primary/accent `#C19A4F`, destructive `#A94442`). Duplicated the same values into `:root` and `.dark` so the page stays correct even if the dark class is ever stripped. Hardcoded `class="dark"` on `<html>` in `src/app/layout.tsx` (no `next-themes`, no toggle). Left chart and sidebar tokens defined for shadcn compatibility but pointed them at our palette since nothing in the game uses them. No hardcoded color utilities to replace — `bg-slate-*` / `text-zinc-*` etc. did not appear in app code; only `bg-black/10` in `src/components/ui/dialog.tsx` (vendored shadcn primitive, semi-transparent overlay — left alone per ADR-0006).
- Step 3 — Three role-typed fonts. Added Crimson Text via `next/font/google` (`weight: ['400', '600', '700']`, `display: 'swap'`) bound to `--font-serif`. Renamed the existing Geist Sans / Geist Mono `next/font` variables from `--font-geist-sans` / `--font-geist-mono` to `--font-sans` / `--font-mono` so the Tailwind v4 `font-*` utilities resolve correctly through the `@theme inline` block. Updated globals.css `@theme inline` to register `--font-serif` (and re-pointed `--font-heading` at it). The existing `html { @apply font-sans }` base rule keeps Geist Sans as the body default. Applied `font-mono` to assistant chat bubbles and `font-sans` (explicit, for clarity) to user bubbles in `src/features/interrogation/chat-view/chat-view.tsx` to create the "transcript vs your questions" split. No `font-serif` applied yet — Briefing typography lands in Step 6.
-

## What was hard

- shadcn's globals.css uses OKLCH, but the noir palette in the spec is hex. Wrote a one-off Node script (sRGB → linear → Oklab → Oklch) to convert the seven source hex values rather than eyeballing them. Kept the source hex in CSS comments so future edits can round-trip without re-deriving.
- The shadcn Nova preset shipped with a latent font bug: `next/font` bound Geist Sans to `--font-geist-sans`, but `globals.css` `@theme inline` had `--font-sans: var(--font-sans);` — a self-referential mapping. So Tailwind's `font-sans` utility was resolving to nothing and the page silently fell back to the browser default sans-serif rather than Geist. Fixed by renaming the next/font variables to `--font-sans` / `--font-mono` and registering `--font-serif` alongside, then verifying via `getComputedStyle` on synthetic `font-sans` / `font-mono` / `font-serif` nodes that all three resolve to the right family.
-

## Interesting moments worth showing on video

-

## Mistakes / things I'd do differently

-

## Spec deviations

-

---

Total time: TBD
