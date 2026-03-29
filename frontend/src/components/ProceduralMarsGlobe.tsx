/**
 * Procedural Mars globe — Canvas 2D ray-casting with drag-to-rotate (360°) + pinch/scroll zoom.
 * Zero external dependencies. Photorealistic texture via multi-octave fBm noise.
 */
import { useEffect, useRef, useCallback } from "react";

interface Props {
  className?: string;
}

// ---------- Noise helpers ----------
function hash(x: number, y: number): number {
  let h = ((x * 1619 + y * 31337) ^ (x * 31337 + y * 1619)) & 0x7fffffff;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return (h & 0x7fffffff) / 0x7fffffff;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = smoothstep(fx);
  const uy = smoothstep(fy);
  return lerp(
    lerp(hash(ix, iy), hash(ix + 1, iy), ux),
    lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), ux),
    uy
  );
}

function fbm(x: number, y: number, octaves = 7): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * valueNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.07;
  }
  return val;
}

// ---------- Texture generation (cached) ----------
const TEX_SIZE = 768;
let marsTexture: ImageData | null = null;

function generateMarsTexture(): ImageData {
  if (marsTexture) return marsTexture;
  const data = new Uint8ClampedArray(TEX_SIZE * TEX_SIZE * 4);

  for (let ty = 0; ty < TEX_SIZE; ty++) {
    for (let tx = 0; tx < TEX_SIZE; tx++) {
      const u = tx / TEX_SIZE;
      const v = ty / TEX_SIZE;

      // Equirectangular → sphere coords for seamless wrapping
      const lon = u * Math.PI * 2;
      const lat = (v - 0.5) * Math.PI;
      const sx = Math.cos(lat) * Math.cos(lon);
      const sy = Math.sin(lat);
      const sz = Math.cos(lat) * Math.sin(lon);

      // Multi-scale noise
      const n1 = fbm(sx * 2.5 + 10, sy * 2.5 + sz * 2.5, 8);
      const n2 = fbm(sx * 5.5 + 20, sy * 5.5 + sz * 5.5, 6);
      const n3 = fbm(sx * 11 + 5, sy * 11 + sz * 11, 5);
      const n4 = fbm(sx * 22, sy * 22 + sz * 22, 4);

      const base = n1 * 0.52 + n2 * 0.28 + n3 * 0.14 + n4 * 0.06;

      // ── 6-tier Mars color palette ──
      let r: number, g: number, b: number;

      if (base > 0.72) {
        // Highland — ochre orange (Tharsis plateau style)
        const t = (base - 0.72) / 0.28;
        r = lerp(195, 218, t);
        g = lerp(105, 125, t);
        b = lerp(45, 58, t);
      } else if (base > 0.55) {
        // Plains — rust red
        const t = (base - 0.55) / 0.17;
        r = lerp(165, 195, t);
        g = lerp(72, 105, t);
        b = lerp(32, 45, t);
      } else if (base > 0.40) {
        // Lowland — dark ochre-red
        const t = (base - 0.40) / 0.15;
        r = lerp(128, 165, t);
        g = lerp(52, 72, t);
        b = lerp(24, 32, t);
      } else if (base > 0.26) {
        // Basin — dark brown
        const t = (base - 0.26) / 0.14;
        r = lerp(90, 128, t);
        g = lerp(36, 52, t);
        b = lerp(16, 24, t);
      } else {
        // Canyon floor — near-black brown
        const t = base / 0.26;
        r = lerp(52, 90, t);
        g = lerp(20, 36, t);
        b = lerp(8, 16, t);
      }

      // ── Valles Marineris (wide canyon system) ──
      const vmPerturbation = 0.28 * valueNoise(lon * 2, lat * 8);
      const vmLat = lat + 0.055 + vmPerturbation * 0.04;
      const vmLon = ((lon - 5.2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const vmMask =
        clamp(1 - Math.abs(vmLat) / 0.18, 0, 1) *
        clamp(1 - Math.abs(Math.sin(vmLon * 0.5 - 0.4)) / 0.55, 0, 1);
      if (vmMask > 0) {
        const depth = vmMask * 0.72;
        r = lerp(r, r * 0.52, depth);
        g = lerp(g, g * 0.47, depth);
        b = lerp(b, b * 0.42, depth);
      }

      // ── Olympus Mons (bright highland dome) ──
      const omLon = ((lon - 2.6) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const omDist = Math.sqrt(omLon * omLon + (lat - 0.32) * (lat - 0.32));
      const omMask = clamp(1 - omDist / 0.22, 0, 1);
      if (omMask > 0) {
        const lift = omMask * omMask * 0.55;
        r = clamp(r + 28 * lift, 0, 255);
        g = clamp(g + 18 * lift, 0, 255);
        b = clamp(b + 8 * lift, 0, 255);
      }

      // ── Hellas Basin (dark depression) ──
      const hbLon = ((lon - 4.4) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const hbDist = Math.sqrt((hbLon * 0.7) * (hbLon * 0.7) + (lat + 0.75) * (lat + 0.75));
      const hbMask = clamp(1 - hbDist / 0.35, 0, 1);
      if (hbMask > 0) {
        const depth = hbMask * hbMask * 0.45;
        r = lerp(r, r * 0.62, depth);
        g = lerp(g, g * 0.58, depth);
        b = lerp(b, b * 0.55, depth);
      }

      // ── Polar ice caps ──
      const latAbs = Math.abs(lat) / (Math.PI / 2);
      const polarBlend = clamp((latAbs - 0.80) / 0.20, 0, 1);
      if (polarBlend > 0) {
        const pb = polarBlend * polarBlend;
        // Cold white with blue tint
        r = lerp(r, 195, pb);
        g = lerp(g, 210, pb);
        b = lerp(b, 225, pb);
      }

      // ── Fine dust texture overlay ──
      const dust = n4 * 0.12 - 0.06;
      r = clamp(r + dust * 15, 0, 255);
      g = clamp(g + dust * 10, 0, 255);

      const idx = (ty * TEX_SIZE + tx) * 4;
      data[idx]     = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  marsTexture = new ImageData(data, TEX_SIZE, TEX_SIZE);
  return marsTexture;
}

// ---------- Component ----------
export default function ProceduralMarsGlobe({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    yaw: 0.4,
    pitch: 0.12,
    scale: 1,
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rafId: 0,
    texCanvas: null as HTMLCanvasElement | null,
  });

  const getTexCanvas = useCallback(() => {
    const s = stateRef.current;
    if (s.texCanvas) return s.texCanvas;
    const tc = document.createElement("canvas");
    tc.width = TEX_SIZE;
    tc.height = TEX_SIZE;
    tc.getContext("2d")!.putImageData(generateMarsTexture(), 0, 0);
    s.texCanvas = tc;
    return tc;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { yaw, pitch, scale } = stateRef.current;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.47 * scale;

    ctx.clearRect(0, 0, W, H);

    // Ray-cast sphere
    const texCanvas = getTexCanvas();
    const texCtx = texCanvas.getContext("2d")!;
    const texData = texCtx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
    const imgData = ctx.createImageData(W, H);

    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);

    // Light direction (top-right, normalized)
    const lx = 0.55, ly = -0.65, lz = 0.52;

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const nx = (px - cx) / radius;
        const ny = (py - cy) / radius;
        const nz2 = 1 - nx * nx - ny * ny;
        if (nz2 < 0) continue;
        const nz = Math.sqrt(nz2);

        // Rotate by pitch
        const ry = ny * cosPitch - nz * sinPitch;
        const rz = ny * sinPitch + nz * cosPitch;

        // Spherical coords
        const lat = Math.asin(clamp(ry, -1, 1));
        const lon = Math.atan2(nx, rz) + yaw;

        const u = ((lon / (Math.PI * 2)) % 1 + 1) % 1;
        const v = (lat + Math.PI / 2) / Math.PI;

        const tx = Math.floor(u * (TEX_SIZE - 1));
        const ty2 = Math.floor(v * (TEX_SIZE - 1));
        const ti = (ty2 * TEX_SIZE + tx) * 4;

        // Non-linear Lambert shading
        const rawDiff = lx * nx + ly * ny + lz * nz;
        const diff = rawDiff * rawDiff * 0.35 + rawDiff * 0.65;
        const d = clamp(diff, 0.03, 1.0);

        const pi = (py * W + px) * 4;
        imgData.data[pi]     = clamp(texData.data[ti]     * d * 1.12, 0, 255);
        imgData.data[pi + 1] = clamp(texData.data[ti + 1] * d * 1.06, 0, 255);
        imgData.data[pi + 2] = clamp(texData.data[ti + 2] * d, 0, 255);
        imgData.data[pi + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // ── Atmospheric edge glow (blue + orange rim) ──
    const atmosBlue = ctx.createRadialGradient(cx, cy, radius * 0.86, cx, cy, radius * 1.14);
    atmosBlue.addColorStop(0, "rgba(78,168,217,0)");
    atmosBlue.addColorStop(0.55, "rgba(78,168,217,0.10)");
    atmosBlue.addColorStop(0.8, "rgba(78,168,217,0.05)");
    atmosBlue.addColorStop(1, "rgba(78,168,217,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.14, 0, Math.PI * 2);
    ctx.fillStyle = atmosBlue;
    ctx.fill();

    // Orange atmosphere on terminator side
    const atmosOrange = ctx.createRadialGradient(
      cx + radius * 0.3, cy + radius * 0.2, radius * 0.7,
      cx + radius * 0.3, cy + radius * 0.2, radius * 1.1
    );
    atmosOrange.addColorStop(0, "rgba(200,100,50,0)");
    atmosOrange.addColorStop(0.6, "rgba(200,100,50,0.08)");
    atmosOrange.addColorStop(1, "rgba(200,100,50,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = atmosOrange;
    ctx.fill();

    // ── Specular highlight ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const spec = ctx.createRadialGradient(
      cx - radius * 0.30, cy - radius * 0.30, 0,
      cx - radius * 0.10, cy - radius * 0.08, radius * 0.60
    );
    spec.addColorStop(0, "rgba(255,240,220,0.14)");
    spec.addColorStop(0.4, "rgba(255,220,180,0.06)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ── Edge darkening (limb effect) ──
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    const limb = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius);
    limb.addColorStop(0, "rgba(0,0,0,0)");
    limb.addColorStop(0.7, "rgba(0,0,0,0.08)");
    limb.addColorStop(1, "rgba(0,0,0,0.52)");
    ctx.fillStyle = limb;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }, [getTexCanvas]);

  // Auto-rotate + inertia loop
  useEffect(() => {
    const s = stateRef.current;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      if (!s.dragging) {
        // Inertia decay
        s.velX *= 0.91;
        s.velY *= 0.91;
        // Slow auto-rotate when nearly idle
        if (Math.abs(s.velX) < 0.0008 && Math.abs(s.velY) < 0.0008) {
          s.velX = 0.0003 * (dt / 16.7);
        }
        if (Math.abs(s.velX) > 0.00005 || Math.abs(s.velY) > 0.00005) {
          s.yaw += s.velX;
          s.pitch += s.velY;
          s.pitch = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
          render();
        }
      }
      s.rafId = requestAnimationFrame(loop);
    };

    render();
    s.rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.rafId);
  }, [render]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    s.dragging = true;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    s.velX = 0;
    s.velY = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastX;
    const dy = e.clientY - s.lastY;
    s.velX = dx * 0.005;
    s.velY = dy * 0.005;
    s.yaw += s.velX;
    s.pitch += s.velY;
    s.pitch = clamp(s.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    render();
  }, [render]);

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    s.scale = clamp(s.scale * (e.deltaY > 0 ? 0.92 : 1.09), 0.5, 3);
    render();
  }, [render]);

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

  // ResizeObserver — re-init canvas size on container resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
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
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
          cursor: "grab",
          clipPath: "circle(50% at 50% 50%)",
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
