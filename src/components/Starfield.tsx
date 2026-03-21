import { useRef, useEffect, useCallback } from "react";

/* ── Types ── */

interface PersistentStar {
  x: number;
  y: number;
  size: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
  parallaxFactor: number;
}

interface TransientStar {
  x: number;
  y: number;
  size: number;
  color: string;
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

/* ── Constants ── */

const STAR_COLORS = ["#ffffff", "#ffe8d0", "#d0e8ff", "#e8d0ff", "#d0ffee"];
const PERSISTENT_COUNT = 90;
const TRANSIENT_COUNT = 280;

/* ── Helpers ── */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createPersistentStars(w: number, h: number): PersistentStar[] {
  return Array.from({ length: PERSISTENT_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: rand(0.6, 2.4),
    color: pick(STAR_COLORS),
    twinkleSpeed: rand(0.0008, 0.003),
    twinklePhase: rand(0, Math.PI * 2),
    parallaxFactor: rand(0.003, 0.015),
  }));
}

function spawnTransient(w: number, h: number, t: number): TransientStar {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: rand(0.3, 1.6),
    color: pick(STAR_COLORS),
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
    // stagger initial births so they don't all appear at once
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
  const persistentRef = useRef<PersistentStar[]>([]);
  const transientRef = useRef<TransientStar[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

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

  /* Draw dynamic layer every frame */
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const { w, h } = sizeRef.current;
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

      // Soft glow for larger stars
      if (s.size > 1.4) {
        const glowR = s.size * 5;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        grad.addColorStop(0, `rgba(255,255,255,${twinkle * 0.12})`);
        grad.addColorStop(0.5, `rgba(255,255,255,${twinkle * 0.03})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(px - glowR, py - glowR, glowR * 2, glowR * 2);
      }

      // Core dot with soft edge
      const coreR = s.size;
      const core = ctx.createRadialGradient(px, py, 0, px, py, coreR);
      core.addColorStop(0, s.color);
      core.addColorStop(0.6, s.color);
      core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = core;
      ctx.fillRect(px - coreR, py - coreR, coreR * 2, coreR * 2);
    }

    // ── Transient stars (random appear/disappear) ──
    for (const s of transientRef.current) {
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

      // Soft radial dot
      const r = s.size;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, s.color);
      grad.addColorStop(0.5, s.color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = grad;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }

    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mql.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener("change", onMotionChange);

    const resize = () => {
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

    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      targetMouseRef.current.x = e.clientX - window.innerWidth / 2;
      targetMouseRef.current.y = e.clientY - window.innerHeight / 2;
    };
    window.addEventListener("mousemove", onMouse);

    let running = true;
    const loop = (t: number) => {
      if (!running) return;
      drawFrame(ctx, t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      mql.removeEventListener("change", onMotionChange);
    };
  }, [drawFrame, drawStatic]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
