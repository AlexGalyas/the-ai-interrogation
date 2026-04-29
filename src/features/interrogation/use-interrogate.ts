'use client';

import { useGameStore } from '@/stores/game';

const API_ERROR_MESSAGE = 'The suspect is silent... try again.';
const CONNECTION_LOST_SUFFIX = '\n\n(connection lost)';

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

function snapshotMessages(): ApiMessage[] {
  return useGameStore.getState().messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

async function streamInto(
  response: Response,
  assistantId: string,
): Promise<{ receivedAny: boolean; error: unknown }> {
  if (!response.body) {
    return { receivedAny: false, error: new Error('No response body') };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receivedAny = false;
  const { appendToAssistantMessage } = useGameStore.getState();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength > 0) {
        const text = decoder.decode(value, { stream: true });
        if (text) {
          receivedAny = true;
          appendToAssistantMessage(assistantId, text);
        }
      }
    }
    const tail = decoder.decode();
    if (tail) {
      receivedAny = true;
      appendToAssistantMessage(assistantId, tail);
    }
    return { receivedAny, error: null };
  } catch (err) {
    return { receivedAny, error: err };
  }
}

async function runRequest(
  suspectId: string,
  messages: ApiMessage[],
): Promise<void> {
  const store = useGameStore.getState();
  const assistantId = store.startAssistantMessage();

  let response: Response;
  try {
    response = await fetch('/api/interrogate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suspectId, messages }),
    });
  } catch {
    useGameStore.getState().setError(API_ERROR_MESSAGE);
    return;
  }

  if (!response.ok) {
    useGameStore.getState().setError(API_ERROR_MESSAGE);
    return;
  }

  const { receivedAny, error } = await streamInto(response, assistantId);

  if (!error) {
    useGameStore.getState().finishStreaming();
    return;
  }

  if (receivedAny) {
    useGameStore
      .getState()
      .appendToAssistantMessage(assistantId, CONNECTION_LOST_SUFFIX);
    useGameStore.getState().finishStreaming();
  } else {
    useGameStore.getState().setError(API_ERROR_MESSAGE);
  }
}

interface UseInterrogateApi {
  ask: (content: string) => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * Owns the fetch-and-stream side effect for the interrogation flow.
 *
 * `ask(content)` appends the user message to the store, snapshots the full
 * conversation, then streams the model reply into a freshly-created assistant
 * message slot.
 *
 * `retry()` is for the "API error" path — it drops the empty assistant slot,
 * clears the error, and re-fires the request with the existing history (no
 * new user message).
 */
export function useInterrogate(suspectId: string): UseInterrogateApi {
  const ask = async (content: string) => {
    if (useGameStore.getState().isStreaming) return;
    useGameStore.getState().appendUserMessage(content);
    await runRequest(suspectId, snapshotMessages());
  };

  const retry = async () => {
    if (useGameStore.getState().isStreaming) return;
    useGameStore.getState().retry();
    await runRequest(suspectId, snapshotMessages());
  };

  return { ask, retry };
}
