import { InitialAvatar } from '@/components/initial-avatar'
import type { PublicSuspect } from '@/lib/game/types'

interface SuspectCardProps {
	suspect: PublicSuspect
}

export function SuspectCard({ suspect }: SuspectCardProps) {
	return (
		<div className="flex gap-4 rounded-lg border border-border p-4">
			<InitialAvatar name={suspect.name} size="md" />
			<div className="flex min-w-0 flex-col justify-center">
				<p className="font-semibold text-foreground">{suspect.name}</p>
				<p className="text-sm text-muted-foreground">{suspect.oneLiner}</p>
			</div>
		</div>
	)
}
