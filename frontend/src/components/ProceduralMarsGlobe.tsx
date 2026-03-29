/**
 * Procedural Mars globe — Canvas 2D ray-casting, ported from multi-agent HTML design.
 * Texture: random ellipses + craters + dust bands + polar ice (same as reference design).
 * Supports drag-to-rotate (360°) + scroll/pinch zoom, inertia, half-resolution offscreen render.
 */
import { useEffect, useRef, useCallback } from "react";

interface Props {
  className?: string;
}

// ---------- Texture constants ----------
const TW = 512;
const TH = 256;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// Generate equirectangular texture once (matches HTML MarsGlobe._makeTex)
let marsTexCache: Uint8ClampedArray | null = null;

function generateMarsTexture(): Uint8ClampedArray {
  if (marsTexCache) return marsTexCache;

  const oc = document.createElement("canvas");
  oc.width = TW;
  oc.height = TH;
  const c = oc.getContext("2d")!;

  // Base rust fill
  c.fillStyle = "#b03a14";
  c.fillRect(0, 0, TW, TH);

  // Large terrain patches
  const tones = [
    "#c24420","#cf4e28","#a02e10","#b83c18","#d05530",
    "#8a2508","#be3e1e","#d45830","#962e0e","#e06538",
  ];
  for (let i = 0; i < 130; i++) {
    const x  = Math.random() * TW;
    const y  = Math.random() * TH;
    const rx = Math.random() * 65 + 8;
    const ry = Math.random() * 28 + 6;
    c.beginPath();
    c.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    const alpha = Math.floor(55 + Math.random() * 105).toString(16).padStart(2, "0");
    c.fillStyle = tones[Math.floor(Math.random() * tones.length)] + alpha;
    c.fill();
  }

  // Fine-grained detail blobs
  for (let i = 0; i < 520; i++) {
    const x = Math.random() * TW;
    const y = Math.random() * TH;
    const r = Math.random() * 16 + 1;
    const h = Math.random() * 30 + 5;
    const l = Math.random() * 32 + 18;
    const a = Math.random() * 0.52;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = `hsla(${h},62%,${l}%,${a})`;
    c.fill();
  }

  // Dust band streaks
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * TW;
    const y = TH * 0.25 + Math.random() * TH * 0.5;
    c.beginPath();
    c.ellipse(x, y, Math.random() * 85 + 18, Math.random() * 20 + 5, Math.random() * 0.6, 0, Math.PI * 2);
    c.fillStyle = `rgba(205,135,72,${Math.random() * 0.2 + 0.04})`;
    c.fill();
  }

  // Impact craters (dark circles)
  for (let i = 0; i < 38; i++) {
    const x = Math.random() * TW;
    const y = Math.random() * TH;
    const r = Math.random() * 11 + 2;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = `rgba(35,12,4,${Math.random() * 0.28 + 0.08})`;
    c.fill();
  }

  // North polar ice cap
  const ng = c.createRadialGradient(TW / 2, 0, 0, TW / 2, 0, TH * 0.22);
  ng.addColorStop(0,    "rgba(235,228,218,.98)");
  ng.addColorStop(0.55, "rgba(218,212,202,.55)");
  ng.addColorStop(0.85, "rgba(200,194,184,.18)");
  ng.addColorStop(1,    "rgba(190,184,174,0)");
  c.fillStyle = ng;
  c.fillRect(0, 0, TW, TH * 0.3);

  // South polar ice cap
  const sg = c.createRadialGradient(TW / 2, TH, 0, TW / 2, TH, TH * 0.15);
  sg.addColorStop(0,   "rgba(228,222,212,.9)");
  sg.addColorStop(0.6, "rgba(210,204,194,.38)");
  sg.addColorStop(1,   "rgba(195,189,179,0)");
  c.fillStyle = sg;
  c.fillRect(0, TH * 0.78, TW, TH * 0.22);

  marsTexCache = c.getImageData(0, 0, TW, TH).data;
  return marsTexCache;
}

// ---------- Component ----------
export default function ProceduralMarsGlobe({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Off-screen canvas for half-res rendering (perf ~4x)
  const offRef = useRef<HTMLCanvasElement | null>(null);

  const stateRef = useRef({
    rot:      1.1,   // yaw rotation (radians)
    pitch:    0.0,   // vertical tilt (radians)
    scale:    1.0,
    dragging: false,
    lx: 0, ly: 0,
    velX: 0, velY: 0,
    rafId:    0,
    tick:     0,
  });

  const getOffCanvas = useCallback((halfSize: number) => {
    if (!offRef.current) {
      offRef.current = document.createElement("canvas");
    }
    const oc = offRef.current;
    if (oc.width !== halfSize || oc.height !== halfSize) {
      oc.width  = halfSize;
      oc.height = halfSize;
    }
    return oc;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { rot, pitch, scale, tick } = stateRef.current;
    const SZ = canvas.width;
    const R  = SZ / 2;

    // Half-resolution offscreen sphere
    const radius  = R * 0.94 * scale;
    const HALF    = Math.round(SZ / 2);
    const HR      = HALF / 2;
    const offCv   = getOffCanvas(HALF);
    const oc      = offCv.getContext("2d")!;
    const id      = oc.createImageData(HALF, HALF);
    const d       = id.data;

    const tex     = generateMarsTexture();
    const I2P     = 1 / (Math.PI * 2);
    const IP      = 1 / Math.PI;
    // Light direction (top-left, matching reference)
    const LX = -0.38, LY = -0.52, LZ = 0.76;
    const AMB = 0.2;

    const sinP = Math.sin(pitch);
    const cosP = Math.cos(pitch);

    for (let py = 0; py < HALF; py++) {
      const ny  = (py - HR) / HR;
      const ny2 = ny * ny;
      for (let px = 0; px < HALF; px++) {
        const nx  = (px - HR) / HR;
        const d2  = nx * nx + ny2;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2);

        // Apply pitch rotation
        const ry2 = ny * cosP - nz * sinP;
        const rz2 = ny * sinP + nz * cosP;

        const ph = Math.asin(clamp(-ry2, -1, 1));
        const th = Math.atan2(nx, rz2) + rot;

        let tx = (((th * I2P) % 1 + 1) % 1 * TW) | 0;
        let ty = ((0.5 - ph * IP) * TH) | 0;
        if (tx >= TW) tx = TW - 1;
        if (ty < 0)   ty = 0;
        if (ty >= TH) ty = TH - 1;

        const ti   = (ty * TW + tx) * 4;
        const diff = Math.max(0, nx * LX + (-ry2) * LY + rz2 * LZ);
        const lt   = AMB + (1 - AMB) * diff;
        const pi   = (py * HALF + px) * 4;

        d[pi]     = Math.min(255, (tex[ti]     * lt * 1.08) | 0);
        d[pi + 1] = Math.min(255, (tex[ti + 1] * lt * 0.94) | 0);
        d[pi + 2] = Math.min(255, (tex[ti + 2] * lt * 0.82) | 0);
        d[pi + 3] = 255;
      }
    }
    oc.putImageData(id, 0, 0);

    // Scale up to main canvas (GPU bilinear smooth)
    ctx.clearRect(0, 0, SZ, SZ);
    ctx.imageSmoothingEnabled  = true;
    ctx.imageSmoothingQuality  = "high";

    // Clip to circle first
    ctx.save();
    ctx.beginPath();
    ctx.arc(R, R, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(offCv, R - radius, R - radius, radius * 2, radius * 2);
    ctx.restore();

    // Atmosphere halo
    const ag = ctx.createRadialGradient(R, R, radius * 0.88, R, R, radius * 1.15);
    ag.addColorStop(0,    "rgba(210,90,35,0)");
    ag.addColorStop(0.35, "rgba(200,72,28,.13)");
    ag.addColorStop(0.7,  "rgba(180,52,18,.24)");
    ag.addColorStop(1,    "rgba(160,42,12,0)");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(R, R, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    const spec = ctx.createRadialGradient(
      R - radius * 0.28, R - radius * 0.30, 0,
      R - radius * 0.28, R - radius * 0.30, radius * 0.55,
    );
    spec.addColorStop(0, "rgba(255,195,145,.09)");
    spec.addColorStop(1, "rgba(255,195,145,0)");
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(R, R, radius, 0, Math.PI * 2);
    ctx.fill();

    // Limb darkening
    ctx.save();
    ctx.beginPath();
    ctx.arc(R, R, radius, 0, Math.PI * 2);
    ctx.clip();
    const limb = ctx.createRadialGradient(R, R, radius * 0.55, R, R, radius);
    limb.addColorStop(0,   "rgba(0,0,0,0)");
    limb.addColorStop(0.7, "rgba(0,0,0,0.06)");
    limb.addColorStop(1,   "rgba(0,0,0,0.50)");
    ctx.fillStyle = limb;
    ctx.fillRect(0, 0, SZ, SZ);
    ctx.restore();

    // tick for external use
    stateRef.current.tick = tick + 1;
  }, [getOffCanvas]);

  // Animation loop: auto-rotate + inertia
  useEffect(() => {
    const s = stateRef.current;

    const loop = () => {
      if (!s.dragging) {
        s.velX *= 0.92;
        s.velY *= 0.92;
        if (Math.abs(s.velX) < 0.0008 && Math.abs(s.velY) < 0.0008) {
          s.velX = 0.003; // default auto-rotate speed (matching reference: .003)
        }
        s.rot   += s.velX;
        s.pitch += s.velY;
        s.pitch = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
      }
      render();
      s.rafId = requestAnimationFrame(loop);
    };

    render();
    s.rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.rafId);
  }, [render]);

  // Pointer drag
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    s.dragging = true;
    s.lx = e.clientX;
    s.ly = e.clientY;
    s.velX = 0;
    s.velY = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lx;
    const dy = e.clientY - s.ly;
    s.velX = dx * 0.0065;
    s.velY = dy * 0.004;
    s.rot   += s.velX;
    s.pitch += s.velY;
    s.pitch = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    s.lx = e.clientX;
    s.ly = e.clientY;
    render();
  }, [render]);

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  // Scroll zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    s.scale = clamp(s.scale * (e.deltaY > 0 ? 0.92 : 1.09), 0.5, 3);
    render();
  }, [render]);

  // Pinch zoom
  const touchRef = useRef({ dist: 0 });
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.dist = Math.hypot(dx, dy);
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const s = stateRef.current;
      s.scale = clamp(s.scale * (newDist / touchRef.current.dist), 0.5, 3);
      touchRef.current.dist = newDist;
      render();
    }
  }, [render]);

  // Resize observer — update canvas physical size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
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
