'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import { Button } from '@/components/ui/button'
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SuspectPicker } from '@/features/accusation/suspect-picker'
import { cn } from '@/lib/utils'
import type { Accusation, AccusationResult, PublicCase } from '@/lib/game/types'
import { useGameStore } from '@/stores/game'

interface AccusationModalProps {
	kase: PublicCase
	open: boolean
	onOpenChange: (open: boolean) => void
}

const MIN_EVIDENCE_LENGTH = 10

/**
 * Theatrical scale-in entry per ADR-0016 / spec §5.2. The cubic-bezier is the
 * eased-out spring-feel curve from §5.2; backdrop runs slightly faster so the
 * blur lands first, then the modal "pops in" on top.
 */
const MODAL_TRANSITION = {
	duration: 0.4,
	ease: [0.16, 1, 0.3, 1] as const
}

const BACKDROP_TRANSITION = {
	duration: 0.3
}

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
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<AnimatePresence>
				{open && (
					<DialogPrimitive.Portal forceMount>
						<DialogPrimitive.Overlay asChild forceMount>
							<motion.div
								initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
								animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
								exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
								transition={BACKDROP_TRANSITION}
								className="fixed inset-0 z-50 bg-black/60"
							/>
						</DialogPrimitive.Overlay>
						<DialogPrimitive.Content asChild forceMount>
							<motion.div
								initial={{ scale: 0.85, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.95, opacity: 0 }}
								transition={MODAL_TRANSITION}
								className={cn(
									'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)]',
									'-translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4',
									'text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none',
									'sm:max-w-lg'
								)}
							>
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
									<Button
										onClick={handleSubmit}
										disabled={!canSubmit || isSubmitting}
									>
										{isSubmitting ? 'Submitting…' : 'Submit accusation'}
									</Button>
								</DialogFooter>
							</motion.div>
						</DialogPrimitive.Content>
					</DialogPrimitive.Portal>
				)}
			</AnimatePresence>
		</DialogPrimitive.Root>
	)
}
