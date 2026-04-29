'use client'

import { useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface MessageInputProps {
	onSend: (content: string) => void
	disabled?: boolean
}

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
			className="flex items-end gap-2 border-t border-border bg-background px-6 py-4"
			onSubmit={(event) => {
				event.preventDefault()
				submit()
			}}
		>
			<Textarea
				value={value}
				onChange={(event) => setValue(event.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Ask the suspect a question…"
				rows={1}
				disabled={disabled}
				className="max-h-40 flex-1"
				aria-label="Question for the suspect"
			/>
			<Button type="submit" size="lg" disabled={!canSend}>
				Send
			</Button>
		</form>
	)
}
