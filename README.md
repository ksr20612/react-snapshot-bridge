# react-snapshot-bridge

A monorepo for `react-snapshot-bridge` — a tiny library that lets React **function components** use the class-only `getSnapshotBeforeUpdate` lifecycle.

## Why

`useLayoutEffect` runs **after** the DOM is mutated, so it cannot observe the previous DOM state (scroll position, selection, dimensions). `getSnapshotBeforeUpdate` runs **right before** the mutation and returns a value that is forwarded to `componentDidUpdate`. There is no built-in hook equivalent. This library exposes that missing slot via a single wrapper component you can drop into any function component tree.

```tsx
import { SnapshotBeforeUpdate } from "react-snapshot-bridge";

<SnapshotBeforeUpdate
  capture={() => listRef.current!.scrollHeight - listRef.current!.scrollTop}
  apply={(prevDistance) => {
    const el = listRef.current!;
    el.scrollTop = el.scrollHeight - prevDistance;
  }}
>
  <ChatList ref={listRef} messages={messages} />
</SnapshotBeforeUpdate>;
```

The bridge supports an optional `enabled` prop (default `true`) so you can turn the lifecycle off and on without unmounting it. See the [package README](./packages/react-snapshot-bridge/README.md) for the full API and placement guide — in short, the bridge must live **inside** the component whose updates you want to observe, not as a sibling of it.

## Development

```bash
pnpm install

pnpm --filter react-snapshot-bridge build       # build the library
pnpm --filter react-snapshot-bridge test        # run library tests
pnpm dev                                        # run the docs site (apps/docs)

pnpm typecheck
pnpm lint
```

## License

[MIT](./LICENSE)
