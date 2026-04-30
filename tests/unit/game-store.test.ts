import { beforeEach, describe, expect, it } from 'vitest'

import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { STORAGE_KEY, deriveScreen, useGameStore } from '@/stores/game'

const CASE_ID = caseSohoGallery.id
const MARCUS_ID = caseSohoGallery.suspects[0].id

beforeEach(() => {
	useGameStore.setState({
		currentCaseId: CASE_ID,
		progressByCase: {}
	})
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(STORAGE_KEY)
	}
})

describe('useGameStore', () => {
	it('starts with the default case id and no per-case progress', () => {
		const state = useGameStore.getState()
		expect(state.currentCaseId).toBe(CASE_ID)
		expect(state.progressByCase).toEqual({})
	})

	it('getCurrentProgress throws before beginInvestigation', () => {
		expect(() => useGameStore.getState().getCurrentProgress()).toThrow(/No progress/)
	})

	it('beginInvestigation creates blank progress with hasBegun=true and the first suspect active', () => {
		useGameStore.getState().beginInvestigation(CASE_ID)
		const progress = useGameStore.getState().getCurrentProgress()
		expect(progress.hasBegun).toBe(true)
		expect(progress.activeSuspectId).toBe(MARCUS_ID)
		expect(progress.accusation).toBeNull()
		expect(progress.messagesBySuspect).toEqual({})
		expect(progress.isStreamingBySuspect).toEqual({})
	})

	it('beginInvestigation preserves existing progress on subsequent calls', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		store.appendUserMessage(MARCUS_ID, 'hello')
		store.beginInvestigation(CASE_ID)
		const progress = useGameStore.getState().getCurrentProgress()
		expect(progress.messagesBySuspect[MARCUS_ID]).toHaveLength(1)
		expect(progress.hasBegun).toBe(true)
	})

	it('appendUserMessage appends to the right suspect', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		store.appendUserMessage(MARCUS_ID, 'Where were you Tuesday?')
		const messages = useGameStore.getState().getActiveMessages()
		expect(messages).toHaveLength(1)
		expect(messages[0]).toMatchObject({ role: 'user', content: 'Where were you Tuesday?' })
	})

	it('startAssistantMessage adds an empty assistant message and flips per-suspect streaming on', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		const id = store.startAssistantMessage(MARCUS_ID)
		const progress = useGameStore.getState().getCurrentProgress()
		expect(progress.messagesBySuspect[MARCUS_ID]).toEqual([
			{ id, role: 'assistant', content: '' }
		])
		expect(progress.isStreamingBySuspect[MARCUS_ID]).toBe(true)
	})

	it('appendToAssistantMessage appends only to the matching message', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		store.appendUserMessage(MARCUS_ID, 'hi')
		const id = store.startAssistantMessage(MARCUS_ID)
		store.appendToAssistantMessage(MARCUS_ID, id, 'Hel')
		store.appendToAssistantMessage(MARCUS_ID, id, 'lo.')
		const messages = useGameStore.getState().getActiveMessages()
		expect(messages.map((m) => m.content)).toEqual(['hi', 'Hello.'])
	})

	it('finishStreaming flips per-suspect streaming off', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		store.startAssistantMessage(MARCUS_ID)
		store.finishStreaming(MARCUS_ID)
		const progress = useGameStore.getState().getCurrentProgress()
		expect(progress.isStreamingBySuspect[MARCUS_ID]).toBe(false)
	})

	it('submitAccusation persists the accusation with timestamp', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		store.submitAccusation(
			{ suspectId: MARCUS_ID, evidence: 'his car at the gallery at 21:30' },
			{
				isCorrect: true,
				matchedEvidence: ['car', 'gallery', '21:30'],
				missingEvidence: []
			}
		)
		const progress = useGameStore.getState().getCurrentProgress()
		expect(progress.accusation).not.toBeNull()
		expect(progress.accusation?.suspectId).toBe(MARCUS_ID)
		expect(progress.accusation?.result.isCorrect).toBe(true)
		expect(typeof progress.accusation?.submittedAt).toBe('string')
	})

	it('resetCurrentCase wipes the current case progress and unsets hasBegun', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		store.appendUserMessage(MARCUS_ID, 'hi')
		store.submitAccusation(
			{ suspectId: MARCUS_ID, evidence: 'x' },
			{
				isCorrect: false,
				matchedEvidence: [],
				missingEvidence: ['car', 'gallery', '21:30']
			}
		)
		store.resetCurrentCase()
		const progress = useGameStore.getState().getCurrentProgress()
		expect(progress.hasBegun).toBe(false)
		expect(progress.accusation).toBeNull()
		expect(progress.messagesBySuspect).toEqual({})
		expect(progress.activeSuspectId).toBe(MARCUS_ID)
	})
})

describe('deriveScreen', () => {
	it('returns briefing when progress is undefined', () => {
		expect(deriveScreen(undefined)).toBe('briefing')
	})

	it('returns briefing when not begun', () => {
		expect(
			deriveScreen({
				hasBegun: false,
				messagesBySuspect: {},
				isStreamingBySuspect: {},
				activeSuspectId: MARCUS_ID,
				accusation: null
			})
		).toBe('briefing')
	})

	it('returns investigation when begun without accusation', () => {
		expect(
			deriveScreen({
				hasBegun: true,
				messagesBySuspect: {},
				isStreamingBySuspect: {},
				activeSuspectId: MARCUS_ID,
				accusation: null
			})
		).toBe('investigation')
	})

	it('returns outcome once an accusation is submitted', () => {
		expect(
			deriveScreen({
				hasBegun: true,
				messagesBySuspect: {},
				isStreamingBySuspect: {},
				activeSuspectId: MARCUS_ID,
				accusation: {
					suspectId: MARCUS_ID,
					evidence: 'x',
					result: { isCorrect: false, matchedEvidence: [], missingEvidence: [] },
					submittedAt: '2026-04-30T00:00:00Z'
				}
			})
		).toBe('outcome')
	})
})
