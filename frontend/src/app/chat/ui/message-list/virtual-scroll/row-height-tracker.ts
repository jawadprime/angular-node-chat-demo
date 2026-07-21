import { Signal, signal } from '@angular/core';

// Remembers each row's real measured height, keyed by message id. Read
// `version` inside a computed()/effect() to react to updates — the map
// itself is plain mutable state, not a signal.
export interface RowHeightTracker {
  readonly version: Signal<number>;
  get(id: string, fallback: number): number;
  // Returns true if this measurement changed the cached value.
  recordMeasurement(id: string, height: number): boolean;
}

// Sub-pixel noise between measurements of an unchanged row (font hinting,
// layout rounding) shouldn't count as a real height change — it would bump
// `version` and cascade a full geometry recompute for no visible difference.
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
