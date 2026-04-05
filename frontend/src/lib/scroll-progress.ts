let _scrollProgress = 0;

export function getScrollProgress(): number {
  return _scrollProgress;
}

export function setScrollProgress(v: number): void {
  _scrollProgress = Math.max(0, Math.min(1, v));
}

/** 0 = normal DNA, 1 = particles drift rightward (data-flow river) */
let _driftRight = 0;

export function getDriftRight(): number {
  return _driftRight;
}

export function setDriftRight(v: number): void {
  _driftRight = Math.max(0, Math.min(1, v));
}
