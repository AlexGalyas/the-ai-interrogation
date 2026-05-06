import { beforeEach, describe, expect, it } from 'vitest'

import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { STORAGE_KEY, useGameStore } from '@/stores/game'

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

function findMessage(suspectId: string, messageId: string) {
	const messages =
		useGameStore.getState().getCurrentProgress().messagesBySuspect[suspectId] ?? []
	return messages.find((m) => m.id === messageId)
}

function seedAssistantMessage(content: string): string {
	const store = useGameStore.getState()
	store.beginInvestigation(CASE_ID)
	const messageId = store.startAssistantMessage(MARCUS_ID)
	store.appendToAssistantMessage(MARCUS_ID, messageId, content)
	return messageId
}

describe('useGameStore.tick', () => {
	it('advances displayedContent.length by 1 when content has more chars buffered', () => {
		const messageId = seedAssistantMessage('Hello.')
		expect(findMessage(MARCUS_ID, messageId)?.displayedContent).toBe('')

		useGameStore.getState().tick(MARCUS_ID, messageId)
		expect(findMessage(MARCUS_ID, messageId)?.displayedContent).toBe('H')

		useGameStore.getState().tick(MARCUS_ID, messageId)
		expect(findMessage(MARCUS_ID, messageId)?.displayedContent).toBe('He')
	})

	it('is a no-op once displayedContent has caught up to content', () => {
		const messageId = seedAssistantMessage('Hi')
		const store = useGameStore.getState()
		store.tick(MARCUS_ID, messageId)
		store.tick(MARCUS_ID, messageId)
		expect(findMessage(MARCUS_ID, messageId)?.displayedContent).toBe('Hi')

		const before = useGameStore.getState().progressByCase
		store.tick(MARCUS_ID, messageId)
		expect(useGameStore.getState().progressByCase).toBe(before)
	})

	it('handles unknown messageId gracefully (no throw, no state mutation)', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		const before = useGameStore.getState().progressByCase
		expect(() => store.tick(MARCUS_ID, 'no-such-id')).not.toThrow()
		expect(useGameStore.getState().progressByCase).toBe(before)
	})

	it('handles unknown suspectId gracefully (no throw, no state mutation)', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		const before = useGameStore.getState().progressByCase
		expect(() => store.tick('not-a-suspect', 'whatever')).not.toThrow()
		expect(useGameStore.getState().progressByCase).toBe(before)
	})
})

describe('useGameStore.skipTypewriter', () => {
	it('flushes displayedContent to match content immediately', () => {
		const messageId = seedAssistantMessage('Hello, detective.')
		expect(findMessage(MARCUS_ID, messageId)?.displayedContent).toBe('')

		useGameStore.getState().skipTypewriter(MARCUS_ID, messageId)
		const message = findMessage(MARCUS_ID, messageId)
		expect(message?.displayedContent).toBe('Hello, detective.')
		expect(message?.displayedContent).toBe(message?.content)
	})

	it('is a no-op when displayedContent already equals content', () => {
		const messageId = seedAssistantMessage('Hi')
		const store = useGameStore.getState()
		store.skipTypewriter(MARCUS_ID, messageId)

		const before = useGameStore.getState().progressByCase
		store.skipTypewriter(MARCUS_ID, messageId)
		expect(useGameStore.getState().progressByCase).toBe(before)
	})

	it('handles unknown messageId gracefully (no throw, no state mutation)', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		const before = useGameStore.getState().progressByCase
		expect(() => store.skipTypewriter(MARCUS_ID, 'no-such-id')).not.toThrow()
		expect(useGameStore.getState().progressByCase).toBe(before)
	})

	it('handles unknown suspectId gracefully (no throw, no state mutation)', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		const before = useGameStore.getState().progressByCase
		expect(() => store.skipTypewriter('not-a-suspect', 'whatever')).not.toThrow()
		expect(useGameStore.getState().progressByCase).toBe(before)
	})
})

describe('useGameStore message buffer initialisation', () => {
	it('appendUserMessage stores user content with displayedContent equal to content', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		store.appendUserMessage(MARCUS_ID, 'Where were you Tuesday?')
		const messages = useGameStore.getState().getActiveMessages()
		expect(messages).toHaveLength(1)
		expect(messages[0]).toMatchObject({
			role: 'user',
			content: 'Where were you Tuesday?',
			displayedContent: 'Where were you Tuesday?'
		})
	})

	it('startAssistantMessage initialises displayedContent to empty string', () => {
		const store = useGameStore.getState()
		store.beginInvestigation(CASE_ID)
		const messageId = store.startAssistantMessage(MARCUS_ID)
		const message = findMessage(MARCUS_ID, messageId)
		expect(message?.content).toBe('')
		expect(message?.displayedContent).toBe('')
	})

	it('appendToAssistantMessage grows content but leaves displayedContent untouched', () => {
		const messageId = seedAssistantMessage('Hello,')
		expect(findMessage(MARCUS_ID, messageId)?.displayedContent).toBe('')

		useGameStore.getState().appendToAssistantMessage(MARCUS_ID, messageId, ' detective.')
		const message = findMessage(MARCUS_ID, messageId)
		expect(message?.content).toBe('Hello, detective.')
		expect(message?.displayedContent).toBe('')
	})
})
