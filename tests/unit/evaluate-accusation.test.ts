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
			evidence:
				'Henry was sleeping with Adrien Cole and there is a bloodstained shirt in his garage.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: true,
			matchedEvidence: ['Henry', 'Adrien', 'shirt'],
			missingEvidence: []
		})
	})

	it('matches evidence keywords case-insensitively', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence: 'HENRY was paying ADRIEN, and the SHIRT is in the garage.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: true,
			matchedEvidence: ['Henry', 'Adrien', 'shirt'],
			missingEvidence: []
		})
	})

	it('returns isCorrect=false when one required keyword is missing', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence: 'Henry killed her because of his arrangement with Adrien Cole.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: false,
			matchedEvidence: ['Henry', 'Adrien'],
			missingEvidence: ['shirt']
		})
	})

	it('still returns isCorrect=true when extra unrelated text surrounds the keywords', () => {
		const accusation: Accusation = {
			suspectId: murdererId,
			evidence:
				'I think the critic is anxious, and frankly his alibi about being home all evening is shaky. ' +
				'Henry found out Helena was about to expose his deal with Adrien Cole, and the bloodstained ' +
				'shirt is still hidden in his garage \u2014 he could not bring himself to dispose of it.'
		}

		const result = evaluateAccusation(caseSohoGallery, accusation)

		expect(result).toEqual({
			isCorrect: true,
			matchedEvidence: ['Henry', 'Adrien', 'shirt'],
			missingEvidence: []
		})
	})

	it('returns isCorrect=false with full missingEvidence when accusing the wrong suspect even if keywords are present', () => {
		const accusation: Accusation = {
			suspectId: 'marcus',
			evidence:
				'Henry was sleeping with Adrien Cole and there is a bloodstained shirt in his garage.'
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
			suspectId: 'marcus',
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
			evidence:
				'Henry was sleeping with Adrien Cole and there is a bloodstained shirt in his garage.'
		}

		const result1 = evaluateAccusation(caseSohoGallery, accusation)
		const result2 = evaluateAccusation(caseSohoGallery, accusation)

		expect(result1).not.toBeNull()
		expect(result2).not.toBeNull()
		expect(result1).toEqual(result2)
	})
})
