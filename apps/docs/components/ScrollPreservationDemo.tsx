'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { SnapshotBeforeUpdate } from 'react-snapshot-bridge';

type Message = {
  id: number;
  text: string;
  fresh: boolean;
};

let nextId = 0;
const makeMessage = (text: string, fresh = false): Message => ({
  id: ++nextId,
  text,
  fresh,
});

const initialMessages = (): Message[] =>
  Array.from({ length: 12 }, (_, i) => makeMessage(`Original message #${i + 1}`));

interface DemoListProps {
  messages: Message[];
  enabled: boolean;
}

function DemoList({ messages, enabled }: DemoListProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const list = (
    <div
      ref={scrollerRef}
      className="h-56 overflow-y-auto rounded-md border border-fd-border bg-fd-card text-sm"
    >
      <ul className="divide-y divide-fd-border">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`px-3 py-2 transition-colors ${
              m.fresh ? 'bg-fd-primary/10 text-fd-primary' : 'text-fd-foreground'
            }`}
          >
            {m.text}
          </li>
        ))}
      </ul>
    </div>
  );

  if (!enabled) return list;

  return (
    <SnapshotBeforeUpdate<number>
      capture={() => {
        const el = scrollerRef.current;
        if (!el) return 0;
        return el.scrollHeight - el.scrollTop;
      }}
      apply={(prevDistanceFromBottom) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight - prevDistanceFromBottom;
      }}
    >
      {list}
    </SnapshotBeforeUpdate>
  );
}

export function ScrollPreservationDemo() {
  const [enabled, setEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const toggleId = useId();

  const prepend = useCallback(() => {
    setMessages((prev) => {
      const cleared = prev.map((m) => (m.fresh ? { ...m, fresh: false } : m));
      const additions = [
        makeMessage('New message just arrived', true),
        makeMessage('Another fresh message', true),
      ];
      return [...additions, ...cleared];
    });
  }, []);

  const reset = useCallback(() => {
    setMessages(initialMessages());
  }, []);

  return (
    <div className="not-prose my-6 flex flex-col gap-3 rounded-lg border border-fd-border bg-fd-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={toggleId} className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            id={toggleId}
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-fd-primary"
          />
          <span className="font-medium">
            Use <code className="font-mono">{'<SnapshotBeforeUpdate>'}</code>
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prepend}
            className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
          >
            Prepend 2 messages
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-fd-border px-3 py-1.5 text-sm font-medium text-fd-foreground transition hover:bg-fd-accent"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-fd-muted-foreground">
        Scroll the list down a bit, then click <em>Prepend</em>. With the bridge enabled, the
        message you were reading stays visually anchored. Disable it to see the default behavior
        where the content jumps down.
      </p>

      <DemoList messages={messages} enabled={enabled} />
    </div>
  );
}
