'use client'

import { Button } from '@/components/ui/button'
import { TypingIndicator } from '@/features/interrogation/typing-indicator'
import { cn } from '@/lib/utils'
import { useGameStore, type Message } from '@/stores/game'

interface ChatViewProps {
	suspectName: string
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

export function ChatView({ suspectName, error, onRetry }: ChatViewProps) {
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
				<div className="flex flex-1 items-center justify-center">
					<p className="text-base italic text-muted-foreground font-sans">
						Ask {suspectName} your first question…
					</p>
				</div>
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
										? 'bg-primary font-sans text-primary-foreground'
										: 'bg-muted font-mono text-foreground'
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
