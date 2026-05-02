# Mini-Polish Weekend — Journal

> Running log for the Mini-Polish weekend (visual foundation: noir palette, typography, small UX polish). Filled in across the weekend; not a retrospective written after the fact.

## What I built

- Step 1 — Spec + ADR + journal stub. Committed `docs/specs/mini-polish-visual-foundation.md` as the contract for the weekend, recorded the tone/palette/typography decision as `docs/decisions/0011-noir-palette-and-typography.md`, and seeded this journal file. No code changes in this step — Step 2 onward touches theme, fonts, and components.
- Step 2 — Noir palette + dark-only. Replaced shadcn's default light/dark OKLCH variables in `src/app/globals.css` with the noir palette per ADR-0011 (background `#0F0E0C`, surface `#1A1816`, border `#2B2724`, foreground `#E8DFCF`, muted-foreground `#9A8E7A`, primary/accent `#C19A4F`, destructive `#A94442`). Duplicated the same values into `:root` and `.dark` so the page stays correct even if the dark class is ever stripped. Hardcoded `class="dark"` on `<html>` in `src/app/layout.tsx` (no `next-themes`, no toggle). Left chart and sidebar tokens defined for shadcn compatibility but pointed them at our palette since nothing in the game uses them. No hardcoded color utilities to replace — `bg-slate-*` / `text-zinc-*` etc. did not appear in app code; only `bg-black/10` in `src/components/ui/dialog.tsx` (vendored shadcn primitive, semi-transparent overlay — left alone per ADR-0006).
-

## What was hard

- shadcn's globals.css uses OKLCH, but the noir palette in the spec is hex. Wrote a one-off Node script (sRGB → linear → Oklab → Oklch) to convert the seven source hex values rather than eyeballing them. Kept the source hex in CSS comments so future edits can round-trip without re-deriving.
-

## Interesting moments worth showing on video

-

## Mistakes / things I'd do differently

-

## Spec deviations

-

---

Total time: TBD
