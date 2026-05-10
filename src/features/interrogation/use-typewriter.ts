'use client'

import { useEffect } from 'react'

import { useGameStore } from '@/stores/game'

/** Per-character interval (per spec §3.1 — Disco Elysium pacing). */
export const TYPEWRITER_INTERVAL_MS = 45

function readMessage(suspectId: string, messageId: string) {
	const state = useGameStore.getState()
	const progress = state.progressByCase[state.currentCaseId]
	const messages = progress?.messagesBySuspect[suspectId] ?? []
	return messages.find((m) => m.id === messageId)
}

function readIsStreaming(suspectId: string): boolean {
	const state = useGameStore.getState()
	const progress = state.progressByCase[state.currentCaseId]
	return progress?.isStreamingBySuspect[suspectId] ?? false
}

/**
 * Drives char-by-char reveal of an assistant message's `displayedContent` via
 * `requestAnimationFrame`, decoupled from API token arrival. The render tick
 * accumulates wall-clock time and calls `tick` once per
 * {@link TYPEWRITER_INTERVAL_MS} elapsed — multiple ticks fire in a single RAF
 * frame if the loop fell behind. The loop self-stops when `displayedContent`
 * has caught up to `content` AND streaming has finished.
 *
 * On mount, if streaming has already finished but `displayedContent` is behind
 * `content` (the mid-typewriter refresh case from spec §3.3), we snap
 * `displayedContent` to the full `content` immediately rather than replaying
 * the typewriter — the player's already seen part of this reply, no reason to
 * re-draw it slowly on reload.
 *
 * No-op when `messageId` references a message that doesn't exist (e.g.
 * unmounted between schedule and tick) — both `tick` and `skipTypewriter` are
 * defensive at the store level.
 */
export function useTypewriter(suspectId: string, messageId: string): void {
	useEffect(() => {
		const initial = readMessage(suspectId, messageId)
		if (!initial) return

		if (
			!readIsStreaming(suspectId) &&
			initial.displayedContent.length < initial.content.length
		) {
			useGameStore.getState().skipTypewriter(suspectId, messageId)
			return
		}

		let rafId: number | null = null
		let nextTickAt: number | null = null

		const step = (timestamp: number) => {
			if (nextTickAt === null) {
				nextTickAt = timestamp + TYPEWRITER_INTERVAL_MS
			}

			while (timestamp >= nextTickAt) {
				useGameStore.getState().tick(suspectId, messageId)
				nextTickAt += TYPEWRITER_INTERVAL_MS
			}

			const message = readMessage(suspectId, messageId)
			if (!message) {
				rafId = null
				return
			}

			const caughtUp = message.displayedContent.length >= message.content.length
			const isStreaming = readIsStreaming(suspectId)
			if (caughtUp && !isStreaming) {
				rafId = null
				return
			}

			rafId = requestAnimationFrame(step)
		}

		rafId = requestAnimationFrame(step)

		return () => {
			if (rafId !== null) cancelAnimationFrame(rafId)
		}
	}, [suspectId, messageId])
}
