import { caseSohoGallery } from '@/content/cases/case-01-soho-gallery'
import { getAnthropicClient } from '@/lib/ai/anthropic'
import { buildSuspectPrompt } from '@/lib/game/build-suspect-prompt'
import type { Case, Suspect } from '@/lib/game/types'

import type { InterrogateRequest } from '@/api/interrogate/schema'
import { textStreamFromMessageStream } from '@/api/interrogate/stream'

const MODEL = 'claude-haiku-4-5'
const MAX_TOKENS = 512
const TEMPERATURE = 0.8

export class SuspectNotFoundError extends Error {
	constructor(suspectId: string) {
		super(`Suspect not found: ${suspectId}`)
		this.name = 'SuspectNotFoundError'
	}
}

function findSuspect(kase: Case, suspectId: string): Suspect {
	const suspect = kase.suspects.find((s) => s.id === suspectId)
	if (!suspect) throw new SuspectNotFoundError(suspectId)
	return suspect
}

/**
 * Handles an interrogation request: locates the suspect in the active case,
 * builds the system prompt, and returns a streaming `text/plain` response of
 * the model's reply.
 *
 * Throws `SuspectNotFoundError` if the request's `suspectId` is not present in
 * the loaded case. The caller (route handler) is responsible for translating
 * that into a 404.
 *
 * @param request Validated interrogation request payload.
 * @returns A streaming `Response` whose body is the model's reply text.
 */
export async function handle(request: InterrogateRequest): Promise<Response> {
	const kase = caseSohoGallery
	const suspect = findSuspect(kase, request.suspectId)

	const system = buildSuspectPrompt(suspect, kase)
	const client = getAnthropicClient()

	const messageStream = await client.messages.create({
		model: MODEL,
		max_tokens: MAX_TOKENS,
		temperature: TEMPERATURE,
		stream: true,
		system,
		messages: request.messages
	})

	const body = textStreamFromMessageStream(messageStream)

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store'
		}
	})
}
