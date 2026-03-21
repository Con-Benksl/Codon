import { useRef, useEffect, useCallback } from "react";

/* ── Types ── */

interface PersistentStar {
  x: number;
  y: number;
  sizeIdx: number;    // index into sprite sheet row
  colorIdx: number;   // index into sprite sheet column
  twinkleSpeed: number;
  twinklePhase: number;
  parallaxFactor: number;
}

interface TransientStar {
  x: number;
  y: number;
  sizeIdx: number;
  colorIdx: number;
  birthTime: number;
  lifetime: number;
  fadeIn: number;
  fadeOut: number;
  parallaxFactor: number;
}

interface Nebula {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rotation: number;
  color: string;
  alpha: number;
}

interface SpriteSheet {
  canvas: HTMLCanvasElement;
  cellSize: number;
  glowCanvas: HTMLCanvasElement;
  glowCellSize: number;
}

/* ── Constants ── */

const STAR_COLORS = ["#ffffff", "#ffe8d0", "#d0e8ff", "#e8d0ff", "#d0ffee"];
const STAR_SIZES = [0.6, 1.0, 1.6, 2.4];  // 4 size buckets
const GLOW_SIZES = STAR_SIZES.filter(s => s > 1.4);  // only large stars get glow
const PERSISTENT_COUNT = 90;
const TRANSIENT_COUNT = 280;
const GLOW_THRESHOLD_IDX = 2;  // sizeIdx >= 2 gets glow (sizes 1.6, 2.4)

// FPS adaptive degradation
const TARGET_FRAME_MS = 16.67;  // 60fps
const SLOW_FRAME_MS = 20;       // below ~50fps
const DEGRADED_TRANSIENT_COUNT = 140;  // halve transient stars when slow

/* ── Helpers ── */

function pickIdx(len: number): number {
  return Math.floor(Math.random() * len);
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/* ── Sprite Sheet Builder ── */
// Pre-render all star variations into an offscreen canvas once.
// Layout: rows = sizes, cols = colors. Each cell is a radial-gradient dot.

function buildSpriteSheet(): SpriteSheet {
  const padding = 2;
  const maxSize = Math.max(...STAR_SIZES);
  const cellSize = Math.ceil(maxSize * 2 + padding * 2);

  // Core sprites
  const canvas = document.createElement("canvas");
  canvas.width = cellSize * STAR_COLORS.length;
  canvas.height = cellSize * STAR_SIZES.length;
  const ctx = canvas.getContext("2d")!;

  for (let si = 0; si < STAR_SIZES.length; si++) {
    for (let ci = 0; ci < STAR_COLORS.length; ci++) {
      const cx = ci * cellSize + cellSize / 2;
      const cy = si * cellSize + cellSize / 2;
      const r = STAR_SIZES[si];
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, STAR_COLORS[ci]);
      grad.addColorStop(0.6, STAR_COLORS[ci]);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }

  // Glow sprites (only for large stars)
  const glowMaxR = maxSize * 5;
  const glowCellSize = Math.ceil(glowMaxR * 2 + padding * 2);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCellSize;  // only white glow, 1 column
  glowCanvas.height = glowCellSize * GLOW_SIZES.length;
  const gctx = glowCanvas.getContext("2d")!;

  for (let gi = 0; gi < GLOW_SIZES.length; gi++) {
    const cx = glowCellSize / 2;
    const cy = gi * glowCellSize + glowCellSize / 2;
    const glowR = GLOW_SIZES[gi] * 5;
    const grad = gctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grad.addColorStop(0, "rgba(255,255,255,0.12)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.03)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    gctx.fillStyle = grad;
    gctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);
  }

  return { canvas, cellSize, glowCanvas, glowCellSize };
}

/* ── Star Factories ── */

function createPersistentStars(w: number, h: number): PersistentStar[] {
  return Array.from({ length: PERSISTENT_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    sizeIdx: pickIdx(STAR_SIZES.length),
    colorIdx: pickIdx(STAR_COLORS.length),
    twinkleSpeed: rand(0.0008, 0.003),
    twinklePhase: rand(0, Math.PI * 2),
    parallaxFactor: rand(0.003, 0.015),
  }));
}

function spawnTransient(w: number, h: number, t: number): TransientStar {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    sizeIdx: pickIdx(STAR_SIZES.length - 1),  // transient stars are smaller (0-2)
    colorIdx: pickIdx(STAR_COLORS.length),
    birthTime: t + rand(0, 1500),
    lifetime: rand(1800, 6000),
    fadeIn: rand(400, 1200),
    fadeOut: rand(600, 1600),
    parallaxFactor: rand(0.002, 0.01),
  };
}

function createTransientStars(w: number, h: number): TransientStar[] {
  return Array.from({ length: TRANSIENT_COUNT }, () => {
    const s = spawnTransient(w, h, 0);
    s.birthTime = -rand(0, 6000);
    return s;
  });
}

function createNebulae(w: number, h: number): Nebula[] {
  return [
    { x: w * 0.15, y: h * 0.25, rx: 320, ry: 200, rotation: -0.3, color: "78,168,217", alpha: 0.03 },
    { x: w * 0.8, y: h * 0.55, rx: 280, ry: 350, rotation: 0.4, color: "255,180,161", alpha: 0.022 },
    { x: w * 0.5, y: h * 0.85, rx: 260, ry: 180, rotation: 0.1, color: "100,221,153", alpha: 0.018 },
    { x: w * 0.6, y: h * 0.2, rx: 180, ry: 240, rotation: -0.6, color: "232,208,255", alpha: 0.015 },
    { x: w * 0.3, y: h * 0.65, rx: 220, ry: 160, rotation: 0.2, color: "200,210,230", alpha: 0.02 },
  ];
}

/* ── Component ── */

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spriteRef = useRef<SpriteSheet | null>(null);
  const persistentRef = useRef<PersistentStar[]>([]);
  const transientRef = useRef<TransientStar[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });
  const visibleRef = useRef(true);
  const degradedRef = useRef(false);
  const frameTimesRef = useRef<number[]>([]);

  /* Build sprite sheet lazily (once) */
  const getSprites = useCallback((): SpriteSheet => {
    if (!spriteRef.current) {
      spriteRef.current = buildSpriteSheet();
    }
    return spriteRef.current;
  }, []);

  /* Draw static layer (nebulae + milky way) to offscreen canvas — only once per resize */
  const drawStatic = useCallback((w: number, h: number) => {
    let offscreen = staticCanvasRef.current;
    if (!offscreen) {
      offscreen = document.createElement("canvas");
      staticCanvasRef.current = offscreen;
    }
    const dpr = window.devicePixelRatio || 1;
    offscreen.width = w * dpr;
    offscreen.height = h * dpr;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Nebulae — use "screen" blending for richer overlap
    ctx.globalCompositeOperation = "screen";
    const nebulae = createNebulae(w, h);
    for (const n of nebulae) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.rotation);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      grad.addColorStop(0, `rgba(${n.color}, ${n.alpha * 1.5})`);
      grad.addColorStop(0.4, `rgba(${n.color}, ${n.alpha * 0.7})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.scale(n.rx, n.ry);
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Milky way — multiple overlapping thin bands
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.3 + i * 0.06);
      const bandH = h * (0.08 - i * 0.02);
      const bandGrad = ctx.createLinearGradient(-w, 0, w, 0);
      const a = 0.02 - i * 0.005;
      bandGrad.addColorStop(0, "rgba(78,168,217,0)");
      bandGrad.addColorStop(0.25, `rgba(78,168,217,${a})`);
      bandGrad.addColorStop(0.45, `rgba(200,210,230,${a * 1.3})`);
      bandGrad.addColorStop(0.55, `rgba(232,208,255,${a * 1.1})`);
      bandGrad.addColorStop(0.75, `rgba(100,221,153,${a})`);
      bandGrad.addColorStop(1, "rgba(100,221,153,0)");
      ctx.fillStyle = bandGrad;
      ctx.fillRect(-w, -bandH / 2, w * 2, bandH);
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
  }, []);

  /* FPS monitoring — track last N frames and degrade if needed */
  const trackFrameTime = useCallback((deltaMs: number) => {
    const times = frameTimesRef.current;
    times.push(deltaMs);
    if (times.length > 30) times.shift();

    // Check every 30 frames
    if (times.length === 30) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      degradedRef.current = avg > SLOW_FRAME_MS;
    }
  }, []);

  /* Draw dynamic layer every frame — using sprite drawImage instead of createRadialGradient */
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const { w, h } = sizeRef.current;
    const sprites = getSprites();
    const { canvas: spriteCanvas, cellSize, glowCanvas, glowCellSize } = sprites;

    ctx.clearRect(0, 0, w, h);

    // Blit static layer
    const offscreen = staticCanvasRef.current;
    if (offscreen) {
      ctx.drawImage(offscreen, 0, 0, w, h);
    }

    // Smooth mouse lerp
    mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.06;
    mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.06;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    const isReduced = reducedMotionRef.current;

    // ── Persistent stars (always visible, subtle twinkle) ──
    for (const s of persistentRef.current) {
      const twinkle = isReduced
        ? 0.75
        : 0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);

      const px = s.x + mx * s.parallaxFactor;
      const py = s.y + my * s.parallaxFactor;

      // Soft glow for larger stars — use pre-rendered glow sprite
      if (s.sizeIdx >= GLOW_THRESHOLD_IDX) {
        const glowIdx = s.sizeIdx - GLOW_THRESHOLD_IDX;
        const srcY = glowIdx * glowCellSize;
        const glowR = STAR_SIZES[s.sizeIdx] * 5;
        ctx.globalAlpha = twinkle;
        ctx.drawImage(
          glowCanvas,
          0, srcY, glowCellSize, glowCellSize,
          px - glowR - 1, py - glowR - 1, glowCellSize, glowCellSize
        );
      }

      // Core dot — use pre-rendered sprite
      const srcX = s.colorIdx * cellSize;
      const srcY = s.sizeIdx * cellSize;
      const r = STAR_SIZES[s.sizeIdx];
      ctx.globalAlpha = twinkle;
      ctx.drawImage(
        spriteCanvas,
        srcX, srcY, cellSize, cellSize,
        px - r - 1, py - r - 1, cellSize, cellSize
      );
    }

    // ── Transient stars (random appear/disappear) ──
    const isDegraded = degradedRef.current;
    const transientLimit = isDegraded ? DEGRADED_TRANSIENT_COUNT : transientRef.current.length;
    const transients = transientRef.current;

    for (let i = 0; i < Math.min(transientLimit, transients.length); i++) {
      const s = transients[i];
      const age = t - s.birthTime;

      // Not born yet
      if (age < 0) continue;

      // Lifecycle ended → respawn
      if (age > s.lifetime) {
        Object.assign(s, spawnTransient(w, h, t));
        continue;
      }

      // Fade envelope
      let alpha: number;
      if (age < s.fadeIn) {
        alpha = age / s.fadeIn;
      } else if (age > s.lifetime - s.fadeOut) {
        alpha = (s.lifetime - age) / s.fadeOut;
      } else {
        alpha = 1;
      }
      // Add a subtle shimmer on top of the envelope
      if (!isReduced) {
        alpha *= 0.7 + 0.3 * Math.sin(t * 0.004 + s.birthTime);
      }
      alpha = Math.max(0, Math.min(1, alpha));

      if (alpha < 0.02) continue;

      const px = s.x + mx * s.parallaxFactor;
      const py = s.y + my * s.parallaxFactor;

      // Use pre-rendered sprite instead of creating gradient each frame
      const srcX = s.colorIdx * cellSize;
      const srcY = s.sizeIdx * cellSize;
      const r = STAR_SIZES[s.sizeIdx];
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        spriteCanvas,
        srcX, srcY, cellSize, cellSize,
        px - r - 1, py - r - 1, cellSize, cellSize
      );
    }

    ctx.globalAlpha = 1;
  }, [getSprites]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reduced motion media query
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mql.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener("change", onMotionChange);

    // Visibility change — pause rendering when tab is hidden
    const onVisibilityChange = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current) {
        // Resume animation loop
        lastFrameRef = performance.now();
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const doResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
      persistentRef.current = createPersistentStars(w, h);
      transientRef.current = createTransientStars(w, h);
      drawStatic(w, h);
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const resize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 150);
    };

    doResize();
    window.addEventListener("resize", resize);

    // ── 输入源：桌面鼠标 / 移动端陀螺仪 ──
    let inputCleanup = () => {};
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    if (!isTouch) {
      // 桌面：鼠标视差
      const onMouse = (e: MouseEvent) => {
        targetMouseRef.current.x = e.clientX - window.innerWidth / 2;
        targetMouseRef.current.y = e.clientY - window.innerHeight / 2;
      };
      window.addEventListener("mousemove", onMouse);
      inputCleanup = () => window.removeEventListener("mousemove", onMouse);
    } else {
      // 移动端：陀螺仪视差
      // gamma: 左右倾斜 (±90°), beta: 前后倾斜 (±180°)
      const onOrientation = (e: DeviceOrientationEvent) => {
        if (e.gamma === null || e.beta === null) return;
        const { w, h } = sizeRef.current;
        // 映射到与鼠标相似的偏移量范围，45° 为手持自然角度基准
        targetMouseRef.current.x = e.gamma * (w / 90) * 0.5;
        targetMouseRef.current.y = (e.beta - 45) * (h / 180) * 0.5;
      };

      // iOS 13+ 需要用户授权才能访问陀螺仪
      type DOEWithPerm = typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<PermissionState>;
      };
      const DOE = DeviceOrientationEvent as DOEWithPerm;

      if (typeof DOE.requestPermission === "function") {
        DOE.requestPermission()
          .then((state) => {
            if (state === "granted") {
              window.addEventListener("deviceorientation", onOrientation, true);
            }
          })
          .catch(() => {
            // 静默失败，不影响其他功能
          });
      } else {
        // Android 和旧版 iOS：直接监听，无需授权
        window.addEventListener("deviceorientation", onOrientation, true);
      }
      inputCleanup = () =>
        window.removeEventListener("deviceorientation", onOrientation, true);
    }

    let running = true;
    let lastFrameRef = performance.now();

    const loop = (t: number) => {
      if (!running) return;
      // Skip rendering when tab is not visible
      if (!visibleRef.current) return;

      // Track frame time for adaptive degradation
      const delta = t - lastFrameRef;
      lastFrameRef = t;
      trackFrameTime(delta);

      drawFrame(ctx, t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      clearTimeout(resizeTimer);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      inputCleanup();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mql.removeEventListener("change", onMotionChange);
    };
  }, [drawFrame, drawStatic, trackFrameTime]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
