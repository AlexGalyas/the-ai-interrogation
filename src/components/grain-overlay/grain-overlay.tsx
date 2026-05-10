/**
 * Procedural SVG noise overlay (spec §4 / ADR-0016). A single fixed-position
 * div above the background and below all interactive content. The noise is
 * generated client-side via an inline `<feTurbulence>` data URL — no separate
 * asset, no network request. `mix-blend-mode: overlay` (set in CSS) makes the
 * noise sit in the surface beneath it rather than on top. Always on; no toggle.
 *
 * The grain layer is purely decorative — `aria-hidden` keeps it out of the
 * accessibility tree, and `pointer-events: none` (set in CSS) ensures clicks
 * pass through to elements behind it.
 */
export function GrainOverlay() {
	return <div aria-hidden="true" className="grain-overlay" />
}
