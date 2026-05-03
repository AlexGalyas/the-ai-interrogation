'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SuspectPicker } from '@/features/accusation/suspect-picker'
import type { Accusation, AccusationResult, PublicCase } from '@/lib/game/types'
import { useGameStore } from '@/stores/game'

interface AccusationModalProps {
	kase: PublicCase
	open: boolean
	onOpenChange: (open: boolean) => void
}

const MIN_EVIDENCE_LENGTH = 10

export function AccusationModal({ kase, open, onOpenChange }: AccusationModalProps) {
	const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null)
	const [evidence, setEvidence] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [prevOpen, setPrevOpen] = useState(open)
	const submitAccusation = useGameStore((state) => state.submitAccusation)

	if (open !== prevOpen) {
		setPrevOpen(open)
		if (open) {
			setSelectedSuspectId(null)
			setEvidence('')
			setIsSubmitting(false)
		}
	}

	const trimmedLength = evidence.trim().length
	const canSubmit = selectedSuspectId !== null && trimmedLength >= MIN_EVIDENCE_LENGTH

	async function handleSubmit() {
		if (!canSubmit || selectedSuspectId === null || isSubmitting) return
		setIsSubmitting(true)
		try {
			const accusation: Accusation = { suspectId: selectedSuspectId, evidence }
			const response = await fetch('/api/accuse', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(accusation)
			})
			if (!response.ok) {
				throw new Error(`Accuse request failed: ${response.status}`)
			}
			const result = (await response.json()) as AccusationResult
			submitAccusation(accusation, result)
			onOpenChange(false)
		} catch (error) {
			console.error('Accusation submission failed:', error)
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Make your accusation</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<SuspectPicker
						suspects={kase.suspects}
						selectedId={selectedSuspectId}
						onSelect={setSelectedSuspectId}
					/>
					<div className="flex flex-col gap-1">
						<Textarea
							value={evidence}
							onChange={(event) => setEvidence(event.target.value)}
							placeholder="What evidence convinces you it was them?"
							rows={4}
							aria-label="Evidence"
						/>
						<p className="text-xs text-muted-foreground">
							{trimmedLength < MIN_EVIDENCE_LENGTH
								? `${trimmedLength}/${MIN_EVIDENCE_LENGTH} characters`
								: `${trimmedLength} characters`}
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
						{isSubmitting ? 'Submitting…' : 'Submit accusation'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
