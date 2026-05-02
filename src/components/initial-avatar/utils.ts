/**
 * Returns up to two uppercase initials from `name`, taken from the first
 * letter of the first two whitespace-separated tokens.
 *
 * Returns `'?'` when the name is empty or contains only whitespace.
 *
 * @example
 * computeInitials('Marcus Reeve') // 'MR'
 * computeInitials('Marcus')       // 'M'
 * computeInitials('')             // '?'
 */
export function computeInitials(name: string): string {
	const tokens = name.trim().split(/\s+/).filter(Boolean)
	if (tokens.length === 0) return '?'
	if (tokens.length === 1) return tokens[0]!.charAt(0).toUpperCase()
	return (tokens[0]!.charAt(0) + tokens[1]!.charAt(0)).toUpperCase()
}

/**
 * Maps `name` to a deterministic hue in the range [0, 359].
 *
 * Uses a simple order-sensitive accumulator so that two distinct names
 * almost certainly produce different hues. Not collision-free — for our
 * three-suspect scope, that's fine.
 */
export function hashToHue(name: string): number {
	let hash = 0
	for (let i = 0; i < name.length; i++) {
		hash = (hash * 31 + name.charCodeAt(i)) | 0
	}
	return Math.abs(hash) % 360
}
