// ── Module state ──
let _scrollTarget = 0;
let _scrollSmoothed = 0;
let _driftTarget = 0;
let _driftSmoothed = 0;
let _lastTime = 0;
let _running = false;

// ── Shared smoothing helper ──
function smoothToward(current: number, target: number, speedUp: number, speedDown: number, dt: number): number {
  const diff = target - current;
  if (Math.abs(diff) < 0.001) return target;
  const speed = diff > 0 ? speedUp : speedDown;
  return current + diff * Math.min(1, speed * dt);
}

function tick() {
  const now = performance.now();
  const dt = Math.min((now - _lastTime) / 1000, 0.05);
  _lastTime = now;

  _scrollSmoothed = smoothToward(_scrollSmoothed, _scrollTarget, 6.0, 1.8, dt);
  _driftSmoothed = smoothToward(_driftSmoothed, _driftTarget, 3.0, 1.2, dt);

  const converged =
    _scrollSmoothed === _scrollTarget && _driftSmoothed === _driftTarget;

  if (converged) {
    _running = false;
  } else {
    requestAnimationFrame(tick);
  }
}

function ensureRunning() {
  if (_running) return;
  _running = true;
  _lastTime = performance.now();
  requestAnimationFrame(tick);
}

// ── Scroll progress ──
export function getScrollProgress(): number {
  return _scrollSmoothed;
}

export function setScrollProgress(v: number): void {
  _scrollTarget = Math.max(0, Math.min(1, v));
  ensureRunning();
}

// ── Drift right (data-flow river) ──
export function getDriftRight(): number {
  return _driftSmoothed;
}

export function setDriftRight(v: number): void {
  _driftTarget = Math.max(0, Math.min(1, v));
  ensureRunning();
}
