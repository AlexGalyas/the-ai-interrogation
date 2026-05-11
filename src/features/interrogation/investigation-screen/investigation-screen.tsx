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

/**
 * Three-row layout: fixed header (suspect tabs + Accuse), scrollable middle
 * (chat), fixed footer (message input). `h-screen` constrains the document so
 * only the chat region scrolls — Task 8 sensory QA: previously the whole page
 * scrolled, which buried the suspect tabs as soon as a few exchanges landed.
 */
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
		<div className="flex h-screen flex-col">
			<header className="flex shrink-0 items-stretch gap-2 border-b border-border bg-background pr-4">
				<SuspectTabs
					suspects={kase.suspects}
					activeSuspectId={activeSuspect.id}
					onSelect={setActiveSuspect}
					className="flex-1"
				/>
				<div className="flex shrink-0 items-center py-2">
					<AccuseButton onClick={onAccuse} />
				</div>
			</header>
			<InterrogationRoom suspect={activeSuspect} caseId={kase.id} />
		</div>
	)
}
