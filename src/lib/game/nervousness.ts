import type { NervousnessTriggers } from '@/lib/game/types'

/** Hard cap on the nervousness range, per ADR-0017. */
export const NERVOUSNESS_MAX = 100

/** Per spec §7.7: each non-trigger player message multiplies current value by this. */
export const NERVOUSNESS_DECAY_FACTOR = 0.8

/**
 * Counts how many of the trigger keywords appear in `message` as case-insensitive
 * substrings. Each keyword contributes at most one match (a keyword that appears
 * twice in a message still counts once); multiple distinct keywords stack.
 *
 * @param message Player input.
 * @param triggers The active suspect's nervousness trigger configuration.
 * @returns Number of distinct keywords matched. `0` if no triggers/no matches.
 */
export function countNervousnessMatches(
	message: string,
	triggers: NervousnessTriggers | undefined
): number {
	if (!triggers) return 0
	const haystack = message.toLowerCase()
	let matches = 0
	for (const keyword of triggers.keywords) {
		if (keyword.length === 0) continue
		if (haystack.includes(keyword.toLowerCase())) {
			matches += 1
		}
	}
	return matches
}

/**
 * Computes the next nervousness value after a player message. If any keyword
 * matches, adds `increment * matches` and caps at `NERVOUSNESS_MAX`. If no
 * keywords match (or no triggers exist), returns `current` unchanged — the
 * caller is expected to invoke {@link applyNervousnessDecay} in that case.
 */
export function applyNervousnessBump(
	current: number,
	message: string,
	triggers: NervousnessTriggers | undefined
): number {
	const matches = countNervousnessMatches(message, triggers)
	if (matches === 0 || !triggers) return current
	const next = current + triggers.increment * matches
	return Math.min(next, NERVOUSNESS_MAX)
}

/**
 * Computes the next nervousness value after a player message that did NOT
 * mention any trigger keywords. Multiplies the current value by the decay
 * factor and floors at 0. Tiny residuals below 1 collapse to 0 so that
 * progressive-reveal bands (per spec §7.4) settle at exact zero rather than
 * drifting in epsilon territory.
 */
export function applyNervousnessDecay(current: number): number {
	const next = current * NERVOUSNESS_DECAY_FACTOR
	if (next < 1) return 0
	return next
}
