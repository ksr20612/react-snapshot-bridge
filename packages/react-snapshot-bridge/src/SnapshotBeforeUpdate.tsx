import type { ReactNode } from 'react';
import { Component } from 'react';
import checkIsDepsEqual from './_utils/checkIsDepsEqual';

type EmptyState = Record<string, never>;

/**
 * Symbol used to indicate that the snapshot should be skipped.
 */
const SKIP = Symbol('react-snapshot-bridge-skip');
type Skip = typeof SKIP;

export interface SnapshotBeforeUpdateProps<T> {
  /**
   * Runs synchronously **before** the DOM is mutated for this commit.
   * Whatever you return here is forwarded to {@link SnapshotBeforeUpdateProps.apply}.
   */
  capture: () => T;

  /**
   * Runs synchronously **after** the DOM is mutated, before the browser paints.
   * Receives the value previously returned from {@link SnapshotBeforeUpdateProps.capture}.
   */
  apply: (snapshot: T) => void;

  /**
   * When `false`, both `capture` and `apply` are skipped for that commit.
   * Evaluated against the **current** props at commit time, so toggling
   * `true` -> `false` skips both callbacks for that update, and `false` -> `true`
   * runs both as usual on the next update. Defaults to `true`.
   *
   * Updates that occur while disabled are not buffered or replayed later.
   */
  enabled?: boolean;

  /**
   * Optional dependency array, compared shallowly (`Object.is`) against the
   * previous commit. When provided, both `capture` and `apply` run only on the
   * commit where at least one entry changed; commits with unchanged `deps` are
   * skipped. When omitted, both callbacks run on every update (default).
   */
  deps?: readonly unknown[];

  /**
   * Optional children. When provided, this component acts as a wrapper and
   * renders its children. When omitted, it renders nothing and you can place
   * it as a sibling next to the elements you care about.
   */
  children?: ReactNode;
}

/**
 * Bridges React's class-only `getSnapshotBeforeUpdate` lifecycle into trees
 * built with function components.
 *
 * The component re-renders alongside its parent and uses the `getSnapshotBeforeUpdate`
 * / `componentDidUpdate` pair internally to invoke {@link SnapshotBeforeUpdateProps.capture}
 * before DOM mutation and {@link SnapshotBeforeUpdateProps.apply} immediately after.
 */
export class SnapshotBeforeUpdate<T = unknown> extends Component<
  SnapshotBeforeUpdateProps<T>,
  EmptyState,
  T | Skip
> {
  override getSnapshotBeforeUpdate(prevProps: Readonly<SnapshotBeforeUpdateProps<T>>): T | Skip {
    if (this.props.enabled === false) return SKIP;

    if (this.props.deps !== undefined && checkIsDepsEqual(prevProps.deps, this.props.deps))
      return SKIP;

    return this.props.capture();
  }

  override componentDidUpdate(
    _prevProps: Readonly<SnapshotBeforeUpdateProps<T>>,
    _prevState: Readonly<EmptyState>,
    snapshot: T | Skip,
  ): void {
    if (snapshot === SKIP) return;

    this.props.apply(snapshot);
  }

  override render(): ReactNode {
    return this.props.children ?? null;
  }
}
