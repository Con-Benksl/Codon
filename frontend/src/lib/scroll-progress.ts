let _scrollProgress = 0;

export function getScrollProgress(): number {
  return _scrollProgress;
}

export function setScrollProgress(v: number): void {
  _scrollProgress = Math.max(0, Math.min(1, v));
}
