import { Button } from '@/components/ui/button'
import { SuspectCard } from '@/features/briefing/suspect-card'
import type { Case } from '@/lib/game/types'

interface BriefingScreenProps {
	kase: Case
	onBegin: () => void
}

export function BriefingScreen({ kase, onBegin }: BriefingScreenProps) {
	const paragraphs = kase.premise.split('\n\n').filter((p) => p.length > 0)

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
			<h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
				{kase.title}
			</h1>

			<div className="flex flex-col gap-4 text-base leading-relaxed text-foreground">
				{paragraphs.map((paragraph, index) => (
					<p key={index}>{paragraph}</p>
				))}
			</div>

			<section className="flex flex-col gap-4">
				<h2 className="text-xl font-semibold text-foreground">Suspects</h2>
				<div className="flex flex-col gap-3">
					{kase.suspects.map((suspect) => (
						<SuspectCard key={suspect.id} suspect={suspect} />
					))}
				</div>
			</section>

			<p className="text-sm text-muted-foreground">
				Question suspects. Find contradictions. Accuse the murderer with evidence.
			</p>

			<div>
				<Button onClick={onBegin} size="lg">
					Begin investigation
				</Button>
			</div>
		</div>
	)
}
