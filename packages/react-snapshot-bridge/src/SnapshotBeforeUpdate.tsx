import { Component } from "react";
import type { ReactNode } from "react";

type EmptyState = Record<string, never>;

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
  EmptyState
> {
  override getSnapshotBeforeUpdate(): T {
    return this.props.capture();
  }

  override componentDidUpdate(
    _prevProps: Readonly<SnapshotBeforeUpdateProps<T>>,
    _prevState: Readonly<EmptyState>,
    snapshot: T,
  ): void {
    this.props.apply(snapshot);
  }

  override render(): ReactNode {
    return this.props.children ?? null;
  }
}
