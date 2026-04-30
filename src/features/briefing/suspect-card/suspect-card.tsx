import type { Suspect } from '@/lib/game/types'

interface SuspectCardProps {
	suspect: Suspect
}

function initialsFor(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}

export function SuspectCard({ suspect }: SuspectCardProps) {
	return (
		<div className="flex gap-4 rounded-lg border border-border p-4">
			<div
				aria-hidden
				className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted text-lg font-semibold text-muted-foreground"
			>
				{initialsFor(suspect.name)}
			</div>
			<div className="flex min-w-0 flex-col justify-center">
				<p className="font-semibold text-foreground">{suspect.name}</p>
				<p className="text-sm text-muted-foreground">{suspect.oneLiner}</p>
			</div>
		</div>
	)
}
