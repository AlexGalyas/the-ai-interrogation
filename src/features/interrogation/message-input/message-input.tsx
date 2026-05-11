'use client'

import { useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MessageInputProps {
	onSend: (content: string) => void
	disabled?: boolean
}

/**
 * Footer-pinned message composer. Textarea autosizes from one row to a
 * `max-h-40` cap via `field-sizing-content` (shadcn Textarea baseline); no
 * manual resize handle. Send lives anchored to the textarea's bottom-right
 * corner so the composer reads as one unified surface rather than a
 * textarea-plus-button row. Task 8 sensory QA.
 */
export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
	const [value, setValue] = useState('')

	const trimmed = value.trim()
	const canSend = trimmed.length > 0 && !disabled

	const submit = () => {
		if (!canSend) return
		onSend(trimmed)
		setValue('')
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			submit()
		}
	}

	return (
		<form
			className="shrink-0 border-t border-border bg-background px-6 py-4"
			onSubmit={(event) => {
				event.preventDefault()
				submit()
			}}
		>
			<div className="relative">
				<Textarea
					value={value}
					onChange={(event) => setValue(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="What do you want to ask?"
					rows={1}
					disabled={disabled}
					className="max-h-40 min-h-0 resize-none pr-24"
					aria-label="Question for the suspect"
				/>
				<Button
					type="submit"
					size="sm"
					disabled={!canSend}
					className="absolute right-1.25 bottom-1.25"
				>
					Send
				</Button>
			</div>
		</form>
	)
}
