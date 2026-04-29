import { describe, expect, it } from 'vitest';

import { textStreamFromMessageStream } from '@/api/interrogate/stream';

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

const textDelta = (text: string) => ({
  type: 'content_block_delta' as const,
  delta: { type: 'text_delta' as const, text },
});

describe('textStreamFromMessageStream', () => {
  it('emits concatenated text from text_delta events in order', async () => {
    async function* source() {
      yield { type: 'message_start' };
      yield { type: 'content_block_start' };
      yield textDelta('Hello, ');
      yield textDelta('world');
      yield textDelta('!');
      yield { type: 'message_stop' };
    }

    const out = await readAll(textStreamFromMessageStream(source()));
    expect(out).toBe('Hello, world!');
  });

  it('ignores non-text events', async () => {
    async function* source() {
      yield { type: 'ping' };
      yield {
        type: 'content_block_delta',
        delta: { type: 'input_json_delta', partial_json: '{}' },
      };
      yield textDelta('only this');
      yield { type: 'message_delta' };
    }

    const out = await readAll(textStreamFromMessageStream(source()));
    expect(out).toBe('only this');
  });

  it('forwards source errors to the stream consumer', async () => {
    async function* source() {
      yield textDelta('partial ');
      throw new Error('upstream blew up');
    }

    const stream = textStreamFromMessageStream(source());
    await expect(readAll(stream)).rejects.toThrow('upstream blew up');
  });

  it('produces an empty stream when the source yields no text deltas', async () => {
    async function* source() {
      yield { type: 'message_start' };
      yield { type: 'message_stop' };
    }

    const out = await readAll(textStreamFromMessageStream(source()));
    expect(out).toBe('');
  });
});
