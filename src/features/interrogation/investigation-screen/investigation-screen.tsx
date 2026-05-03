'use client'

import { AccuseButton } from '@/features/accusation/accuse-button'
import { InterrogationRoom } from '@/features/interrogation/interrogation-room'
import { SuspectTabs } from '@/features/interrogation/suspect-tabs'
import type { PublicCase } from '@/lib/game/types'
import { useGameStore } from '@/stores/game'

interface InvestigationScreenProps {
	kase: PublicCase
	onAccuse: () => void
}

export function InvestigationScreen({ kase, onAccuse }: InvestigationScreenProps) {
	const setActiveSuspect = useGameStore((state) => state.setActiveSuspect)
	const storedActiveSuspectId = useGameStore(
		(state) => state.progressByCase[kase.id]?.activeSuspectId
	)

	const activeSuspect =
		kase.suspects.find((s) => s.id === storedActiveSuspectId) ?? kase.suspects[0]
	if (!activeSuspect) {
		throw new Error(`Case ${kase.id} has no suspects.`)
	}

	return (
		<div className="flex min-h-screen flex-col">
			<SuspectTabs
				suspects={kase.suspects}
				activeSuspectId={activeSuspect.id}
				onSelect={setActiveSuspect}
			/>
			<InterrogationRoom suspect={activeSuspect} caseId={kase.id} />
			<AccuseButton onClick={onAccuse} />
		</div>
	)
}
