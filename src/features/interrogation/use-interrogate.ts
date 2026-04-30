'use client'

import { useState } from 'react'

import { useGameStore } from '@/stores/game'

const API_ERROR_MESSAGE = 'The suspect is silent... try again.'
const CONNECTION_LOST_SUFFIX = '\n\n(connection lost)'

interface ApiMessage {
	role: 'user' | 'assistant'
	content: string
}

function snapshotMessages(suspectId: string): ApiMessage[] {
	const state = useGameStore.getState()
	const progress = state.progressByCase[state.currentCaseId]
	const messages = progress?.messagesBySuspect[suspectId] ?? []
	return messages
		.filter((m) => m.content.length > 0)
		.map((m) => ({ role: m.role, content: m.content }))
}

function readIsStreaming(suspectId: string): boolean {
	const state = useGameStore.getState()
	const progress = state.progressByCase[state.currentCaseId]
	return progress?.isStreamingBySuspect[suspectId] ?? false
}

async function streamInto(
	response: Response,
	suspectId: string,
	assistantId: string
): Promise<{ receivedAny: boolean; error: unknown }> {
	if (!response.body) {
		return { receivedAny: false, error: new Error('No response body') }
	}

	const reader = response.body.getReader()
	const decoder = new TextDecoder()
	let receivedAny = false
	const { appendToAssistantMessage } = useGameStore.getState()

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break
			if (value && value.byteLength > 0) {
				const text = decoder.decode(value, { stream: true })
				if (text) {
					receivedAny = true
					appendToAssistantMessage(suspectId, assistantId, text)
				}
			}
		}
		const tail = decoder.decode()
		if (tail) {
			receivedAny = true
			appendToAssistantMessage(suspectId, assistantId, tail)
		}
		return { receivedAny, error: null }
	} catch (err) {
		return { receivedAny, error: err }
	}
}

interface UseInterrogateApi {
	ask: (content: string) => Promise<void>
	retry: () => Promise<void>
	error: string | null
	isStreaming: boolean
}

/**
 * Owns the fetch-and-stream side effect for one suspect's interrogation.
 *
 * `ask(content)` appends the user message to the store, snapshots the full
 * conversation for this suspect, then streams the model reply into a
 * freshly-created assistant message slot.
 *
 * `retry()` is for the "API error" path — it clears the local error and
 * re-fires the request with the existing history (no new user message).
 *
 * Streaming state is tracked per-suspect inside the store; the local `error`
 * state is not persisted because errors are transient and meaningless across
 * reloads.
 */
export function useInterrogate(suspectId: string): UseInterrogateApi {
	const [error, setError] = useState<string | null>(null)
	const isStreaming = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		return progress?.isStreamingBySuspect[suspectId] ?? false
	})

	const runRequest = async (messages: ApiMessage[]): Promise<void> => {
		const assistantId = useGameStore.getState().startAssistantMessage(suspectId)

		let response: Response
		try {
			response = await fetch('/api/interrogate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ suspectId, messages })
			})
		} catch {
			useGameStore.getState().finishStreaming(suspectId)
			setError(API_ERROR_MESSAGE)
			return
		}

		if (!response.ok) {
			useGameStore.getState().finishStreaming(suspectId)
			setError(API_ERROR_MESSAGE)
			return
		}

		const { receivedAny, error: streamError } = await streamInto(
			response,
			suspectId,
			assistantId
		)

		if (!streamError) {
			useGameStore.getState().finishStreaming(suspectId)
			return
		}

		if (receivedAny) {
			useGameStore
				.getState()
				.appendToAssistantMessage(suspectId, assistantId, CONNECTION_LOST_SUFFIX)
			useGameStore.getState().finishStreaming(suspectId)
		} else {
			useGameStore.getState().finishStreaming(suspectId)
			setError(API_ERROR_MESSAGE)
		}
	}

	const ask = async (content: string) => {
		if (readIsStreaming(suspectId)) return
		setError(null)
		useGameStore.getState().appendUserMessage(suspectId, content)
		await runRequest(snapshotMessages(suspectId))
	}

	const retry = async () => {
		if (readIsStreaming(suspectId)) return
		setError(null)
		await runRequest(snapshotMessages(suspectId))
	}

	return { ask, retry, error, isStreaming }
}
