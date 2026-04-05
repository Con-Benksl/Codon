let _scrollTarget = 0;   // 目标值（scroll 事件直接写入）
let _scrollSmoothed = 0; // 平滑后的值（每帧插值）
let _lastTime = 0;

// 每帧由 rAF 驱动平滑插值
function tick() {
  const now = performance.now();
  const dt = Math.min((now - _lastTime) / 1000, 0.05); // cap dt
  _lastTime = now;

  // scroll progress 平滑
  const diff = _scrollTarget - _scrollSmoothed;
  const speed = diff > 0 ? 6.0 : 1.8;
  _scrollSmoothed += diff * Math.min(1, speed * dt);
  if (Math.abs(diff) < 0.001) {
    _scrollSmoothed = _scrollTarget;
  }

  // drift right 平滑（进入较快，离开慢过渡）
  const driftDiff = _driftTarget - _driftSmoothed;
  const driftSpeed = driftDiff > 0 ? 3.0 : 1.2;
  _driftSmoothed += driftDiff * Math.min(1, driftSpeed * dt);
  if (Math.abs(driftDiff) < 0.001) {
    _driftSmoothed = _driftTarget;
  }

  requestAnimationFrame(tick);
}

// 启动平滑循环
_lastTime = performance.now();
requestAnimationFrame(tick);

export function getScrollProgress(): number {
  return _scrollSmoothed;
}

export function setScrollProgress(v: number): void {
  _scrollTarget = Math.max(0, Math.min(1, v));
}

/** 0 = normal DNA, 1 = particles drift rightward (data-flow river) */
let _driftTarget = 0;
let _driftSmoothed = 0;

export function getDriftRight(): number {
  return _driftSmoothed;
}

export function setDriftRight(v: number): void {
  _driftTarget = Math.max(0, Math.min(1, v));
}
