export function TypingIndicator() {
  return (
    <span
      role="status"
      aria-label="Suspect is typing"
      className="inline-flex items-center gap-1"
    >
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}
