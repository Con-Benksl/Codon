/**
 * Photorealistic Mars globe using real 8K NASA texture.
 * Ray-cast sphere rendering with Lambert shading, limb darkening,
 * atmospheric glow, specular highlight, and terminator.
 * Drag to rotate 360°, scroll/pinch to zoom.
 */
import { useEffect, useRef, useCallback } from "react";

interface Props {
  className?: string;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// ── Texture cache ─────────────────────────────────────────
interface TexCache {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}
let texCache: TexCache | null = null;
let texLoading = false;
const texCallbacks: Array<() => void> = [];

function loadTexture(onReady: () => void) {
  if (texCache) { onReady(); return; }
  texCallbacks.push(onReady);
  if (texLoading) return;
  texLoading = true;

  const img = new Image();
  img.src = "/textures/8k_mars.jpg";
  img.onload = () => {
    const tc = document.createElement("canvas");
    tc.width  = img.naturalWidth;
    tc.height = img.naturalHeight;
    const ctx = tc.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    texCache = { canvas: tc, ctx, w: tc.width, h: tc.height };
    texCallbacks.forEach(cb => cb());
    texCallbacks.length = 0;
  };
  img.onerror = () => {
    // fallback: procedural rust texture
    const W = 1024, H = 512;
    const tc = document.createElement("canvas");
    tc.width = W; tc.height = H;
    const ctx = tc.getContext("2d")!;
    ctx.fillStyle = "#b03a14";
    ctx.fillRect(0, 0, W, H);
    const tones = ["#c24420","#cf4e28","#a02e10","#b83c18","#d05530","#8a2508"];
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random()*W, Math.random()*H, Math.random()*80+10, Math.random()*35+8, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fillStyle = tones[Math.floor(Math.random()*tones.length)] + Math.floor(60+Math.random()*100).toString(16).padStart(2,"0");
      ctx.fill();
    }
    texCache = { canvas: tc, ctx, w: W, h: H };
    texCallbacks.forEach(cb => cb());
    texCallbacks.length = 0;
  };
}

// ── Component ─────────────────────────────────────────────
export default function ProceduralMarsGlobe({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offRef    = useRef<HTMLCanvasElement | null>(null);
  const texDataRef = useRef<ImageData | null>(null);

  const stateRef = useRef({
    yaw:      0.4,
    pitch:    0.08,
    scale:    1.0,
    dragging: false,
    lx: 0, ly: 0,
    velX: 0, velY: 0,
    rafId:    0,
    ready:    false,
  });

  // Pre-extract ImageData once so we can sample pixels fast
  const ensureTexData = useCallback(() => {
    if (texDataRef.current || !texCache) return;
    texDataRef.current = texCache.ctx.getImageData(0, 0, texCache.w, texCache.h);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.ready) return;
    ensureTexData();
    const texData = texDataRef.current;
    if (!texData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { yaw, pitch, scale } = stateRef.current;
    const W  = canvas.width;
    const H  = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R  = Math.min(W, H) * 0.46 * scale;

    // Half-res offscreen for performance
    const HALF = Math.round(Math.min(W, H) / 2);
    const HR   = HALF / 2;
    if (!offRef.current) offRef.current = document.createElement("canvas");
    const oc = offRef.current;
    if (oc.width !== HALF || oc.height !== HALF) {
      oc.width = HALF; oc.height = HALF;
    }
    const octx = oc.getContext("2d")!;
    const id   = octx.createImageData(HALF, HALF);
    const d    = id.data;

    const TW = texData.width;
    const TH = texData.height;
    const td = texData.data;

    // Light direction — upper-left, like the Earth photo reference
    const LX = -0.42, LY = -0.58, LZ = 0.70;
    const AMB = 0.08;  // very low ambient → strong day/night contrast

    const sinP = Math.sin(pitch);
    const cosP = Math.cos(pitch);
    const I2P  = 1 / (Math.PI * 2);
    const IP   = 1 / Math.PI;

    for (let py = 0; py < HALF; py++) {
      const ny  = (py - HR) / HR;
      const ny2 = ny * ny;
      for (let px = 0; px < HALF; px++) {
        const nx = (px - HR) / HR;
        const d2 = nx * nx + ny2;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2);

        // Pitch rotation
        const ry = ny * cosP - nz * sinP;
        const rz = ny * sinP + nz * cosP;

        const ph = Math.asin(clamp(-ry, -1, 1));
        const th = Math.atan2(nx, rz) + yaw;

        let tx = (((th * I2P) % 1 + 1) % 1 * TW) | 0;
        let ty = ((0.5 - ph * IP) * TH) | 0;
        if (tx >= TW) tx = TW - 1;
        if (ty < 0)   ty = 0;
        if (ty >= TH) ty = TH - 1;

        const ti = (ty * TW + tx) * 4;

        // Lambert diffuse
        const rawDiff = nx * LX + (-ry) * LY + rz * LZ;
        // Non-linear shading — sharper terminator
        const diff = rawDiff > 0
          ? rawDiff * rawDiff * 0.5 + rawDiff * 0.5
          : 0;
        const lt = AMB + (1 - AMB) * diff;

        // Limb darkening factor (edges of sphere darker)
        const limbFactor = Math.pow(nz, 0.35);

        const bright = lt * limbFactor;

        const pi = (py * HALF + px) * 4;
        d[pi]     = clamp((td[ti]     * bright * 1.05) | 0, 0, 255);
        d[pi + 1] = clamp((td[ti + 1] * bright * 1.00) | 0, 0, 255);
        d[pi + 2] = clamp((td[ti + 2] * bright * 0.95) | 0, 0, 255);
        d[pi + 3] = 255;
      }
    }
    octx.putImageData(id, 0, 0);

    // Scale up to main canvas
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Clip to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(oc, cx - R, cy - R, R * 2, R * 2);
    ctx.restore();

    // ── Atmospheric rim glow (orange-red, thin) ──
    const atmR = R * 1.02;
    const atm = ctx.createRadialGradient(cx, cy, R * 0.90, cx, cy, atmR);
    atm.addColorStop(0,    "rgba(220,100,40,0)");
    atm.addColorStop(0.4,  "rgba(210,80,30,0.18)");
    atm.addColorStop(0.75, "rgba(185,60,20,0.28)");
    atm.addColorStop(1,    "rgba(160,40,10,0)");
    ctx.fillStyle = atm;
    ctx.beginPath();
    ctx.arc(cx, cy, atmR, 0, Math.PI * 2);
    ctx.fill();

    // ── Specular highlight (upper-left) ──
    const specX = cx - R * 0.30;
    const specY = cy - R * 0.32;
    const spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, R * 0.55);
    spec.addColorStop(0,   "rgba(255,210,170,0.18)");
    spec.addColorStop(0.4, "rgba(255,200,160,0.07)");
    spec.addColorStop(1,   "rgba(255,200,160,0)");
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ── Hard limb darkening ring ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    const limb = ctx.createRadialGradient(cx, cy, R * 0.60, cx, cy, R);
    limb.addColorStop(0,   "rgba(0,0,0,0)");
    limb.addColorStop(0.65, "rgba(0,0,0,0.10)");
    limb.addColorStop(0.88, "rgba(0,0,0,0.38)");
    limb.addColorStop(1,   "rgba(0,0,0,0.72)");
    ctx.fillStyle = limb;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }, [ensureTexData]);

  // Init + animation loop
  useEffect(() => {
    const s = stateRef.current;

    loadTexture(() => {
      s.ready = true;
      ensureTexData();
      render();
    });

    const loop = () => {
      if (s.ready) {
        if (!s.dragging) {
          s.velX *= 0.92;
          s.velY *= 0.92;
          if (Math.abs(s.velX) < 0.0005 && Math.abs(s.velY) < 0.0005) {
            s.velX = 0.0018; // gentle auto-rotate
          }
          s.yaw   += s.velX;
          s.pitch += s.velY;
          s.pitch  = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
        }
        render();
      }
      s.rafId = requestAnimationFrame(loop);
    };
    s.rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.rafId);
  }, [render, ensureTexData]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    s.dragging = true;
    s.lx = e.clientX; s.ly = e.clientY;
    s.velX = 0; s.velY = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lx;
    const dy = e.clientY - s.ly;
    s.velX = dx * 0.005;
    s.velY = dy * 0.004;
    s.yaw   += s.velX;
    s.pitch += s.velY;
    s.pitch  = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    s.lx = e.clientX; s.ly = e.clientY;
    render();
  }, [render]);

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    s.scale = clamp(s.scale * (e.deltaY > 0 ? 0.93 : 1.08), 0.4, 3.5);
    render();
  }, [render]);

  const touchRef = useRef({ dist: 0 });
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchRef.current.dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const s = stateRef.current;
      s.scale = clamp(s.scale * (dist / touchRef.current.dist), 0.4, 3.5);
      touchRef.current.dist = dist;
      render();
    }
  }, [render]);

  // Resize → update canvas physical size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      texDataRef.current = null; // force re-extract at new scale
      render();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [render]);

  return (
    <div
      className={className}
      style={{ borderRadius: "50%", overflow: "hidden", position: "relative" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width:       "100%",
          height:      "100%",
          display:     "block",
          touchAction: "none",
          cursor:      "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      />
    </div>
  );
}
