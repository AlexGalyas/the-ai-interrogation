import { beforeEach, describe, expect, it } from 'vitest'

import { useGameStore } from '@/stores/game'

const initialState = useGameStore.getState()

beforeEach(() => {
	useGameStore.setState(
		{
			...initialState,
			messages: [],
			isStreaming: false,
			error: null
		},
		true
	)
})

describe('useGameStore', () => {
	it('starts with empty messages, not streaming, no error', () => {
		const state = useGameStore.getState()
		expect(state.messages).toEqual([])
		expect(state.isStreaming).toBe(false)
		expect(state.error).toBeNull()
	})

	it('appendUserMessage adds a user message with generated id', () => {
		useGameStore.getState().appendUserMessage('Where were you Tuesday?')
		const { messages } = useGameStore.getState()
		expect(messages).toHaveLength(1)
		expect(messages[0]).toMatchObject({
			role: 'user',
			content: 'Where were you Tuesday?'
		})
		expect(typeof messages[0].id).toBe('string')
		expect(messages[0].id.length).toBeGreaterThan(0)
	})

	it('startAssistantMessage appends an empty assistant message and flips isStreaming on', () => {
		const id = useGameStore.getState().startAssistantMessage()
		const { messages, isStreaming } = useGameStore.getState()
		expect(messages).toHaveLength(1)
		expect(messages[0]).toEqual({ id, role: 'assistant', content: '' })
		expect(isStreaming).toBe(true)
	})

	it('appendToAssistantMessage appends only to the matching message', () => {
		const { appendUserMessage, startAssistantMessage, appendToAssistantMessage } =
			useGameStore.getState()
		appendUserMessage('hi')
		const id = startAssistantMessage()
		appendToAssistantMessage(id, 'Hel')
		appendToAssistantMessage(id, 'lo.')

		const { messages } = useGameStore.getState()
		expect(messages.map((m) => m.content)).toEqual(['hi', 'Hello.'])
	})

	it('finishStreaming flips isStreaming off', () => {
		useGameStore.getState().startAssistantMessage()
		useGameStore.getState().finishStreaming()
		expect(useGameStore.getState().isStreaming).toBe(false)
	})

	it('setError stores the error and stops streaming', () => {
		useGameStore.getState().startAssistantMessage()
		useGameStore.getState().setError('Network down')
		const state = useGameStore.getState()
		expect(state.error).toBe('Network down')
		expect(state.isStreaming).toBe(false)
	})

	it('retry clears the error and removes a trailing empty assistant message', () => {
		const { appendUserMessage, startAssistantMessage, setError, retry } =
			useGameStore.getState()
		appendUserMessage('question')
		startAssistantMessage()
		setError('boom')

		retry()

		const state = useGameStore.getState()
		expect(state.error).toBeNull()
		expect(state.messages).toHaveLength(1)
		expect(state.messages[0]).toMatchObject({ role: 'user', content: 'question' })
	})

	it('retry preserves a non-empty trailing assistant message', () => {
		const { appendUserMessage, startAssistantMessage, appendToAssistantMessage, retry } =
			useGameStore.getState()
		appendUserMessage('question')
		const id = startAssistantMessage()
		appendToAssistantMessage(id, 'partial reply')

		retry()

		const { messages } = useGameStore.getState()
		expect(messages).toHaveLength(2)
		expect(messages[1].content).toBe('partial reply')
	})
})
