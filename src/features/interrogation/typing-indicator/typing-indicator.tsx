export function TypingIndicator() {
	return (
		<div
			role="status"
			aria-label="Suspect is responding"
			className="inline-flex items-center gap-1 px-3 py-2"
		>
			<span className="dot dot-1" />
			<span className="dot dot-2" />
			<span className="dot dot-3" />
		</div>
	)
}
