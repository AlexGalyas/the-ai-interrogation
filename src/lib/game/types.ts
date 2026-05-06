/**
 * Structured trigger that fires only when ALL listed facts are surfaced by the
 * interrogator (in the same exchange or within 1–2 consecutive turns). Used for
 * suspects whose crack point requires conjunction discrimination — single-fact
 * pressure must not crack them. See ADR-0013 (and its supersession).
 */
export interface ConjunctiveCrackTrigger {
	/** All facts that must be raised together. Order does not matter. */
	all: string[]
	/** Optional confession-tone guidance composed into the prompt after the rules. */
	description?: string
}

export interface CrackPoint {
	/** Human-readable description for documentation; not used in prompt. */
	description: string
	/**
	 * Hint to the model on what triggers the break. Embedded into the system prompt.
	 * - String form: single-fact crack — model sees the natural-language hint as-is.
	 * - Conjunctive form: multi-fact AND-discrimination — `buildSuspectPrompt`
	 *   composes deterministic IF/ELSE deflection rules and the confession trigger.
	 */
	triggerHint: string | ConjunctiveCrackTrigger
}

/**
 * Frontend-only nervousness mechanic config (see ADR-0017). When the player's
 * message contains any of `keywords` (case-insensitive substring match), the
 * suspect's nervousness value is increased by `increment` per match (capped at
 * 100). When no keywords match, nervousness decays. The keywords are scanned
 * client-side; no API or model changes are involved.
 */
export interface NervousnessTriggers {
	/** Case-insensitive substrings checked against player messages. */
	keywords: string[]
	/** How much to add per match. Capped at 100 in aggregate. */
	increment: number
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
	/**
	 * Optional. If absent, the suspect has no jitter behaviour and nervousness
	 * stays at 0. Backwards-compatible with pre-W4 suspect data.
	 */
	nervousnessTriggers?: NervousnessTriggers
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
