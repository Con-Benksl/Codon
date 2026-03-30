import { useRef, useEffect } from "react";

const STAR_COUNT = 50;
const STAR_COLORS = ["#ffffff", "#e0e0e5", "#80f2ff", "#b580ff", "#ff80aa"];

interface Star {
  x: number;
  y: number;
  r: number;
  color: string;
  twinkleSpeed: number;
  twinklePhase: number;
}

function createStars(w: number, h: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 1.2 + 0.3,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    twinkleSpeed: Math.random() * 0.002 + 0.0008,
    twinklePhase: Math.random() * Math.PI * 2,
  }));
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mql.matches;
    const onMotionChange = (e: MediaQueryListEvent) => { reducedMotion = e.matches; };
    mql.addEventListener("change", onMotionChange);

    let stars: Star[] = [];
    let w = 0;
    let h = 0;

    const doResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = createStars(w, h);
    };

    doResize();
    let resizeTimer: ReturnType<typeof setTimeout>;
    const resize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(doResize, 200); };
    window.addEventListener("resize", resize);

    let running = true;
    let visible = true;

    const onVis = () => {
      visible = document.visibilityState === "visible";
      if (visible) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    let raf = 0;
    const loop = (t: number) => {
      if (!running || !visible) return;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        const alpha = reducedMotion
          ? 0.7
          : 0.4 + 0.6 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      mql.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
