export interface CrackPoint {
	/** Human-readable description for documentation; not used in prompt. */
	description: string
	/** Hint to the model on what triggers the break. Embedded into the system prompt. */
	triggerHint: string
}

export interface Suspect {
	id: string
	name: string
	oneLiner: string
	publicAlibi: string
	hiddenTruth: string
	lyingRules: string[]
	crackPoint?: CrackPoint
	personality: string
}

export interface CaseSolution {
	/** Suspect ID of the actual murderer. */
	murdererId: string
	/**
	 * Substrings (case-insensitive) that the player's evidence quote MUST contain
	 * for the accusation to count as correct. Order does not matter. ALL must match.
	 */
	requiredEvidence: string[]
	/**
	 * 1–2 paragraph explanation of how the case was actually solved.
	 * Currently unused (no truth reveal on Lose), but stored for future use.
	 */
	explanation: string
}

export interface Case {
	id: string
	title: string
	premise: string
	suspects: Suspect[]
	solution: CaseSolution
}

/**
 * Client-safe projection of a `Suspect`. Excludes `publicAlibi`, `hiddenTruth`,
 * `lyingRules`, `crackPoint`, and `personality` — those fields belong to the
 * server-side prompt builder and would leak the murder solution if shipped to
 * the browser. See ADR-0014.
 */
export interface PublicSuspect {
	id: string
	name: string
	oneLiner: string
}

/**
 * Client-safe projection of a `Case`. Excludes `solution` (which contains
 * `requiredEvidence` keywords that double as a hint sheet) and uses
 * `PublicSuspect[]` for `suspects`. See ADR-0014.
 */
export interface PublicCase {
	id: string
	title: string
	premise: string
	suspects: PublicSuspect[]
}

export interface Accusation {
	suspectId: string
	evidence: string
}

export interface AccusationResult {
	isCorrect: boolean
	/** Required evidence substrings that were found in the player's evidence. */
	matchedEvidence: string[]
	/** Required evidence substrings that were NOT found. */
	missingEvidence: string[]
}
