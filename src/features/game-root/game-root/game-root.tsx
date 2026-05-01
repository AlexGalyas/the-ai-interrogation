'use client'

import { useEffect } from 'react'

import { BriefingScreen } from '@/features/briefing/briefing-screen'
import { InvestigationScreen } from '@/features/interrogation/investigation-screen'
import { OutcomeScreen } from '@/features/outcome/outcome-screen'
import type { Case } from '@/lib/game/types'
import { deriveScreen, useGameStore } from '@/stores/game'

interface GameRootProps {
	kase: Case
}

export function GameRoot({ kase }: GameRootProps) {
	const beginInvestigation = useGameStore((state) => state.beginInvestigation)
	const resetCurrentCase = useGameStore((state) => state.resetCurrentCase)
	const progress = useGameStore((state) => state.progressByCase[kase.id])
	const screen = deriveScreen(progress)

	useEffect(() => {
		void useGameStore.persist.rehydrate()
	}, [])

	if (screen === 'briefing') {
		return (
			<BriefingScreen kase={kase} onBegin={() => beginInvestigation(kase.id)} />
		)
	}

	if (screen === 'investigation') {
		return (
			<InvestigationScreen
				kase={kase}
				onAccuse={() => {
					console.log('accuse')
				}}
			/>
		)
	}

	return (
		<OutcomeScreen kase={kase} onNewInvestigation={() => resetCurrentCase()} />
	)
}
