import { describe, expect, it } from 'vitest'

import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { buildSuspectPrompt } from '@/lib/game/build-suspect-prompt'
import type { Suspect } from '@/lib/game/types'

const marcus = caseSohoGallery.suspects[0]
const henry = caseSohoGallery.suspects[1]

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

	it('embeds string-form triggerHint verbatim for single-fact suspects', () => {
		const prompt = buildSuspectPrompt(marcus, caseSohoGallery)
		expect(marcus.crackPoint).toBeDefined()
		const trigger = marcus.crackPoint!.triggerHint
		expect(typeof trigger).toBe('string')
		expect(prompt).toContain(trigger as string)
	})

	it('renders conjunctive triggerHint with every fact and the discrimination rules', () => {
		const prompt = buildSuspectPrompt(henry, caseSohoGallery)
		expect(henry.crackPoint).toBeDefined()
		const trigger = henry.crackPoint!.triggerHint
		expect(typeof trigger).toBe('object')
		if (typeof trigger === 'string') throw new Error('expected conjunctive form')
		for (const fact of trigger.all) {
			expect(prompt).toContain(fact)
		}
		if (trigger.description) {
			expect(prompt).toContain(trigger.description)
		}
		expect(prompt).toContain('Single-fact resistance')
		expect(prompt).toContain('No accumulated specificity')
		expect(prompt).toContain('No proactive volunteering')
		expect(prompt).toContain('ALL facts together is the ONLY trigger')
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

		const marcusTrigger = marcus.crackPoint!.triggerHint
		expect(typeof marcusTrigger).toBe('string')
		expect(prompt).not.toContain(marcusTrigger as string)
		expect(prompt).not.toMatch(/break condition/i)
		expect(prompt).not.toMatch(/break[\s-]*condition\s*:?\s*none/i)
	})
})
