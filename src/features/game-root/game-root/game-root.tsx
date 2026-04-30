'use client'

import { useEffect } from 'react'

import { BriefingScreen } from '@/features/briefing/briefing-screen'
import { InterrogationRoom } from '@/features/interrogation/interrogation-room'
import { SuspectTopBar } from '@/features/interrogation/suspect-top-bar'
import type { Case } from '@/lib/game/types'
import { deriveScreen, useGameStore } from '@/stores/game'

interface GameRootProps {
	kase: Case
}

export function GameRoot({ kase }: GameRootProps) {
	const beginInvestigation = useGameStore((state) => state.beginInvestigation)
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
		const activeSuspectId = progress?.activeSuspectId ?? kase.suspects[0]?.id
		const activeSuspect =
			kase.suspects.find((s) => s.id === activeSuspectId) ?? kase.suspects[0]
		if (!activeSuspect) {
			throw new Error(`Case ${kase.id} has no suspects.`)
		}
		return (
			<div className="flex min-h-screen flex-col">
				<SuspectTopBar suspect={activeSuspect} />
				<InterrogationRoom suspect={activeSuspect} caseId={kase.id} />
			</div>
		)
	}

	return <div>Outcome screen — coming soon</div>
}
