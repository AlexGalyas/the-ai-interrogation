'use client'

import { useEffect, useRef } from 'react'

import { AUDIO_ENABLED_KEY } from '@/lib/persistent-toggle-keys'
import { usePersistentToggle } from '@/lib/use-persistent-toggle'
import { deriveScreen, useGameStore, type Screen } from '@/stores/game'

/** Foreground rain volume per spec §6.4 (rain is the atmosphere lead). */
const RAIN_VOLUME = 0.4

/** Outcome fade-out duration per spec §6.3. */
const FADE_OUT_DURATION_MS = 1000

/** Steps used to ramp volume to 0; small enough to be inaudible jumps. */
const FADE_STEP_MS = 50

interface AudioControllerProps {
	caseId: string
}

/** User-gesture events that the browser accepts as autoplay authorisation. */
const GESTURE_EVENTS = ['click', 'keydown', 'pointerdown', 'touchstart'] as const

/**
 * Single-element audio loop driven by (audioEnabled, currentScreen). The
 * `<audio>` lives in the DOM continuously so the browser keeps the gesture
 * authorisation that the toggle click granted — we only call `.play()` /
 * `.pause()` imperatively as the screen changes.
 *
 * - Briefing: audio may be enabled (gesture taken) but does NOT play (§6.3).
 * - Investigation: if enabled, the loop plays at `RAIN_VOLUME` (§6.4).
 * - Outcome: volume fades to 0 over {@link FADE_OUT_DURATION_MS}, then pauses.
 *
 * **Page-reload autoplay fallback (spec §6.3):** browser autoplay policy is
 * tab-scoped, so reload drops the gesture authorisation even though the
 * `audioEnabled` value in localStorage survives. When `play()` rejects, we
 * register one-shot listeners on the document for the standard gesture
 * events; the next user interaction (`click`, `keydown`, `pointerdown`,
 * `touchstart`) triggers a retry. Listeners share an `AbortController` with
 * the effect so a screen change or toggle-off cleans them up.
 *
 * Per spec scope we ship rain only; the room-tone half of §6.1 was descoped
 * by the maintainer during Task 7 pre-task (see §12 row 7).
 */
export function AudioController({ caseId }: AudioControllerProps) {
	const { value: audioEnabled } = usePersistentToggle(AUDIO_ENABLED_KEY)
	const screen = useGameStore((state): Screen =>
		deriveScreen(state.progressByCase[caseId])
	)

	const rainRef = useRef<HTMLAudioElement | null>(null)
	const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	useEffect(() => {
		const rain = rainRef.current
		if (!rain) return

		// Cancel any in-flight fade-out from a previous render — if we re-entered
		// investigation while a fade was running, we want full volume back.
		if (fadeIntervalRef.current) {
			clearInterval(fadeIntervalRef.current)
			fadeIntervalRef.current = null
		}

		const abort = new AbortController()

		if (!audioEnabled) {
			rain.pause()
			rain.currentTime = 0
			rain.volume = RAIN_VOLUME
			return () => abort.abort()
		}

		if (screen === 'investigation') {
			rain.volume = RAIN_VOLUME
			void rain.play().catch(() => {
				// Browser blocked autoplay — wait for the next user gesture and retry.
				const retry = () => {
					if (abort.signal.aborted) return
					void rain.play().catch(() => undefined)
				}
				for (const event of GESTURE_EVENTS) {
					document.addEventListener(event, retry, {
						signal: abort.signal,
						once: true,
						capture: true
					})
				}
			})
			return () => abort.abort()
		}

		if (screen === 'outcome' && !rain.paused) {
			const startVolume = rain.volume
			const startedAt = performance.now()
			fadeIntervalRef.current = setInterval(() => {
				const elapsed = performance.now() - startedAt
				const progress = Math.min(1, elapsed / FADE_OUT_DURATION_MS)
				rain.volume = Math.max(0, startVolume * (1 - progress))
				if (progress >= 1) {
					rain.pause()
					rain.currentTime = 0
					rain.volume = RAIN_VOLUME
					if (fadeIntervalRef.current) {
						clearInterval(fadeIntervalRef.current)
						fadeIntervalRef.current = null
					}
				}
			}, FADE_STEP_MS)
			return () => abort.abort()
		}

		// Briefing (and any other state): keep silent without resetting the
		// element so the gesture-grant stays alive for the next investigation.
		rain.pause()
		rain.currentTime = 0
		rain.volume = RAIN_VOLUME
		return () => abort.abort()
	}, [audioEnabled, screen])

	useEffect(() => {
		return () => {
			if (fadeIntervalRef.current) {
				clearInterval(fadeIntervalRef.current)
				fadeIntervalRef.current = null
			}
		}
	}, [])

	return (
		<audio
			ref={rainRef}
			src="/audio/rain-loop.mp3"
			loop
			preload="auto"
			aria-hidden="true"
		/>
	)
}
