'use client'

import { Button } from '@/components/ui/button'
import { ChatMessage } from '@/features/interrogation/chat-message'
import { useGameStore, type Message } from '@/stores/game'

interface ChatViewProps {
	suspectName: string
	error: string | null
	onRetry: () => void
}

const EMPTY_MESSAGES: Message[] = []

export function ChatView({ suspectName, error, onRetry }: ChatViewProps) {
	const suspectId = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		return progress?.activeSuspectId
	})
	const messages =
		useGameStore((state) => {
			const progress = state.progressByCase[state.currentCaseId]
			return progress?.messagesBySuspect[progress.activeSuspectId]
		}) ?? EMPTY_MESSAGES

	const isEmpty = messages.length === 0 && !error

	return (
		<div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
			{isEmpty ? (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-base italic text-muted-foreground font-sans">
						Ask {suspectName} your first question…
					</p>
				</div>
			) : (
				<>
					{suspectId &&
						messages.map((message) => (
							<ChatMessage
								key={message.id}
								suspectId={suspectId}
								messageId={message.id}
							/>
						))}

					{error && (
						<div role="alert" className="flex w-full justify-center">
							<div className="flex max-w-[80%] flex-col items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								<span>{error}</span>
								<Button type="button" size="sm" variant="outline" onClick={onRetry}>
									Retry
								</Button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}
