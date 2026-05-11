'use client'

import { AUDIO_ENABLED_KEY } from '@/lib/persistent-toggle-keys'
import { cn } from '@/lib/utils'
import { usePersistentToggle } from '@/lib/use-persistent-toggle'

/**
 * Briefing-screen toggle that controls the ambient rain loop (spec §6.2).
 * Defaults to Off on first ever visit; the value persists across sessions
 * under `AUDIO_ENABLED_KEY`. Browsers block autoplay without a user gesture,
 * so the toggle click itself is the gesture that authorises later playback —
 * actual sound starts on the Investigation screen, not on the Briefing.
 */
export function AudioToggle() {
	const { value, setValue } = usePersistentToggle(AUDIO_ENABLED_KEY)

	return (
		<button
			type="button"
			onClick={() => setValue(!value)}
			aria-pressed={value}
			className={cn(
				'inline-flex items-center gap-2 rounded-md px-2 py-1 font-sans text-xs',
				'text-muted-foreground transition-colors hover:text-accent',
				'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50'
			)}
		>
			<span aria-hidden="true">{value ? '♪' : '·'}</span>
			<span>Atmosphere:</span>
			<span className={cn('font-medium', value && 'text-accent')}>
				{value ? 'On' : 'Off'}
			</span>
		</button>
	)
}
