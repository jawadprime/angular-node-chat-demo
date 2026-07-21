// Pure math for a variable-height virtual scroll list. No Angular, no DOM —
// testable with plain arrays.

export interface VisibleRange {
  start: number;
  end: number;
}

// Cumulative offset (px) of each item's top edge, in list order.
export function computeOffsets<T>(items: readonly T[], heightOf: (item: T) => number): number[] {
  const offsets = new Array<number>(items.length);
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    offsets[i] = cumulative;
    cumulative += heightOf(items[i]);
  }
  return offsets;
}

// Total scrollable height (px) of the whole list.
export function computeTotalHeight<T>(items: readonly T[], offsets: readonly number[], heightOf: (item: T) => number): number {
  if (items.length === 0) return 0;
  const lastIndex = items.length - 1;
  return offsets[lastIndex] + heightOf(items[lastIndex]);
}

// First index in offsets[from..] at or past target. offsets is sorted
// (cumulative sum of non-negative heights), so this is a binary search
// rather than a scan — matters here because it reruns on every scroll event.
function lowerBound(offsets: readonly number[], target: number, from = 0): number {
  let lo = from;
  let hi = offsets.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (offsets[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Which index range should actually be rendered, given the current scroll
// position and a buffer so scrolling doesn't reveal blank space before new
// rows mount.
export function computeVisibleRange(
  itemCount: number,
  offsets: readonly number[],
  scrollTop: number,
  viewportHeight: number,
  bufferPx: number,
): VisibleRange {
  if (itemCount === 0) return { start: 0, end: 0 };

  const top = scrollTop - bufferPx;
  const bottom = scrollTop + viewportHeight + bufferPx;

  const start = Math.max(lowerBound(offsets, top) - 1, 0);
  const end = lowerBound(offsets, bottom, start);

  return { start, end };
}
