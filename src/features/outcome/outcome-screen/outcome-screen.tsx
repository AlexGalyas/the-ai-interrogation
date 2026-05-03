'use client'

import { Button } from '@/components/ui/button'
import type { PublicCase } from '@/lib/game/types'
import { useGameStore } from '@/stores/game'

interface OutcomeScreenProps {
	kase: PublicCase
	onNewInvestigation: () => void
}

export function OutcomeScreen({ kase, onNewInvestigation }: OutcomeScreenProps) {
	const accusation = useGameStore(
		(state) => state.progressByCase[kase.id]?.accusation
	)
	const getQuestionsAskedCount = useGameStore(
		(state) => state.getQuestionsAskedCount
	)

	if (!accusation) {
		return (
			<div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12">
				<p className="text-base text-foreground">
					No accusation found. Please return to briefing.
				</p>
				<Button
					onClick={onNewInvestigation}
					size="lg"
					className="w-full min-w-[200px] sm:w-auto"
				>
					New investigation
				</Button>
			</div>
		)
	}

	const isWin = accusation.result.isCorrect
	const heading = isWin ? 'Case closed.' : 'Case unsolved.'
	const subhead = isWin
		? 'You found the murderer.'
		: "Your accusation didn't hold up."
	const questionsAskedCount = getQuestionsAskedCount()

	return (
		<div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
			<div className="flex flex-col gap-3">
				<h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
					{heading}
				</h1>
				<p className="text-base text-foreground">{subhead}</p>
			</div>

			{isWin && (
				<p className="text-sm text-muted-foreground">
					Questions asked: {questionsAskedCount}
				</p>
			)}

			<Button
				onClick={onNewInvestigation}
				size="lg"
				className="w-full min-w-[200px] sm:w-auto"
			>
				New investigation
			</Button>
		</div>
	)
}
