'use client'

import { Button } from '@/components/ui/button'
import { TypingIndicator } from '@/features/interrogation/typing-indicator'
import { cn } from '@/lib/utils'
import { useGameStore, type Message } from '@/stores/game'

interface ChatViewProps {
	error: string | null
	onRetry: () => void
}

const EMPTY_MESSAGES: Message[] = []

function isPendingAssistant(
	message: Message,
	index: number,
	total: number,
	isStreaming: boolean
): boolean {
	return (
		isStreaming && message.role === 'assistant' && message.content === '' && index === total - 1
	)
}

export function ChatView({ error, onRetry }: ChatViewProps) {
	const messages =
		useGameStore((state) => {
			const progress = state.progressByCase[state.currentCaseId]
			return progress?.messagesBySuspect[progress.activeSuspectId]
		}) ?? EMPTY_MESSAGES
	const isStreaming = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		if (!progress) return false
		return progress.isStreamingBySuspect[progress.activeSuspectId] ?? false
	})

	const isEmpty = messages.length === 0 && !error

	return (
		<div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
			{isEmpty ? (
				<p className="m-auto max-w-sm text-center text-sm text-muted-foreground">
					Begin the interrogation. Ask a question below.
				</p>
			) : (
				<>
					{messages.map((message, index) => (
						<div
							key={message.id}
							className={cn(
								'flex w-full',
								message.role === 'user' ? 'justify-end' : 'justify-start'
							)}
						>
							<div
								className={cn(
									'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed',
									message.role === 'user'
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-foreground'
								)}
							>
								{isPendingAssistant(
									message,
									index,
									messages.length,
									isStreaming
								) ? (
									<TypingIndicator />
								) : (
									message.content
								)}
							</div>
						</div>
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
