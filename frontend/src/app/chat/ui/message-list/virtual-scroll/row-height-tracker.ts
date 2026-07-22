import { Signal, signal } from '@angular/core';

// Stores each row's measured height by message id. Read `version` to react to changes.
export interface RowHeightTracker {
  readonly version: Signal<number>;
  get(id: string, fallback: number): number;
  // Returns true if this measurement changed the cached value.
  recordMeasurement(id: string, height: number): boolean;
}

// Ignores tiny sub-pixel differences so they don't trigger a needless recompute.
const MEASUREMENT_TOLERANCE_PX = 0.5;

export function createRowHeightTracker(): RowHeightTracker {
  const heights = new Map<string, number>();
  const version = signal(0);

  return {
    version,

    get(id, fallback) {
      return heights.get(id) ?? fallback;
    },

    recordMeasurement(id, height) {
      const previous = heights.get(id);
      if (height <= 0 || (previous !== undefined && Math.abs(previous - height) < MEASUREMENT_TOLERANCE_PX)) {
        return false;
      }
      heights.set(id, height);
      version.update((v) => v + 1);
      return true;
    },
  };
}
