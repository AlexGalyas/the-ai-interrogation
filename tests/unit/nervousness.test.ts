import { describe, expect, it } from 'vitest'

import {
	NERVOUSNESS_DECAY_FACTOR,
	NERVOUSNESS_MAX,
	applyNervousnessBump,
	applyNervousnessDecay,
	countNervousnessMatches
} from '@/lib/game/nervousness'
import type { NervousnessTriggers } from '@/lib/game/types'

const henryTriggers: NervousnessTriggers = {
	keywords: ['Adrien', 'plagiarism', 'shirt', 'garage', 'blood'],
	increment: 25
}

describe('applyNervousnessBump', () => {
	it('increments by `increment` per matching keyword', () => {
		expect(applyNervousnessBump(0, 'tell me about Adrien', henryTriggers)).toBe(25)
	})

	it('stacks multiple distinct keyword matches in one message', () => {
		expect(
			applyNervousnessBump(
				0,
				'I know about your shirt and the plagiarism scheme',
				henryTriggers
			)
		).toBe(50)
	})

	it('counts a keyword once even if it appears twice in the message', () => {
		expect(applyNervousnessBump(0, 'shirt — yes the shirt', henryTriggers)).toBe(25)
	})

	it('caps at NERVOUSNESS_MAX', () => {
		const noisy = 'shirt plagiarism Adrien garage blood'
		expect(applyNervousnessBump(60, noisy, henryTriggers)).toBe(NERVOUSNESS_MAX)
	})

	it('matches case-insensitively (uppercase player input matches title-case keyword)', () => {
		expect(applyNervousnessBump(0, 'TELL ME ABOUT ADRIEN', henryTriggers)).toBe(25)
	})

	it('matches as substring (`shirt` matches inside `the shirt`)', () => {
		expect(applyNervousnessBump(0, 'about the shirt you owned', henryTriggers)).toBe(25)
	})

	it('returns current value unchanged if no keywords match', () => {
		expect(applyNervousnessBump(40, 'where were you tuesday', henryTriggers)).toBe(40)
	})

	it('returns current value unchanged when triggers are undefined', () => {
		expect(applyNervousnessBump(40, 'shirt', undefined)).toBe(40)
	})
})

describe('countNervousnessMatches', () => {
	it('returns 0 when triggers are undefined', () => {
		expect(countNervousnessMatches('shirt plagiarism', undefined)).toBe(0)
	})

	it('returns the number of distinct matching keywords', () => {
		expect(countNervousnessMatches('shirt and plagiarism', henryTriggers)).toBe(2)
	})

	it('ignores empty-string keywords', () => {
		expect(
			countNervousnessMatches('anything', { keywords: ['', '', ''], increment: 10 })
		).toBe(0)
	})
})

describe('applyNervousnessDecay', () => {
	it('multiplies by 0.8', () => {
		expect(applyNervousnessDecay(60)).toBeCloseTo(48, 5)
	})

	it('uses NERVOUSNESS_DECAY_FACTOR as the multiplier', () => {
		expect(applyNervousnessDecay(50)).toBeCloseTo(50 * NERVOUSNESS_DECAY_FACTOR, 5)
	})

	it('floors residuals below 1 to 0 so values eventually settle at zero', () => {
		expect(applyNervousnessDecay(1)).toBe(0)
		expect(applyNervousnessDecay(0.5)).toBe(0)
		expect(applyNervousnessDecay(0)).toBe(0)
	})

	it('after several decays converges toward 0', () => {
		let value = 60
		for (let i = 0; i < 20; i += 1) {
			value = applyNervousnessDecay(value)
		}
		expect(value).toBe(0)
	})
})
