import { cn } from '@/lib/utils'

import { computeInitials, hashToHue } from './utils'

export interface InitialAvatarProps {
	name: string
	size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<InitialAvatarProps['size']>, string> = {
	sm: 'size-8 text-xs',
	md: 'size-12 text-sm',
	lg: 'size-16 text-lg'
}

/**
 * Circular avatar that renders up to two initials over a deterministic,
 * noir-toned linear gradient derived from the suspect's name.
 *
 * Saturation and lightness are clamped (35%/25% saturation, 28%/16%
 * lightness) so the gradient sits inside the noir palette envelope —
 * no neon greens, no jarring brights — while hue still varies enough
 * to distinguish suspects at a glance.
 *
 * The element is `aria-hidden` because it carries no information beyond
 * what the adjacent suspect name already conveys; making it screen-reader
 * silent avoids "MR, Marcus Reeve" double-reads.
 */
export function InitialAvatar({ name, size = 'md' }: InitialAvatarProps) {
	const initials = computeInitials(name)
	const hue = hashToHue(name)
	const gradient = `linear-gradient(135deg, hsl(${hue} 35% 28%), hsl(${hue} 25% 16%))`

	return (
		<div
			aria-hidden="true"
			style={{ background: gradient }}
			className={cn(
				'flex shrink-0 select-none items-center justify-center rounded-full font-sans font-semibold text-foreground',
				SIZE_CLASSES[size]
			)}
		>
			{initials}
		</div>
	)
}
