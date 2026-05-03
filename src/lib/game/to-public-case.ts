import type { Case, PublicCase, PublicSuspect, Suspect } from '@/lib/game/types'

/**
 * Strips the secret fields off a `Suspect`, returning only what the client UI
 * needs to render avatars, tabs, and pickers. The dropped fields
 * (`publicAlibi`, `hiddenTruth`, `lyingRules`, `crackPoint`, `personality`) are
 * used only by the server-side prompt builder.
 */
function toPublicSuspect(suspect: Suspect): PublicSuspect {
	return {
		id: suspect.id,
		name: suspect.name,
		oneLiner: suspect.oneLiner
	}
}

/**
 * Returns a client-safe projection of a `Case` — drops the `solution` block
 * (whose `requiredEvidence` and `explanation` would leak the answer key to
 * anyone viewing page source) and projects each suspect through
 * `toPublicSuspect`. The original `Case` stays available server-side for prompt
 * building and accusation evaluation.
 *
 * @param kase Full case definition.
 * @returns A `PublicCase` containing only fields the browser legitimately
 *   needs.
 */
export function toPublicCase(kase: Case): PublicCase {
	return {
		id: kase.id,
		title: kase.title,
		premise: kase.premise,
		suspects: kase.suspects.map(toPublicSuspect)
	}
}
