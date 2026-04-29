import Anthropic from '@anthropic-ai/sdk';

let cachedClient: Anthropic | null = null;

/**
 * Returns a singleton Anthropic client constructed from the server-side
 * `ANTHROPIC_API_KEY` environment variable.
 *
 * Lazy: the client is built on first call so unit tests and edge contexts can
 * import the module without crashing if the env var is unset at import time.
 *
 * @throws Error when `ANTHROPIC_API_KEY` is missing or empty.
 */
export function getAnthropicClient(): Anthropic {
  if (cachedClient) return cachedClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}
