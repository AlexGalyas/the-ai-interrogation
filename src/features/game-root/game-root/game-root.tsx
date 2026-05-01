'use client'

import { useEffect, useState } from 'react'

import { AccusationModal } from '@/features/accusation/accusation-modal'
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
	const [accusationOpen, setAccusationOpen] = useState(false)

	useEffect(() => {
		void useGameStore.persist.rehydrate()
	}, [])

	let screenNode
	if (screen === 'briefing') {
		screenNode = (
			<BriefingScreen kase={kase} onBegin={() => beginInvestigation(kase.id)} />
		)
	} else if (screen === 'investigation') {
		screenNode = (
			<InvestigationScreen kase={kase} onAccuse={() => setAccusationOpen(true)} />
		)
	} else {
		screenNode = (
			<OutcomeScreen kase={kase} onNewInvestigation={() => resetCurrentCase()} />
		)
	}

	return (
		<>
			{screenNode}
			<AccusationModal
				kase={kase}
				open={accusationOpen}
				onOpenChange={setAccusationOpen}
			/>
		</>
	)
}
