'use client'

import { TypingIndicator } from '@/features/interrogation/typing-indicator'
import { useTypewriter } from '@/features/interrogation/use-typewriter'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game'

interface ChatMessageProps {
	suspectId: string
	messageId: string
}

export function ChatMessage({ suspectId, messageId }: ChatMessageProps) {
	const message = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		return progress?.messagesBySuspect[suspectId]?.find((m) => m.id === messageId)
	})
	const isStreaming = useGameStore((state) => {
		const progress = state.progressByCase[state.currentCaseId]
		return progress?.isStreamingBySuspect[suspectId] ?? false
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
				'flex w-full items-end gap-2',
				isUser ? 'justify-end' : 'justify-start'
			)}
		>
			<div
				className={cn(
					'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed',
					isUser
						? 'bg-primary font-sans text-primary-foreground'
						: 'bg-muted font-mono text-foreground'
				)}
			>
				{showTypingIndicator ? <TypingIndicator /> : renderedContent}
			</div>

			{showSkip && (
				<button
					type="button"
					onClick={() => skipTypewriter(suspectId, messageId)}
					className="self-end rounded-md border border-border/60 bg-transparent px-2 py-1 text-xs font-sans text-muted-foreground transition-colors hover:border-accent/60 hover:text-accent"
				>
					Skip
				</button>
			)}
		</div>
	)
}
