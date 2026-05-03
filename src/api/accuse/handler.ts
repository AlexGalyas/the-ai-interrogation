import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { evaluateAccusation } from '@/lib/game/evaluate-accusation'
import type { AccusationResult } from '@/lib/game/types'

import type { AccuseRequest } from '@/api/accuse/schema'

/**
 * Handles an accusation request server-side. Looks up the active case, runs
 * `evaluateAccusation` against the player's submission, and returns the
 * verdict plus matched/missing evidence keywords.
 *
 * Lives server-side so the case `solution` (murderer ID + required evidence
 * keywords + truth explanation) never reaches the client. See ADR-0014.
 *
 * @param request Validated accusation payload.
 * @returns The accusation verdict.
 */
export function handle(request: AccuseRequest): AccusationResult {
	return evaluateAccusation(caseSohoGallery, {
		suspectId: request.suspectId,
		evidence: request.evidence
	})
}
