interface TextDeltaEvent {
  type: 'content_block_delta';
  delta: { type: 'text_delta'; text: string };
}

function isTextDeltaEvent(event: unknown): event is TextDeltaEvent {
  if (typeof event !== 'object' || event === null) return false;
  const candidate = event as { type?: unknown; delta?: unknown };
  if (candidate.type !== 'content_block_delta') return false;
  if (typeof candidate.delta !== 'object' || candidate.delta === null) {
    return false;
  }
  const delta = candidate.delta as { type?: unknown; text?: unknown };
  return delta.type === 'text_delta' && typeof delta.text === 'string';
}

/**
 * Adapts an Anthropic message-stream (an async iterable of raw stream events)
 * into a `ReadableStream<Uint8Array>` of UTF-8 text deltas, suitable for
 * returning as the body of a `text/plain` `Response`.
 *
 * Non-text events (message_start, content_block_start, ping, etc.) are
 * filtered out. Errors thrown by the source iterable are forwarded to the
 * stream consumer via `controller.error`.
 *
 * @param source Async iterable of Anthropic message stream events.
 * @returns A ReadableStream emitting UTF-8 encoded text chunks.
 */
export function textStreamFromMessageStream(
  source: AsyncIterable<unknown>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of source) {
          if (isTextDeltaEvent(event)) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
