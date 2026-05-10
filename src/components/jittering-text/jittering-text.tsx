import type { ReactNode } from 'react'

const JITTER_THRESHOLDS = {
	low: 20,
	mid: 50,
	high: 80
} as const

interface JitteringTextProps {
	children: ReactNode
	nervousness: number
}

function pickJitterClass(nervousness: number): string | null {
	if (nervousness < JITTER_THRESHOLDS.low) return null
	if (nervousness < JITTER_THRESHOLDS.mid) return 'jitter-low'
	if (nervousness < JITTER_THRESHOLDS.high) return 'jitter-mid'
	return 'jitter-high'
}

export function JitteringText({ children, nervousness }: JitteringTextProps) {
	const jitterClass = pickJitterClass(nervousness)
	if (jitterClass === null) return <>{children}</>
	return <span className={jitterClass}>{children}</span>
}
