import { AudioToggle } from '@/components/audio-toggle'
import { MotionToggle } from '@/components/motion-toggle'
import { Button } from '@/components/ui/button'
import { SuspectCard } from '@/features/briefing/suspect-card'
import type { PublicCase } from '@/lib/game/types'

interface BriefingScreenProps {
	kase: PublicCase
	onBegin: () => void
}

export function BriefingScreen({ kase, onBegin }: BriefingScreenProps) {
	const paragraphs = kase.premise.split('\n\n').filter((p) => p.length > 0)

	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
			<h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
				{kase.title}
			</h1>

			<div className="max-w-prose font-serif text-lg leading-relaxed text-foreground">
				{paragraphs.map((paragraph, index) => (
					<p key={index} className="mb-4 last:mb-0">
						{paragraph}
					</p>
				))}
			</div>

			<section className="flex flex-col">
				<h2 className="mb-4 font-sans text-sm uppercase tracking-wider text-muted-foreground">
					Suspects
				</h2>
				<div className="flex flex-col gap-3">
					{kase.suspects.map((suspect) => (
						<SuspectCard key={suspect.id} suspect={suspect} />
					))}
				</div>
			</section>

			<p className="mb-6 mt-8 text-center font-sans text-sm italic text-muted-foreground">
				Question suspects. Find contradictions. Accuse the murderer with evidence.
			</p>

			<div className="flex justify-center">
				<Button onClick={onBegin} size="lg" className="w-full min-w-[240px] md:w-auto">
					Begin investigation
				</Button>
			</div>

			<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
				<AudioToggle />
				<MotionToggle />
			</div>
		</div>
	)
}
