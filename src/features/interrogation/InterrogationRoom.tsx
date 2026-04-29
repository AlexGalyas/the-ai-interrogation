'use client';

import type { Suspect } from '@/lib/game/types';
import { useGameStore } from '@/stores/game';

import { ChatView } from '@/features/interrogation/ChatView';
import { MessageInput } from '@/features/interrogation/MessageInput';

interface InterrogationRoomProps {
  suspect: Suspect;
}

export function InterrogationRoom({ suspect }: InterrogationRoomProps) {
  const appendUserMessage = useGameStore((state) => state.appendUserMessage);
  const isStreaming = useGameStore((state) => state.isStreaming);

  const handleSend = (content: string) => {
    appendUserMessage(content);
  };

  return (
    <div
      data-suspect-id={suspect.id}
      className="flex min-h-0 flex-1 flex-col"
    >
      <ChatView />
      <MessageInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
