'use client';

import { cn } from '@/lib/utils';
import { useGameStore } from '@/stores/game';

export function ChatView() {
  const messages = useGameStore((state) => state.messages);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-6">
      {messages.length === 0 ? (
        <p className="m-auto max-w-sm text-center text-sm text-muted-foreground">
          Begin the interrogation. Ask a question below.
        </p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex w-full',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {message.content}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
