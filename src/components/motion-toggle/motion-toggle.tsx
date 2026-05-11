'use client'

import { useEffect } from 'react'

import { REDUCE_MOTION_ENABLED_KEY } from '@/lib/persistent-toggle-keys'
import { cn } from '@/lib/utils'
import { usePersistentToggle } from '@/lib/use-persistent-toggle'

/** CSS class applied to `<html>` when the user opts out of motion. */
export const REDUCE_MOTION_CLASS = 'reduce-motion'

/**
 * Briefing-screen toggle for the explicit Reduce Motion preference (spec §7.6
 * / ADR-0017). Independent of the OS-level `prefers-reduced-motion` media
 * query — that one is also honoured separately in CSS. When On, applies
 * `.reduce-motion` to `<html>` so the global override in `globals.css` can
 * disable jitter (and any future motion the toggle should govern).
 */
export function MotionToggle() {
	const { value, setValue } = usePersistentToggle(REDUCE_MOTION_ENABLED_KEY)

	useEffect(() => {
		if (typeof document === 'undefined') return
		const root = document.documentElement
		if (value) root.classList.add(REDUCE_MOTION_CLASS)
		else root.classList.remove(REDUCE_MOTION_CLASS)
	}, [value])

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
			<span aria-hidden="true">{value ? '⏸' : '~'}</span>
			<span>Reduce Motion:</span>
			<span className={cn('font-medium', value && 'text-accent')}>
				{value ? 'On' : 'Off'}
			</span>
		</button>
	)
}
