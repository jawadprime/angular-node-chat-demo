import { Injectable, afterRenderEffect, computed, signal, untracked } from '@angular/core';
import { ChatMessage } from '../../../data/chat-api.models';
import { computeOffsets, computeTotalHeight, computeVisibleRange } from './virtual-scroll-geometry';
import { classifyScrollTransition } from './scroll-transition';
import { createRowHeightTracker } from './row-height-tracker';

// Seed height for a row before its first real measurement.
const ESTIMATED_ROW_HEIGHT_PX = 64;

// Extra px rendered above/below the viewport, so scrolling doesn't reveal
// blank space before new rows mount.
const BUFFER_PX = 600;

const NEAR_BOTTOM_THRESHOLD_PX = 48;

// Provided per-MessageList instance (not root): two open chat panels must
// not share scroll state. VirtualScrollViewportDirective hands over the
// viewport element via attachViewport(), since a plain service has no
// template of its own to get an ElementRef from.
@Injectable()
export class VirtualScrollService {
  private readonly rowHeights = createRowHeightTracker();
  private readonly heightOf = (message: ChatMessage): number => this.rowHeights.get(message.id, ESTIMATED_ROW_HEIGHT_PX);

  private readonly items = signal<ChatMessage[]>([]);
  private readonly viewportElement = signal<HTMLElement | null>(null);

  private readonly scrollTop = signal(0);
  private readonly viewportHeight = signal(0);
  private readonly isNearBottom = signal(true);

  private readonly offsets = computed(() => {
    this.rowHeights.version(); // establish reactive dependency on measured heights
    return computeOffsets(this.items(), this.heightOf);
  });

  readonly totalHeight = computed(() => computeTotalHeight(this.items(), this.offsets(), this.heightOf));

  private readonly visibleRange = computed(() =>
    computeVisibleRange(this.items().length, this.offsets(), this.scrollTop(), this.viewportHeight(), BUFFER_PX),
  );

  readonly visibleMessages = computed(() => {
    const { start, end } = this.visibleRange();
    return this.items().slice(start, end);
  });

  readonly offsetBeforePx = computed(() => {
    const { start } = this.visibleRange();
    const offsets = this.offsets();
    return start < offsets.length ? offsets[start] : 0;
  });

  readonly offsetAfterPx = computed(() => {
    const { end } = this.visibleRange();
    const offsets = this.offsets();
    const renderedThrough = end < offsets.length ? offsets[end] : this.totalHeight();
    return Math.max(this.totalHeight() - renderedThrough, 0);
  });

  private previousFirstId: string | null = null;
  private previousLastId: string | null = null;

  constructor() {
    this.trackViewportHeight();
    this.manageScrollPosition();
  }

  setItems(items: ChatMessage[]): void {
    this.items.set(items);
  }

  attachViewport(element: HTMLElement): void {
    if (this.viewportElement() === element) return;
    this.viewportElement.set(element);
  }

  recordScroll(scrollTop: number, scrollHeight: number, clientHeight: number): void {
    this.scrollTop.set(scrollTop);
    this.isNearBottom.set(scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_THRESHOLD_PX);
  }

  recordRowMeasurement(id: string, height: number): void {
    this.rowHeights.recordMeasurement(id, height);
  }

  private trackViewportHeight(): void {
    afterRenderEffect(() => {
      const element = this.viewportElement();
      if (!element) return;

      const observer = new ResizeObserver(([entry]) => this.viewportHeight.set(entry.contentRect.height));
      observer.observe(element);
      this.viewportHeight.set(element.clientHeight);
      return () => observer.disconnect();
    });
  }

  // Must run in afterRenderEffect, not a plain effect(): the spacer divs'
  // heights come from totalHeight()/offsets() template bindings, which
  // haven't flushed to the real DOM yet inside a plain effect — reading
  // scrollHeight or writing scrollTop then sees stale, too-small content
  // size, and the browser clamps the scrollTop write back to 0.
  private manageScrollPosition(): void {
    afterRenderEffect(() => {
      const element = this.viewportElement();
      const msgs = this.items();

      if (!element || msgs.length === 0) {
        if (msgs.length === 0) {
          this.previousFirstId = null;
          this.previousLastId = null;
        }
        return;
      }

      const newFirstId = msgs[0].id;
      const newLastId = msgs[msgs.length - 1].id;
      const transition = classifyScrollTransition(this.previousFirstId, this.previousLastId, newFirstId, newLastId);

      // Checked independently, not as an if/else on one enum: a history-load
      // (prepend) and a realtime message (append) can land in the same
      // render, and both may need to apply.
      if ((transition.initial || transition.appended) && untracked(() => this.isNearBottom())) {
        this.setScrollTop(this.totalHeight() - this.viewportHeight());
      } else if (transition.prepended) {
        const anchorIndex = msgs.findIndex((m) => m.id === this.previousFirstId);
        if (anchorIndex > 0) {
          const addedHeight = this.offsets()[anchorIndex];
          this.setScrollTop(element.scrollTop + addedHeight);
        }
      }

      this.previousFirstId = newFirstId;
      this.previousLastId = newLastId;
    });
  }

  // Writing element.scrollTop doesn't synchronously update the scrollTop
  // signal — every programmatic scroll goes through here so visibleRange
  // never computes from a stale position.
  private setScrollTop(value: number): void {
    const element = this.viewportElement();
    if (!element) return;
    element.scrollTop = value;
    this.scrollTop.set(element.scrollTop);
  }
}
