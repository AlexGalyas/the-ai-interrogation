'use client'

import { InitialAvatar } from '@/components/initial-avatar'
import type { PublicSuspect } from '@/lib/game/types'
import { cn } from '@/lib/utils'

interface SuspectTabsProps {
	suspects: PublicSuspect[]
	activeSuspectId: string
	onSelect: (suspectId: string) => void
	/** Optional extra classes — `InvestigationScreen` passes `flex-1` so the
	 *  tabs share the header row with the inline Accuse button. */
	className?: string
}

export function SuspectTabs({
	suspects,
	activeSuspectId,
	onSelect,
	className
}: SuspectTabsProps) {
	return (
		<div
			role="tablist"
			aria-label="Suspects"
			className={cn(
				'flex items-stretch gap-2 bg-background px-6',
				className
			)}
		>
			{suspects.map((suspect) => {
				const isActive = suspect.id === activeSuspectId
				return (
					<button
						key={suspect.id}
						type="button"
						role="tab"
						aria-selected={isActive}
						aria-controls={`suspect-panel-${suspect.id}`}
						id={`suspect-tab-${suspect.id}`}
						tabIndex={isActive ? 0 : -1}
						onClick={() => onSelect(suspect.id)}
						className={cn(
							'flex min-w-0 items-center gap-2 border-b-2 px-3 py-3 text-left transition-colors outline-none focus-visible:bg-muted/50',
							isActive
								? 'border-primary text-foreground'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						)}
					>
						<InitialAvatar name={suspect.name} size="sm" />
						<span className="flex min-w-0 flex-col gap-0.5">
							<span
								className={cn(
									'truncate text-sm',
									isActive ? 'font-semibold' : 'font-medium'
								)}
							>
								{suspect.name}
							</span>
							{isActive && (
								<span className="truncate text-xs text-muted-foreground">
									{suspect.oneLiner}
								</span>
							)}
						</span>
					</button>
				)
			})}
		</div>
	)
}
