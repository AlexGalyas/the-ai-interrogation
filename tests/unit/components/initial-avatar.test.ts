import { describe, expect, it } from 'vitest'

import { computeInitials, hashToHue } from '@/components/initial-avatar/utils'

describe('computeInitials', () => {
	it('returns first letters of first two tokens, uppercased', () => {
		expect(computeInitials('Marcus Reeve')).toBe('MR')
	})

	it('returns the single initial when only one token is present', () => {
		expect(computeInitials('Marcus')).toBe('M')
	})

	it('trims surrounding whitespace and collapses internal runs', () => {
		expect(computeInitials('  Marcus   Reeve  ')).toBe('MR')
	})

	it('returns "?" for an empty string', () => {
		expect(computeInitials('')).toBe('?')
	})

	it('returns "?" for whitespace-only input', () => {
		expect(computeInitials('   ')).toBe('?')
	})

	it('uses only the first two tokens for longer names', () => {
		expect(computeInitials('Helena Voss-Becker')).toBe('HV')
	})

	it('uppercases lowercase initials', () => {
		expect(computeInitials('helena voss')).toBe('HV')
	})
})

describe('hashToHue', () => {
	it('is deterministic for the same input', () => {
		expect(hashToHue('Marcus Reeve')).toBe(hashToHue('Marcus Reeve'))
	})

	it('produces different hues for different names (sanity)', () => {
		expect(hashToHue('Marcus Reeve')).not.toBe(hashToHue('Helena Voss'))
	})

	it('always returns a value in [0, 359]', () => {
		const samples = [
			'',
			'A',
			'Marcus Reeve',
			'Helena Voss',
			'Henry Vogel',
			'a-very-long-suspect-name-with-many-characters'
		]
		for (const sample of samples) {
			const hue = hashToHue(sample)
			expect(hue).toBeGreaterThanOrEqual(0)
			expect(hue).toBeLessThanOrEqual(359)
		}
	})
})
