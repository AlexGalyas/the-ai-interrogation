import { describe, expect, it } from 'vitest'

import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { buildSuspectPrompt } from '@/lib/game/build-suspect-prompt'
import type { Suspect } from '@/lib/game/types'

const marcus = caseSohoGallery.suspects[0]

describe('buildSuspectPrompt', () => {
	it('produces the same output for the same input (deterministic)', () => {
		const a = buildSuspectPrompt(marcus, caseSohoGallery)
		const b = buildSuspectPrompt(marcus, caseSohoGallery)
		expect(a).toBe(b)
	})

	it("contains the suspect's name", () => {
		const prompt = buildSuspectPrompt(marcus, caseSohoGallery)
		expect(prompt).toContain(marcus.name)
	})

	it('contains the publicAlibi text', () => {
		const prompt = buildSuspectPrompt(marcus, caseSohoGallery)
		expect(prompt).toContain(marcus.publicAlibi)
	})

	it('contains the hiddenTruth text', () => {
		const prompt = buildSuspectPrompt(marcus, caseSohoGallery)
		expect(prompt).toContain(marcus.hiddenTruth)
	})

	it('includes every lyingRules entry', () => {
		const prompt = buildSuspectPrompt(marcus, caseSohoGallery)
		for (const rule of marcus.lyingRules) {
			expect(prompt).toContain(rule)
		}
	})

	it('contains the crackPoint.triggerHint', () => {
		const prompt = buildSuspectPrompt(marcus, caseSohoGallery)
		expect(marcus.crackPoint).toBeDefined()
		expect(prompt).toContain(marcus.crackPoint!.triggerHint)
	})

	it('contains the anti-jailbreak section', () => {
		const prompt = buildSuspectPrompt(marcus, caseSohoGallery)
		expect(prompt.toLowerCase()).toContain('never reveal that you are an ai')
	})

	it('omits the break-condition section entirely when the suspect has no crackPoint', () => {
		const suspectWithoutCrack: Suspect = {
			id: 'unbreakable',
			name: 'Test Suspect',
			oneLiner: 'A witness with no secrets to surface.',
			publicAlibi: 'Was at home all evening.',
			hiddenTruth: 'Actually was at home all evening.',
			lyingRules: ['Stays calm.'],
			personality: 'Reserved.'
		}
		const kase = {
			...caseSohoGallery,
			suspects: [suspectWithoutCrack]
		}

		const prompt = buildSuspectPrompt(suspectWithoutCrack, kase)

		expect(prompt).not.toContain(marcus.crackPoint!.triggerHint)
		expect(prompt).not.toMatch(/break condition/i)
		expect(prompt).not.toMatch(/break[\s-]*condition\s*:?\s*none/i)
	})
})
