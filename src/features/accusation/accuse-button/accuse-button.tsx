'use client'

import { Button } from '@/components/ui/button'

interface AccuseButtonProps {
	onClick: () => void
	disabled?: boolean
}

/**
 * Inline header-mounted accusation trigger. Used to be fixed bottom-right with
 * a drop shadow; Task 8 sensory QA moved it inline into the
 * `InvestigationScreen` header so it's always reachable without the bottom
 * gesture-area overlapping the message input.
 */
export function AccuseButton({ onClick, disabled = false }: AccuseButtonProps) {
	return (
		<Button type="button" size="default" onClick={onClick} disabled={disabled}>
			Accuse
		</Button>
	)
}
