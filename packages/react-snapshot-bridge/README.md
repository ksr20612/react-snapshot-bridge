# react-snapshot-bridge

> Use React's class-only `getSnapshotBeforeUpdate` lifecycle from **function components**, via a single 30-line wrapper.

[![npm](https://img.shields.io/npm/v/react-snapshot-bridge.svg)](https://www.npmjs.com/package/react-snapshot-bridge)
[![bundle](https://img.shields.io/bundlephobia/minzip/react-snapshot-bridge)](https://bundlephobia.com/package/react-snapshot-bridge)
[![license](https://img.shields.io/npm/l/react-snapshot-bridge.svg)](./LICENSE)

## Why

`useLayoutEffect` runs **after** the DOM is mutated, so by the time it fires the previous DOM state — old `scrollTop`, prior selection, prior dimensions — is already gone.

`getSnapshotBeforeUpdate` is the React lifecycle that runs **right before** the mutation, returns a "snapshot" value, and forwards it to `componentDidUpdate`. It exists only on class components, and there is no built-in hook equivalent.

This library bridges that gap with a single drop-in wrapper. Use it when you need to:

- Keep the visible content anchored when items are inserted **above** a scroll container (chat lists, feeds)
- Preserve text selection or caret position across re-renders
- Capture element dimensions for FLIP-style animations
- Read any "before commit" DOM state and apply it after the commit

## Install

```bash
pnpm add react-snapshot-bridge
# or
npm i react-snapshot-bridge
# or
yarn add react-snapshot-bridge
```

Peer dependency: `react >= 16.3` (when `getSnapshotBeforeUpdate` was introduced).

## Quick start — preserve scroll on prepend

```tsx
import { useRef, useState } from 'react';
import { SnapshotBeforeUpdate } from 'react-snapshot-bridge';

function ChatList() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<string[]>(['hi']);

  return (
    <>
      <button onClick={() => setMessages((m) => ['new message', ...m])}>
        Prepend
      </button>

      <SnapshotBeforeUpdate<number>
        capture={() => {
          const el = scrollerRef.current!;
          return el.scrollHeight - el.scrollTop;
        }}
        apply={(prevDistanceFromBottom) => {
          const el = scrollerRef.current!;
          el.scrollTop = el.scrollHeight - prevDistanceFromBottom;
        }}
      >
        <div ref={scrollerRef} style={{ height: 200, overflow: 'auto' }}>
          {messages.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      </SnapshotBeforeUpdate>
    </>
  );
}
```

Without the wrapper, every prepend visually shifts the user's content down. With it, the visible content stays anchored.

## Capturing multiple values

`capture` returns a single value, but that value can be **any shape** — including an object. This is the recommended way to forward multiple pieces of state in one commit, and it keeps the API surface minimal and type-safe.

The example below combines two ideas at once:

1. Capture two DOM-derived values (`distanceFromBottom`, `wasAtBottom`) into one snapshot.
2. Reach into the surrounding component's state via **closure** (`messages.length`) so `apply` can compare "before" with "after" without a separate ref.

```tsx
import { useRef, useState } from 'react';
import { SnapshotBeforeUpdate } from 'react-snapshot-bridge';

type Snap = {
  distanceFromBottom: number;
  wasAtBottom: boolean;
  prevCount: number;
};

function ChatList({ messages }: { messages: string[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <SnapshotBeforeUpdate<Snap>
      capture={() => {
        const el = scrollerRef.current!;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        return {
          distanceFromBottom,
          wasAtBottom: distanceFromBottom < 16,
          // `messages` here is the value at this commit — by the time `apply`
          // runs, the closure inside `apply` will see the new `messages`.
          prevCount: messages.length,
        };
      }}
      apply={({ distanceFromBottom, wasAtBottom, prevCount }) => {
        const el = scrollerRef.current!;
        const grewAtTop = messages.length > prevCount;

        if (wasAtBottom) {
          el.scrollTop = el.scrollHeight; // stick to bottom for new arrivals
        } else if (grewAtTop) {
          el.scrollTop = el.scrollHeight - distanceFromBottom; // anchor existing content
        }
      }}
    >
      <div ref={scrollerRef} style={{ height: 200, overflow: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>
    </SnapshotBeforeUpdate>
  );
}
```

> Why not pass `prevProps` / `prevState` directly into `apply`? Because the wrapper would only see its own internal props (`{ capture, apply, children }`) and an empty state — neither has anything to do with your component. Capturing what you actually need via closure is both safer and clearer.

## API

### `<SnapshotBeforeUpdate<T> capture apply enabled?>{children?}</SnapshotBeforeUpdate>`

| Prop       | Type                          | Required | Description                                                                                                                    |
| ---------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `capture`  | `() => T`                     | yes      | Called synchronously **before** DOM mutation. Return value is forwarded to `apply`.                                            |
| `apply`    | `(snapshot: T) => void`       | yes      | Called synchronously **after** DOM mutation, before paint. Receives the value from `capture`.                                  |
| `enabled`  | `boolean`                     | no       | Defaults to `true`. When `false`, both `capture` and `apply` are skipped for that commit. Missed updates are not replayed.     |
| `children` | `React.ReactNode`             | no       | Optional. When provided, rendered as-is (wrapper pattern). When omitted, renders nothing.                                      |

The generic `T` is inferred from `capture`'s return type — you usually don't need to specify it.

## Where to place it

`SnapshotBeforeUpdate` runs its lifecycle **only when its own fiber updates**. So if you want to capture the `getSnapshotBeforeUpdate` timing of a particular component, the bridge has to live **inside that component's render output** — that way, every time the component re-renders, the bridge re-renders with it.

Within the same component, both wrapping the DOM as `children` and placing the bridge as a **sibling** of the DOM you care about work correctly. What does *not* work reliably is putting the bridge as a sibling of **another component** you want to track: when that component updates on its own (without its parent re-rendering), the bridge will not fire.

> The deciding factor is "which component re-renders alongside the bridge", not "wrapper vs sibling".

### Recommended 1 — Wrapper

```tsx
function ChatList({ messages }: { messages: string[] }) {
  return (
    <SnapshotBeforeUpdate capture={...} apply={...}>
      <div>{/* the DOM you actually care about */}</div>
    </SnapshotBeforeUpdate>
  );
}
```

### Recommended 2 — Sibling of the DOM, inside the same component

Useful when wrapping is awkward (e.g. you already have multiple siblings inside a Fragment).

```tsx
function ChatList({ messages }: { messages: string[] }) {
  return (
    <>
      <div>{/* the DOM you actually care about */}</div>
      <SnapshotBeforeUpdate capture={...} apply={...} />
    </>
  );
}
```

### Not recommended — Sibling of the component you want to track

```tsx
function Parent() {
  return (
    <>
      <ChatList messages={messages} />
      {/* Wrong: standalone updates inside ChatList may not be picked up */}
      <SnapshotBeforeUpdate capture={...} apply={...} />
    </>
  );
}
```

## How it works

React's commit phase runs in this order:

```
Render → Before Mutation → DOM Mutation → After Mutation → Paint → Passive
                ▲                                ▲
                │                                │
       getSnapshotBeforeUpdate           cDU + useLayoutEffect
```

Function components only have hooks for the **After Mutation** slot (`useLayoutEffect`). This library renders a tiny class component into your tree whose sole job is to occupy the **Before Mutation** slot and call your `capture` callback there.

The captured value is forwarded to `componentDidUpdate`, which calls `apply`. From your function component's point of view, you get a clean `(capture, apply)` pair without ever touching a class.

## Caveats

- **No call on initial mount.** Like the underlying class lifecycle, neither `capture` nor `apply` runs the first time the component appears — only on subsequent updates.
- **Requires a re-render in the right place.** If a `React.memo` (or `shouldComponentUpdate`) ancestor short-circuits the render, or the bridge is placed as a sibling of a different component that updates on its own, neither callback will fire. See [Where to place it](#where-to-place-it).
- **`enabled={false}` does not buffer updates.** Updates that occur while disabled are silently dropped. There is no "catch up" call when you re-enable the bridge — the next regular update is what triggers `capture`/`apply` again.
- **Concurrent rendering safe.** React 18+ concurrent features may discard render results, but the commit phase itself is synchronous, so `capture`/`apply` always run as a paired set.
- **SSR safe.** Lifecycle methods don't run during `renderToString` / `renderToPipeableStream`, so the bridge is a no-op on the server.
- **React 19.** Class components and `getSnapshotBeforeUpdate` are not deprecated in React 19. This library remains compatible.

## License

[MIT](./LICENSE)
