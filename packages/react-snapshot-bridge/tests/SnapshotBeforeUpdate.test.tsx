import { act, render } from '@testing-library/react';
import { createRef, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SnapshotBeforeUpdate } from '../src';

describe('SnapshotBeforeUpdate', () => {
  it('does not call capture or apply on initial mount', () => {
    const capture = vi.fn(() => 'snap');
    const apply = vi.fn();

    render(
      <SnapshotBeforeUpdate capture={capture} apply={apply}>
        <div>hello</div>
      </SnapshotBeforeUpdate>,
    );

    expect(capture).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it('calls capture, then apply on update, in that order', () => {
    const order: string[] = [];
    const capture = vi.fn(() => {
      order.push('capture');
      return 'snap';
    });
    const apply = vi.fn(() => {
      order.push('apply');
    });

    function Host({ value }: { value: number }) {
      return (
        <SnapshotBeforeUpdate capture={capture} apply={apply}>
          <div>{value}</div>
        </SnapshotBeforeUpdate>
      );
    }

    const { rerender } = render(<Host value={1} />);
    rerender(<Host value={2} />);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['capture', 'apply']);
  });

  it('forwards the value returned by capture into apply', () => {
    const apply = vi.fn();
    const SNAPSHOT = { token: Symbol('snap') };

    function Host({ value }: { value: number }) {
      return (
        <SnapshotBeforeUpdate capture={() => SNAPSHOT} apply={apply}>
          <div>{value}</div>
        </SnapshotBeforeUpdate>
      );
    }

    const { rerender } = render(<Host value={1} />);
    rerender(<Host value={2} />);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(SNAPSHOT);
  });

  it('observes the previous DOM in capture and the new DOM in apply', () => {
    const ref = createRef<HTMLDivElement>();
    let capturedText: string | null | undefined;
    let appliedText: string | null | undefined;

    function Host({ value }: { value: string }) {
      return (
        <SnapshotBeforeUpdate
          capture={() => {
            capturedText = ref.current?.textContent;
            return null;
          }}
          apply={() => {
            appliedText = ref.current?.textContent;
          }}
        >
          <div ref={ref}>{value}</div>
        </SnapshotBeforeUpdate>
      );
    }

    const { rerender } = render(<Host value="old" />);
    rerender(<Host value="new" />);

    expect(capturedText).toBe('old');
    expect(appliedText).toBe('new');
  });

  it('renders children unchanged and preserves refs across updates', () => {
    const ref = createRef<HTMLSpanElement>();
    const capture = vi.fn(() => null);
    const apply = vi.fn();

    function Host({ value }: { value: string }) {
      return (
        <SnapshotBeforeUpdate capture={capture} apply={apply}>
          <span ref={ref}>{value}</span>
        </SnapshotBeforeUpdate>
      );
    }

    const { rerender, container } = render(<Host value="a" />);
    const firstNode = ref.current;
    expect(container.textContent).toBe('a');
    expect(firstNode).toBeInstanceOf(HTMLSpanElement);

    rerender(<Host value="b" />);
    expect(container.textContent).toBe('b');
    expect(ref.current).toBe(firstNode);
  });

  it('renders nothing when no children are provided', () => {
    const { container } = render(<SnapshotBeforeUpdate capture={() => null} apply={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('preserves visible scroll anchoring when items are prepended', () => {
    const ITEM_HEIGHT = 20;

    function ScrollableList({ items }: { items: number[] }) {
      const scrollerRef = useRef<HTMLDivElement>(null);

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
          <div ref={scrollerRef} data-testid="scroller" style={{ height: 100, overflow: 'auto' }}>
            {items.map((id) => (
              <div key={id} style={{ height: ITEM_HEIGHT }}>
                item-{id}
              </div>
            ))}
          </div>
        </SnapshotBeforeUpdate>
      );
    }

    const { container, rerender } = render(<ScrollableList items={[1, 2, 3]} />);
    const scroller = container.querySelector('[data-testid="scroller"]') as HTMLDivElement;

    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      get: () => scroller.children.length * ITEM_HEIGHT,
    });

    scroller.scrollTop = 10;
    const distanceBefore = scroller.scrollHeight - scroller.scrollTop;

    rerender(<ScrollableList items={[10, 11, 1, 2, 3]} />);

    expect(scroller.scrollTop).toBe(scroller.scrollHeight - distanceBefore);
    expect(scroller.children.length).toBe(5);
  });

  it('runs capture/apply once per parent re-render', () => {
    const capture = vi.fn(() => 0);
    const apply = vi.fn();

    function Host({ value }: { value: number }) {
      return (
        <SnapshotBeforeUpdate capture={capture} apply={apply}>
          <div>{value}</div>
        </SnapshotBeforeUpdate>
      );
    }

    const { rerender } = render(<Host value={1} />);
    act(() => {
      rerender(<Host value={2} />);
    });
    act(() => {
      rerender(<Host value={3} />);
    });

    expect(capture).toHaveBeenCalledTimes(2);
    expect(apply).toHaveBeenCalledTimes(2);
  });

  describe('enabled prop', () => {
    it('treats omitted enabled as true (default behavior unchanged)', () => {
      const capture = vi.fn(() => 'snap');
      const apply = vi.fn();

      function Host({ value }: { value: number }) {
        return (
          <SnapshotBeforeUpdate capture={capture} apply={apply}>
            <div>{value}</div>
          </SnapshotBeforeUpdate>
        );
      }

      const { rerender } = render(<Host value={1} />);
      rerender(<Host value={2} />);

      expect(capture).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith('snap');
    });

    it('skips both capture and apply on update when enabled is false', () => {
      const capture = vi.fn(() => 'snap');
      const apply = vi.fn();

      function Host({ value }: { value: number }) {
        return (
          <SnapshotBeforeUpdate capture={capture} apply={apply} enabled={false}>
            <div>{value}</div>
          </SnapshotBeforeUpdate>
        );
      }

      const { rerender } = render(<Host value={1} />);
      rerender(<Host value={2} />);

      expect(capture).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
    });

    it('skips both callbacks on the update where enabled flips true -> false', () => {
      const capture = vi.fn(() => 'snap');
      const apply = vi.fn();

      function Host({ value, enabled }: { value: number; enabled: boolean }) {
        return (
          <SnapshotBeforeUpdate capture={capture} apply={apply} enabled={enabled}>
            <div>{value}</div>
          </SnapshotBeforeUpdate>
        );
      }

      const { rerender } = render(<Host value={1} enabled={true} />);
      rerender(<Host value={2} enabled={false} />);

      expect(capture).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
    });

    it('runs both callbacks normally on the update where enabled flips false -> true', () => {
      const capture = vi.fn(() => 'snap');
      const apply = vi.fn();

      function Host({ value, enabled }: { value: number; enabled: boolean }) {
        return (
          <SnapshotBeforeUpdate capture={capture} apply={apply} enabled={enabled}>
            <div>{value}</div>
          </SnapshotBeforeUpdate>
        );
      }

      const { rerender } = render(<Host value={1} enabled={false} />);
      rerender(<Host value={2} enabled={false} />);
      expect(capture).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();

      rerender(<Host value={3} enabled={true} />);

      expect(capture).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith('snap');
    });

    it('does not buffer or replay missed updates while disabled', () => {
      const capture = vi.fn(() => 'snap');
      const apply = vi.fn();

      function Host({ value }: { value: number }) {
        return (
          <SnapshotBeforeUpdate capture={capture} apply={apply} enabled={false}>
            <div>{value}</div>
          </SnapshotBeforeUpdate>
        );
      }

      const { rerender } = render(<Host value={1} />);
      act(() => {
        rerender(<Host value={2} />);
      });
      act(() => {
        rerender(<Host value={3} />);
      });
      act(() => {
        rerender(<Host value={4} />);
      });

      expect(capture).not.toHaveBeenCalled();
      expect(apply).not.toHaveBeenCalled();
    });
  });
});
