import { describe, expect, it } from 'vitest'

import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { evaluateAccusation } from '@/lib/game/evaluate-accusation'
import type { Accusation } from '@/lib/game/types'

const murdererId = caseSohoGallery.solution.murdererId
const requiredEvidence = caseSohoGallery.solution.requiredEvidence

describe('evaluateAccusation', () => {
	it('returns isCorrect=true when suspect matches and all evidence keywords are present', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence: 'A witness saw his car parked near the gallery at 21:30.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: true,
			matchedEvidence: ['car', 'gallery', '21:30'],
			missingEvidence: []
		})
	})

	it('matches evidence keywords case-insensitively', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence: 'The CAR was at the GALLERY around 21:30.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: true,
			matchedEvidence: ['car', 'gallery', '21:30'],
			missingEvidence: []
		})
	})

	it('returns isCorrect=false when one required keyword is missing', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence: 'His car was seen at the gallery that night.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: false,
			matchedEvidence: ['car', 'gallery'],
			missingEvidence: ['21:30']
		})
	})

	it('still returns isCorrect=true when extra unrelated text surrounds the keywords', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence:
				'I think the painter is nervous, and frankly his alibi about Hackney is shaky. ' +
				'A neighbour spotted his car on Greek Street near the gallery around 21:30, ' +
				'which contradicts everything he told us.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: true,
			matchedEvidence: ['car', 'gallery', '21:30'],
			missingEvidence: []
		})
	})

	it('returns isCorrect=false with full missingEvidence when accusing the wrong suspect even if keywords are present', () => {
		const accusation: Accusation = {
			suspectId: 'fake-suspect-id',
			evidence: 'A witness saw his car parked near the gallery at 21:30.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: false,
			matchedEvidence: [],
			missingEvidence: [...requiredEvidence]
		})
	})

	it('returns isCorrect=false with full missingEvidence when accusing the wrong suspect with no keywords', () => {
		const accusation: Accusation = {
			suspectId: 'fake-suspect-id',
			evidence: 'Just a hunch, really.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: false,
			matchedEvidence: [],
			missingEvidence: [...requiredEvidence]
		})
	})

	it('returns isCorrect=false with full missingEvidence when evidence is empty even with the correct suspect', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence: ''
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: false,
			matchedEvidence: [],
			missingEvidence: [...requiredEvidence]
		})
	})

	it('is deterministic — repeated calls with identical inputs produce equal results', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence: 'A witness saw his car parked near the gallery at 21:30.'
		}

		const result1 = evaluateAccusation(caseSohoGallery, accusation)
		const result2 = evaluateAccusation(caseSohoGallery, accusation)

		expect(result1).not.toBeNull()
		expect(result2).not.toBeNull()
		expect(result1).toEqual(result2)
	})
})
