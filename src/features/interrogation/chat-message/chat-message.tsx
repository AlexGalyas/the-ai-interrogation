'use client'

import { JitteringText } from '@/components/jittering-text'
import { TypingIndicator } from '@/features/interrogation/typing-indicator'
import { useTypewriter } from '@/features/interrogation/use-typewriter'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game'

interface ChatMessageProps {
	suspectId: string
	messageId: string
	/**
	 * True only for the most recent assistant message in the conversation.
	 * Jitter is applied exclusively to this one — past replies were recorded at
	 * earlier nervousness levels and shouldn't retroactively start shaking when
	 * the player presses a trigger word now (per maintainer feedback during W4
	 * QA / spec §7.5 revision).
	 */
	isLatestAssistant: boolean
}

export function ChatMessage({ suspectId, messageId, isLatestAssistant }: ChatMessageProps) {
	const message = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		return progress?.messagesBySuspect[suspectId]?.find((m) => m.id === messageId)
	})
	const isStreaming = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		return progress?.isStreamingBySuspect[suspectId] ?? false
	})
	const nervousness = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		return progress?.nervousnessBySuspect[suspectId] ?? 0
	})
	const skipTypewriter = useGameStore((state) => state.skipTypewriter)

	useTypewriter(suspectId, messageId)

	if (!message) return null

	const isAssistant = message.role === 'assistant'
	const isUser = message.role === 'user'
	const showTypingIndicator = isAssistant && isStreaming && message.content.length === 0
	const showSkip =
		isAssistant && message.displayedContent.length < message.content.length
	const renderedContent = isUser ? message.content : message.displayedContent

	return (
		<div
			className={cn(
				'flex w-full',
				isUser ? 'justify-end' : 'justify-start'
			)}
		>
			{/*
			 * Bubble + Skip live in a column wrapper so Skip sits below the
			 * bubble's bottom-left, anchored to that corner regardless of how the
			 * bubble's width changes as the typewriter fills in chars. The
			 * `max-w-[80%]` moved up here so the column (not the bubble) is the
			 * width-bounded element. Task 8 sensory QA: Skip used to migrate
			 * horizontally as the bubble grew while wrapping wasn't yet hit.
			 */}
			<div
				className={cn(
					'flex max-w-[80%] flex-col gap-1',
					isUser ? 'items-end' : 'items-start'
				)}
			>
				<div
					className={cn(
						'whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed',
						isUser
							? 'bg-primary font-sans text-primary-foreground'
							: 'bg-muted font-mono text-foreground'
					)}
				>
					{showTypingIndicator ? (
						<TypingIndicator />
					) : isAssistant && isLatestAssistant ? (
						<JitteringText nervousness={nervousness}>{renderedContent}</JitteringText>
					) : (
						renderedContent
					)}
				</div>

				{showSkip && (
					<button
						type="button"
						onClick={() => skipTypewriter(suspectId, messageId)}
						className="rounded-md border border-border/60 bg-transparent px-3 py-1.5 text-sm font-sans text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
					>
						Skip
					</button>
				)}
			</div>
		</div>
	)
}
