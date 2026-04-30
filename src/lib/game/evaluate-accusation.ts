import type { Accusation, AccusationResult, Case } from '@/lib/game/types'

/**
 * Evaluates a player's accusation against a case's solution.
 *
 * Pure and deterministic: identical `(kase, accusation)` inputs always produce
 * the exact same result. No I/O, no clocks, no randomness.
 *
 * Matching rules:
 * - Suspect identity must match `kase.solution.murdererId` exactly.
 * - Required-evidence substrings are matched case-insensitively against
 *   `accusation.evidence`. ALL substrings must be present for the accusation
 *   to count as correct (all-required semantics; order does not matter).
 * - When the accused suspect is NOT the murderer, the function short-circuits:
 *   `matchedEvidence` is empty and `missingEvidence` is the full required list,
 *   regardless of what the evidence text actually contains.
 *
 * @param kase The case being evaluated, including its `solution`.
 * @param accusation The player's accusation: chosen suspect plus a free-form
 *   evidence quote.
 * @returns An `AccusationResult` describing whether the accusation is correct
 *   and which required-evidence substrings were matched or missed.
 */
export function evaluateAccusation(kase: Case, accusation: Accusation): AccusationResult {
	const required = kase.solution.requiredEvidence

	if (accusation.suspectId !== kase.solution.murdererId) {
		return {
			isCorrect: false,
			matchedEvidence: [],
			missingEvidence: [...required]
		}
	}

	const evidenceLower = accusation.evidence.toLowerCase()
	const matchedEvidence: string[] = []
	const missingEvidence: string[] = []

	for (const keyword of required) {
		if (evidenceLower.includes(keyword.toLowerCase())) {
			matchedEvidence.push(keyword)
		} else {
			missingEvidence.push(keyword)
		}
	}

	return {
		isCorrect: missingEvidence.length === 0,
		matchedEvidence,
		missingEvidence
	}
}
