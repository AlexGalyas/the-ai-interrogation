import type { PublicSuspect } from '@/lib/game/types'

interface SuspectTopBarProps {
	suspect: PublicSuspect
}

function initialsFor(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}

export function SuspectTopBar({ suspect }: SuspectTopBarProps) {
	return (
		<header className="sticky top-0 z-10 flex w-full items-center gap-4 border-b border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
			<div
				aria-hidden
				className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-base font-semibold text-muted-foreground"
			>
				{initialsFor(suspect.name)}
			</div>
			<div className="flex min-w-0 flex-col">
				<h1 className="truncate text-lg font-semibold text-foreground">{suspect.name}</h1>
				<p className="truncate text-sm text-muted-foreground">{suspect.oneLiner}</p>
			</div>
		</header>
	)
}
