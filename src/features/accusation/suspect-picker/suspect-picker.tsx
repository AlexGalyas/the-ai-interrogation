'use client'

import { InitialAvatar } from '@/components/initial-avatar'
import type { PublicSuspect } from '@/lib/game/types'
import { cn } from '@/lib/utils'

interface SuspectPickerProps {
	suspects: PublicSuspect[]
	selectedId: string | null
	onSelect: (suspectId: string) => void
}

export function SuspectPicker({ suspects, selectedId, onSelect }: SuspectPickerProps) {
	return (
		<div role="radiogroup" aria-label="Suspects" className="flex flex-col gap-2">
			{suspects.map((suspect) => {
				const isSelected = suspect.id === selectedId
				return (
					<button
						key={suspect.id}
						type="button"
						role="radio"
						aria-checked={isSelected}
						onClick={() => onSelect(suspect.id)}
						className={cn(
							'flex items-center gap-3 rounded-md border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary',
							isSelected
								? 'border-primary ring-2 ring-primary'
								: 'border-border hover:border-foreground/30'
						)}
					>
						<InitialAvatar name={suspect.name} size="md" />
						<div className="flex min-w-0 flex-col">
							<span className="font-semibold text-foreground">{suspect.name}</span>
							<span className="truncate text-xs text-muted-foreground">
								{suspect.oneLiner}
							</span>
						</div>
					</button>
				)
			})}
		</div>
	)
}
