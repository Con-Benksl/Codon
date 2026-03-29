/**
 * Procedural Mars globe — Canvas 2D with drag-to-rotate (360°) + pinch/scroll zoom.
 * Zero external dependencies. Texture generated once via OffscreenCanvas.
 */
import { useEffect, useRef, useCallback } from "react";

interface Props {
  className?: string;
}

// ---------- Noise helpers (value noise) ----------
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

function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = smoothstep(fx);
  const uy = smoothstep(fy);
  const v00 = hash(ix, iy);
  const v10 = hash(ix + 1, iy);
  const v01 = hash(ix, iy + 1);
  const v11 = hash(ix + 1, iy + 1);
  return lerp(lerp(v00, v10, ux), lerp(v01, v11, ux), uy);
}

function fbm(x: number, y: number, octaves = 6): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * valueNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

// ---------- Texture generation (runs once) ----------
const TEX_SIZE = 512;
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

      const n1 = fbm(sx * 3 + 10, sy * 3 + sz * 3, 7);
      const n2 = fbm(sx * 6 + 20, sy * 6 + sz * 6, 5);
      const n3 = fbm(sx * 12, sy * 12 + sz * 12, 4);

      const base = n1 * 0.55 + n2 * 0.3 + n3 * 0.15;

      // Mars color palette: rust reds, ochres, dark browns
      const r = lerp(110, 210, Math.pow(base, 0.8));
      const g = lerp(45, 110, Math.pow(base, 1.1));
      const b = lerp(20, 55, Math.pow(base, 1.4));

      // Polar ice caps
      const latAbs = Math.abs(lat) / (Math.PI / 2);
      const polarBlend = Math.max(0, (latAbs - 0.82) / 0.18);
      const pr = lerp(r, 200, polarBlend);
      const pg = lerp(g, 210, polarBlend);
      const pb = lerp(b, 220, polarBlend);

      // Valles Marineris-style dark trench
      const trenchMask = Math.max(0, 1 - Math.abs(lat + 0.05) / 0.12) *
        Math.max(0, 1 - Math.abs(Math.sin(lon - 0.5)) / 0.6);
      const tr = lerp(pr, pr * 0.6, trenchMask * 0.6);
      const tg = lerp(pg, pg * 0.55, trenchMask * 0.6);
      const tb = lerp(pb, pb * 0.5, trenchMask * 0.6);

      const idx = (ty * TEX_SIZE + tx) * 4;
      data[idx] = Math.min(255, tr);
      data[idx + 1] = Math.min(255, tg);
      data[idx + 2] = Math.min(255, tb);
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
    yaw: 0.4,      // longitude rotation
    pitch: 0.15,   // latitude rotation
    scale: 1,
    dragging: false,
    lastX: 0,
    lastY: 0,
    velX: 0,
    velY: 0,
    rafId: 0,
    texCanvas: null as HTMLCanvasElement | null,
  });

  // Bake texture to an offscreen canvas (reuse per render)
  const getTexCanvas = useCallback(() => {
    const s = stateRef.current;
    if (s.texCanvas) return s.texCanvas;
    const tc = document.createElement("canvas");
    tc.width = TEX_SIZE;
    tc.height = TEX_SIZE;
    const ctx = tc.getContext("2d")!;
    ctx.putImageData(generateMarsTexture(), 0, 0);
    s.texCanvas = tc;
    return tc;
  }, []);

  // Main render function
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
    const radius = Math.min(W, H) * 0.46 * scale;

    ctx.clearRect(0, 0, W, H);

    // --- Draw globe via ray-casting (pixel-accurate sphere) ---
    const texCanvas = getTexCanvas();
    const imgData = ctx.createImageData(W, H);
    const texCtx = texCanvas.getContext("2d")!;
    const texData = texCtx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);

    const sinPitch = Math.sin(pitch);
    const cosPitch = Math.cos(pitch);

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
        const lat = Math.asin(ry);
        const lon = Math.atan2(nx, rz) + yaw;

        // UV from equirectangular
        let u = ((lon / (Math.PI * 2)) % 1 + 1) % 1;
        const v = (lat + Math.PI / 2) / Math.PI;

        const tx = Math.floor(u * (TEX_SIZE - 1));
        const ty = Math.floor(v * (TEX_SIZE - 1));
        const ti = (ty * TEX_SIZE + tx) * 4;

        // Lambert diffuse lighting
        // Light direction: top-left (0.6, -0.7, 0.3) normalised
        const lx = 0.6, ly = -0.7, lz = 0.3;
        const diff = Math.max(0.08, lx * nx + ly * ny + lz * nz);

        const pi = (py * W + px) * 4;
        imgData.data[pi]     = Math.min(255, texData.data[ti]     * diff * 1.1);
        imgData.data[pi + 1] = Math.min(255, texData.data[ti + 1] * diff * 1.05);
        imgData.data[pi + 2] = Math.min(255, texData.data[ti + 2] * diff);
        imgData.data[pi + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Atmospheric glow rim
    const grd = ctx.createRadialGradient(cx, cy, radius * 0.88, cx, cy, radius * 1.12);
    grd.addColorStop(0, "rgba(78,168,217,0)");
    grd.addColorStop(0.6, "rgba(78,168,217,0.12)");
    grd.addColorStop(1, "rgba(78,168,217,0.0)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.12, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Specular highlight
    const spec = ctx.createRadialGradient(
      cx - radius * 0.28, cy - radius * 0.28, 0,
      cx - radius * 0.1,  cy - radius * 0.1,  radius * 0.55
    );
    spec.addColorStop(0, "rgba(255,255,255,0.1)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    // Edge darkening
    const edge = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius);
    edge.addColorStop(0, "rgba(0,0,0,0)");
    edge.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = edge;
    ctx.fill();
  }, [getTexCanvas]);

  // Inertia loop
  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.dragging) {
      s.velX *= 0.92;
      s.velY *= 0.92;
      if (Math.abs(s.velX) > 0.0001 || Math.abs(s.velY) > 0.0001) {
        s.yaw += s.velX;
        s.pitch += s.velY;
        s.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, s.pitch));
        render();
      }
    }
    s.rafId = requestAnimationFrame(tick);
  }, [render]);

  // Slow auto-rotate when idle
  useEffect(() => {
    const s = stateRef.current;
    let lastTime = performance.now();
    const autoRotate = () => {
      if (!s.dragging && Math.abs(s.velX) < 0.0005) {
        const now = performance.now();
        const dt = now - lastTime;
        lastTime = now;
        s.yaw += 0.0003 * dt * 0.06;
        render();
      }
      s.rafId = requestAnimationFrame(autoRotate);
    };
    render(); // initial draw
    s.rafId = requestAnimationFrame(autoRotate);
    return () => cancelAnimationFrame(s.rafId);
  }, [render]);

  // Drag handlers
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
    s.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, s.pitch));
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    render();
  }, [render]);

  const onPointerUp = useCallback(() => {
    stateRef.current.dragging = false;
  }, []);

  // Scroll zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    s.scale = Math.max(0.5, Math.min(3, s.scale * delta));
    render();
  }, [render]);

  // Pinch zoom (touch)
  const touchRef = useRef({ dist: 0 });
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.dist = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const ratio = newDist / touchRef.current.dist;
      const s = stateRef.current;
      s.scale = Math.max(0.5, Math.min(3, s.scale * ratio));
      touchRef.current.dist = newDist;
      render();
    }
  }, [render]);

  // Resize observer
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
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: "none", cursor: "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    />
  );
}
