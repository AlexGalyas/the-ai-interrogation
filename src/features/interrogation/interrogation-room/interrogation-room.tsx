'use client'

import { ChatView } from '@/features/interrogation/chat-view'
import { MessageInput } from '@/features/interrogation/message-input'
import { useInterrogate } from '@/features/interrogation/use-interrogate'
import type { Suspect } from '@/lib/game/types'
import { useGameStore } from '@/stores/game'

interface InterrogationRoomProps {
	suspect: Suspect
}

export function InterrogationRoom({ suspect }: InterrogationRoomProps) {
	const isStreaming = useGameStore((state) => state.isStreaming)
	const { ask, retry } = useInterrogate(suspect.id)

	return (
		<div data-suspect-id={suspect.id} className="flex min-h-0 flex-1 flex-col">
			<ChatView onRetry={retry} />
			<MessageInput onSend={ask} disabled={isStreaming} />
		</div>
	)
}
