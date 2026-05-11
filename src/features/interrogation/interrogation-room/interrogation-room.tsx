'use client'

import { useEffect } from 'react'

import { ChatView } from '@/features/interrogation/chat-view'
import { MessageInput } from '@/features/interrogation/message-input'
import { useInterrogate } from '@/features/interrogation/use-interrogate'
import type { PublicSuspect } from '@/lib/game/types'
import { useGameStore } from '@/stores/game'

interface InterrogationRoomProps {
	suspect: PublicSuspect
	caseId: string
}

export function InterrogationRoom({ suspect, caseId }: InterrogationRoomProps) {
	const beginInvestigation = useGameStore((state) => state.beginInvestigation)
	const { ask, retry, error, isStreaming } = useInterrogate(suspect.id)

	useEffect(() => {
		void useGameStore.persist.rehydrate()
		beginInvestigation(caseId)
	}, [beginInvestigation, caseId])

	return (
		<div
			data-suspect-id={suspect.id}
			className="flex min-h-0 flex-1 flex-col overflow-hidden"
		>
			<ChatView suspectName={suspect.name} error={error} onRetry={retry} />
			<MessageInput onSend={ask} disabled={isStreaming} />
		</div>
	)
}
