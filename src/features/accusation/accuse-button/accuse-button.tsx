'use client'

import { Button } from '@/components/ui/button'

interface AccuseButtonProps {
	onClick: () => void
	disabled?: boolean
}

export function AccuseButton({ onClick, disabled = false }: AccuseButtonProps) {
	return (
		<Button
			type="button"
			size="lg"
			onClick={onClick}
			disabled={disabled}
			className="fixed right-6 bottom-6 z-20 shadow-lg"
		>
			Accuse
		</Button>
	)
}
