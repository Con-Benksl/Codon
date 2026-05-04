import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getScrollProgress, getDriftRight } from "../lib/scroll-progress";

export interface DnaSceneParams {
  opacity: number;
  posX: number;
  rotZ: number;
  speed: number;
  scrollMorphEnabled: boolean;
  maxScatterAmplitude: number;
  morphTarget: 'none' | 'sphere' | 'logo';
}

interface DnaParticlesProps {
  params?: DnaSceneParams;
  particleCount?: number;
  className?: string;
}

// ── Color palette ──
const STRAND_COLORS = ["#38bdf8", "#60a5fa", "#67e8f9", "#93c5fd"];
const PAIR_COLORS = ["#a78bfa", "#818cf8", "#34d399", "#2dd4bf", "#f0abfc"];
const DUST_COLORS = ["#38bdf8", "#818cf8", "#2dd4bf", "#60a5fa"];

const DEFAULT_PARAMS: DnaSceneParams = {
  opacity: 1.0,
  posX: 6,
  rotZ: 0.35,
  speed: 0.06,
  scrollMorphEnabled: true,
  maxScatterAmplitude: 8.0,
  morphTarget: 'logo',
};

const jsSmoothstep = (x: number, edge0: number, edge1: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export default function DnaParticles({
  params = DEFAULT_PARAMS,
  particleCount = 5000,
  className = "",
}: DnaParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  // Refs for smooth interpolation — updated every frame, no re-render
  const targetRef = useRef<DnaSceneParams>({ ...params });
  const currentRef = useRef<DnaSceneParams>({ ...params });
  const pointsRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Update target when props change — no re-mount
  useEffect(() => {
    targetRef.current = { ...params };
  }, [params.opacity, params.posX, params.rotZ, params.speed, params.scrollMorphEnabled, params.maxScatterAmplitude, params.morphTarget]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
    camera.position.set(0, 0, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Helix parameters ──
    const helixRadius = 3.5;
    const helixHeight = 32;
    const turns = 5;
    const strandPoints = Math.floor(particleCount * 0.30);
    const pairPoints = Math.floor(particleCount * 0.30);
    const dustPoints = particleCount - strandPoints * 2 - pairPoints;
    const totalCount = strandPoints * 2 + pairPoints + dustPoints;
    const totalAngle = turns * Math.PI * 2;

    const positions = new Float32Array(totalCount * 3);
    const colors = new Float32Array(totalCount * 3);
    const sizes = new Float32Array(totalCount);
    const randoms = new Float32Array(totalCount);
    const particleTypes = new Float32Array(totalCount);
    const isTextArr = new Float32Array(totalCount); // 1.0 = text particle on logo sphere

    const toColor = (hex: string) => new THREE.Color(hex);
    const pick = (arr: string[]) => toColor(arr[Math.floor(Math.random() * arr.length)]);

    let idx = 0;

    // ── Strand A & B ──
    for (let strand = 0; strand < 2; strand++) {
      const phaseOffset = strand * Math.PI;
      for (let i = 0; i < strandPoints; i++) {
        const t = i / strandPoints;
        const angle = t * totalAngle + phaseOffset;
        const y = (t - 0.5) * helixHeight;
        const spreadR = helixRadius + (Math.random() - 0.5) * 0.5;
        const spreadY = y + (Math.random() - 0.5) * 0.2;
        const pi = idx * 3;
        positions[pi] = spreadR * Math.cos(angle);
        positions[pi + 1] = spreadY;
        positions[pi + 2] = spreadR * Math.sin(angle);
        const c = pick(STRAND_COLORS);
        colors[pi] = c.r;
        colors[pi + 1] = c.g;
        colors[pi + 2] = c.b;
        sizes[idx] = 5.0 + Math.random() * 4.0;
        randoms[idx] = Math.random() * 6.28;
        particleTypes[idx] = 0;
        idx++;
      }
    }

    // ── Base-pair bridges ──
    const pairCount = Math.floor(turns * 16);
    const particlesPerPair = Math.floor(pairPoints / pairCount);
    for (let i = 0; i < pairCount; i++) {
      const t = i / pairCount;
      const angle = t * totalAngle;
      const y = (t - 0.5) * helixHeight;
      const ax = helixRadius * Math.cos(angle);
      const az = helixRadius * Math.sin(angle);
      const bx = helixRadius * Math.cos(angle + Math.PI);
      const bz = helixRadius * Math.sin(angle + Math.PI);
      for (let j = 0; j < particlesPerPair && idx < strandPoints * 2 + pairPoints; j++) {
        const lerp = (j + Math.random() * 0.3) / particlesPerPair;
        const pi = idx * 3;
        positions[pi] = ax + (bx - ax) * lerp + (Math.random() - 0.5) * 0.08;
        positions[pi + 1] = y + (Math.random() - 0.5) * 0.08;
        positions[pi + 2] = az + (bz - az) * lerp + (Math.random() - 0.5) * 0.08;
        const c = pick(PAIR_COLORS);
        colors[pi] = c.r;
        colors[pi + 1] = c.g;
        colors[pi + 2] = c.b;
        const midDist = Math.abs(lerp - 0.5);
        sizes[idx] = 4.5 + (1.0 - midDist * 2) * 3.5 + Math.random() * 2.0;
        randoms[idx] = Math.random() * 6.28;
        particleTypes[idx] = 1;
        idx++;
      }
    }

    // ── Ambient dust ──
    while (idx < totalCount) {
      const pi = idx * 3;
      const theta = Math.random() * Math.PI * 2;
      const dustR = helixRadius + 2 + Math.random() * 8;
      positions[pi] = dustR * Math.cos(theta) * (Math.random() > 0.5 ? 1 : -1);
      positions[pi + 1] = (Math.random() - 0.5) * helixHeight * 1.2;
      positions[pi + 2] = dustR * Math.sin(theta) * (Math.random() > 0.5 ? 1 : -1);
      const c = pick(DUST_COLORS);
      colors[pi] = c.r;
      colors[pi + 1] = c.g;
      colors[pi + 2] = c.b;
      sizes[idx] = 2.5 + Math.random() * 3.0;
      randoms[idx] = Math.random() * 6.28;
      particleTypes[idx] = 2;
      idx++;
    }

    // ── Sphere morph target (golden spiral distribution) ──
    const morphPositions = new Float32Array(totalCount * 3);
    const sphereRadius = 6.0;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < totalCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / totalCount);
      const mi = i * 3;
      morphPositions[mi] = sphereRadius * Math.sin(phi) * Math.cos(theta);
      morphPositions[mi + 1] = sphereRadius * Math.cos(phi);
      morphPositions[mi + 2] = sphereRadius * Math.sin(phi) * Math.sin(theta);
    }

    // ── Logo sphere morph target ──
    const logoSpherePositions = new Float32Array(totalCount * 3);
    const logoSphereRadius = 5.5;

    // 1. Canvas 采样 "CODON" 文字
    const canvas = document.createElement('canvas');
    const texW = 512, texH = 256;
    canvas.width = texW;
    canvas.height = texH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, texW, texH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 120px "Instrument Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CODON', texW / 2, texH / 2);
    const imgData = ctx.getImageData(0, 0, texW, texH).data;

    // 2. 收集文字像素 UV
    const textUVs: [number, number][] = [];
    for (let y = 0; y < texH; y += 2) {
      for (let x = 0; x < texW; x += 2) {
        if (imgData[(y * texW + x) * 4] > 128) {
          textUVs.push([x / texW, y / texH]);
        }
      }
    }

    // 3. UV → 球面坐标（原始 360° 环带映射）
    for (let i = 0; i < totalCount; i++) {
      const li = i * 3;
      if (textUVs.length > 0 && i < totalCount * 0.75) {
        const uv = textUVs[i % textUVs.length];
        const theta = uv[0] * Math.PI * 2;
        const phi = uv[1] * Math.PI;
        const r = logoSphereRadius + (Math.random() - 0.5) * 0.1;
        logoSpherePositions[li] = r * Math.sin(phi) * Math.cos(theta);
        logoSpherePositions[li + 1] = r * Math.cos(phi);
        logoSpherePositions[li + 2] = r * Math.sin(phi) * Math.sin(theta);
        isTextArr[i] = 1.0;
      } else {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = logoSphereRadius + (Math.random() - 0.5) * 0.15;
        logoSpherePositions[li] = r * Math.sin(phi) * Math.cos(theta);
        logoSpherePositions[li + 1] = r * Math.cos(phi);
        logoSpherePositions[li + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute("aMorphTarget1", new THREE.BufferAttribute(morphPositions, 3));
    geometry.setAttribute("aMorphTarget2", new THREE.BufferAttribute(logoSpherePositions, 3));
    geometry.setAttribute("aParticleType", new THREE.BufferAttribute(particleTypes, 1));
    geometry.setAttribute("aIsText", new THREE.BufferAttribute(isTextArr, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: currentRef.current.opacity },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uScrollProgress: { value: 0 },
        uScatterAmplitude: { value: 0 },
        uMorphTarget: { value: 0 },
        uDriftRight: { value: 0 },
        uReverseBurst: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float aRandom;
        attribute vec3 aMorphTarget1;
        attribute vec3 aMorphTarget2;
        attribute float aParticleType;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uScrollProgress;
        uniform float uScatterAmplitude;
        uniform float uMorphTarget;
        uniform float uDriftRight;
        uniform float uReverseBurst;

        // Simplex 3D Noise (Ashima/Stefan Gustavson)
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){
          const vec2 C=vec2(1.0/6.0,1.0/3.0);
          const vec4 D=vec4(0.0,0.5,1.0,2.0);
          vec3 i=floor(v+dot(v,C.yyy));
          vec3 x0=v-i+dot(i,C.xxx);
          vec3 g=step(x0.yzx,x0.xyz);
          vec3 l=1.0-g;
          vec3 i1=min(g.xyz,l.zxy);
          vec3 i2=max(g.xyz,l.zxy);
          vec3 x1=x0-i1+C.xxx;
          vec3 x2=x0-i2+C.yyy;
          vec3 x3=x0-D.yyy;
          i=mod(i,289.0);
          vec4 p=permute(permute(permute(
            i.z+vec4(0.0,i1.z,i2.z,1.0))
            +i.y+vec4(0.0,i1.y,i2.y,1.0))
            +i.x+vec4(0.0,i1.x,i2.x,1.0));
          float n_=1.0/7.0;
          vec3 ns=n_*D.wyz-D.xzx;
          vec4 j=p-49.0*floor(p*ns.z*ns.z);
          vec4 x_=floor(j*ns.z);
          vec4 y_=floor(j-7.0*x_);
          vec4 x=x_*ns.x+ns.yyyy;
          vec4 y=y_*ns.x+ns.yyyy;
          vec4 h=1.0-abs(x)-abs(y);
          vec4 b0=vec4(x.xy,y.xy);
          vec4 b1=vec4(x.zw,y.zw);
          vec4 s0=floor(b0)*2.0+1.0;
          vec4 s1=floor(b1)*2.0+1.0;
          vec4 sh=-step(h,vec4(0.0));
          vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
          vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
          vec3 p0=vec3(a0.xy,h.x);
          vec3 p1=vec3(a0.zw,h.y);
          vec3 p2=vec3(a1.xy,h.z);
          vec3 p3=vec3(a1.zw,h.w);
          vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
          p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
          vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
          m=m*m;
          return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }

        void main() {
          vec3 pos = position;
          float progress = smoothstep(0.0, 1.0, uScrollProgress);

          // ═══ Base DNA pose ═══
          float breathe = sin(uTime * 0.4 + position.y * 0.25) * 0.04;
          vec3 dnaPos = position;
          dnaPos.x *= 1.0 + breathe;
          dnaPos.z *= 1.0 + breathe;

          // ═══ Sphere pose ═══
          vec3 sphereNoiseInput = position * 0.15 + vec3(aRandom * 6.28, uTime * 0.08, 0.0);
          float sx = snoise(sphereNoiseInput);
          float sy = snoise(sphereNoiseInput + vec3(31.7, 0.0, 0.0));
          float sz = snoise(sphereNoiseInput + vec3(0.0, 47.3, 0.0));
          vec3 scatter = vec3(sx, sy, sz) * uScatterAmplitude * progress;
          float sphereMorph = smoothstep(0.3, 0.9, progress);
          vec3 spherePos = mix(dnaPos, aMorphTarget1, sphereMorph * 0.5) + scatter;

          // ═══ Logo-sphere five-act pose ═══
          vec3 logoPos = dnaPos;
          float dissolve = smoothstep(0.08, 0.28, progress);
          vec3 logoNoiseInput = position * 0.2 + vec3(aRandom * 6.28, uTime * 0.1, 0.0);
          float lx = snoise(logoNoiseInput);
          float ly = snoise(logoNoiseInput + vec3(31.7, 0.0, 0.0));
          float lz = snoise(logoNoiseInput + vec3(0.0, 47.3, 0.0));
          float chaosFadeOut = 1.0 - smoothstep(0.55, 0.85, progress);
          vec3 chaos = vec3(lx, ly, lz) * 3.0 * dissolve * chaosFadeOut;
          float typeDelay = aParticleType * 0.08;
          chaos *= smoothstep(0.08 - typeDelay, 0.25 - typeDelay, progress);
          logoPos += chaos;

          float cinch = smoothstep(0.25, 0.48, progress);
          float yNorm = position.y / 16.0;
          float waist = exp(-yNorm * yNorm * 3.0);
          float spread = (1.0 - waist);
          float cinchRadius = mix(1.0, 0.3, cinch * waist);
          logoPos.x *= cinchRadius;
          logoPos.z *= cinchRadius;
          logoPos.x += spread * cinch * lx * 2.5 * chaosFadeOut;
          logoPos.y += spread * cinch * sign(logoPos.y) * 1.5 * chaosFadeOut;
          logoPos.z += spread * cinch * lz * 2.5 * chaosFadeOut;

          float wrap = smoothstep(0.45, 0.72, progress);
          vec3 sphereCenter = vec3(0.0, -2.0, 0.0);
          vec3 diff = sphereCenter - logoPos;
          float dist = length(diff);
          vec3 toCenter = diff / max(dist, 0.01) * wrap * 6.0;
          logoPos += toCenter;

          float settle = smoothstep(0.55, 0.85, progress);
          logoPos = mix(logoPos, aMorphTarget2, settle);
          float surfaceBreath = sin(uTime * 0.6 + aRandom * 6.28) * 0.06 * settle;
          vec3 surfaceNormal = normalize(logoPos);
          logoPos += surfaceNormal * surfaceBreath;

          float logoBlend = smoothstep(1.15, 1.85, uMorphTarget);
          float sphereBlend = smoothstep(0.15, 0.95, uMorphTarget) * (1.0 - logoBlend);
          pos = mix(dnaPos, spherePos, sphereBlend);
          pos = mix(pos, logoPos, logoBlend);

          // ═══ Reverse burst: 回滚时粒子先从当前位置炸散再收回 DNA ═══
          if (uReverseBurst > 0.01) {
            vec3 rbNoise = position * 0.2 + vec3(aRandom * 6.28, uTime * 0.15, 0.0);
            float rn1 = snoise(rbNoise);
            float rn2 = snoise(rbNoise + vec3(17.3, 0.0, 0.0));
            float rn3 = snoise(rbNoise + vec3(0.0, 29.7, 0.0));
            vec3 burstDir = normalize(vec3(rn1, rn2, rn3));
            // 先炸散（0→0.5），再收回（0.5→1.0）
            float burstOut = smoothstep(0.0, 0.4, uReverseBurst) * (1.0 - smoothstep(0.5, 1.0, uReverseBurst));
            pos += burstDir * burstOut * 6.0;
          }

          // ═══ Data-flow: scroll-driven scatter → coalesce into streams ═══
          if (uDriftRight > 0.01) {
            // Phase 1 (0→0.5): scatter — particles burst outward from DNA
            float scatterAmt = smoothstep(0.0, 0.45, uDriftRight) * (1.0 - smoothstep(0.4, 0.85, uDriftRight));
            // Phase 2 (0.4→1.0): coalesce into rightward-flowing streams
            float streamAmt = smoothstep(0.35, 0.8, uDriftRight);

            // ── Scatter: each particle flies out in a unique direction ──
            float h1 = fract(sin(aRandom * 12.9898) * 43758.5453);
            float h2 = fract(sin(aRandom * 78.233 + 1.0) * 43758.5453);
            float h3 = fract(sin(aRandom * 45.164 + 2.0) * 43758.5453);
            vec3 burstDir = normalize(vec3(h1 - 0.5, h2 - 0.5, h3 - 0.5));
            vec3 scatterPos = pos + burstDir * (5.0 + h1 * 8.0) * scatterAmt;

            // ── Stream: rightward-flowing data river ──
            float driftPhase = aRandom * 6.28;
            float scatterY = sin(driftPhase + uTime * 0.2) * 8.0;
            float scatterZ = cos(driftPhase * 1.3 + uTime * 0.15) * 4.0;
            float flowX = mod(aRandom * 40.0 + uTime * 0.4, 50.0) - 25.0;
            float bobY = sin(uTime * 0.3 + driftPhase) * 1.5;
            vec3 streamPos = vec3(flowX, scatterY + bobY, scatterZ);

            // Blend: DNA → scatter → stream
            vec3 scattered = mix(pos, scatterPos, scatterAmt);
            pos = mix(scattered, streamPos, streamAmt);
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (18.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          float shift = sin(uTime * 0.25 + aRandom * 6.28 + pos.y * 0.15) * 0.5 + 0.5;
          vColor = mix(color, color.gbr, shift * 0.35);

          float depth = -mvPosition.z;
          vAlpha = smoothstep(100.0, 1.0, depth);

          // Logo 模式：散乱阶段降低透明度保护文字
          float logoAlphaBlend = smoothstep(1.15, 1.85, uMorphTarget);
          float midFade = 1.0 - smoothstep(0.1, 0.3, progress) * (1.0 - smoothstep(0.6, 0.9, progress)) * 0.4;
          vAlpha *= mix(1.0, midFade, logoAlphaBlend);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uOpacity;
        uniform float uScrollProgress;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          // Sharp bright core — hot white-ish center
          float core = pow(1.0 - smoothstep(0.0, 0.12, d), 4.0);
          // Mid ring — visible particle body
          float mid = pow(1.0 - smoothstep(0.0, 0.22, d), 1.5);
          // Outer glow — tight, adds definition not blur
          float glow = 1.0 - smoothstep(0.08, 0.38, d);

          float alpha = (core * 1.0 + mid * 0.6 + glow * 0.3) * vAlpha * uOpacity;
          alpha = min(alpha, 1.0);

          // Scatter fade — slightly dimmer when scattered
          float scatterFade = 1.0 - uScrollProgress * 0.25;
          alpha *= scatterFade;

          // Saturate color — boost chroma in the mid/glow zone
          vec3 saturated = vColor * 1.3;
          // Hot white core blending into saturated color body
          vec3 color = mix(saturated, vec3(1.0), core * 0.5) * (1.0 + mid * 0.4);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    materialRef.current = material;

    const points = new THREE.Points(geometry, material);
    points.rotation.z = currentRef.current.rotZ;
    points.rotation.x = 0.15;
    points.position.x = currentRef.current.posX;
    pointsRef.current = points;
    scene.add(points);

    // ── Interaction ──
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let scrollY = 0;
    const handleScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // ── Animation with smooth interpolation ──
    const clock = new THREE.Clock();
    let elapsed = 0;
    let rotationPhase = points.rotation.y;
    const maxFrameDeltaSeconds = 0.05;
    const lerpFactor = 0.035; // Smooth ~1s transition

    let currentScrollProgress = 0;
    let prevScrollProgress = 0;
    let reverseBurst = 0;       // 0→1→0 回滚爆散周期
    let reverseTriggered = false;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const deltaSeconds = Math.min(clock.getDelta(), maxFrameDeltaSeconds);
      elapsed += deltaSeconds;
      const cur = currentRef.current;
      const tgt = targetRef.current;

      // Smooth interpolation toward target
      cur.opacity += (tgt.opacity - cur.opacity) * lerpFactor;
      cur.posX += (tgt.posX - cur.posX) * lerpFactor;
      cur.rotZ += (tgt.rotZ - cur.rotZ) * lerpFactor;
      cur.speed += (tgt.speed - cur.speed) * lerpFactor;
      cur.maxScatterAmplitude += ((tgt.maxScatterAmplitude ?? 0) - (cur.maxScatterAmplitude ?? 0)) * lerpFactor;

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uOpacity.value = cur.opacity;

      // Scroll morph — getScrollProgress() 已内置阻尼平滑，直接使用
      currentScrollProgress = tgt.scrollMorphEnabled ? getScrollProgress() : 0;

      // 检测回滚：从高 progress 大幅回退时触发爆散
      const scrollDelta = currentScrollProgress - prevScrollProgress;
      if (scrollDelta < -0.003 && prevScrollProgress > 0.3 && !reverseTriggered) {
        reverseTriggered = true;
        reverseBurst = 0.001;
      }
      prevScrollProgress = currentScrollProgress;

      // 驱动爆散周期 0→1（约 2.5 秒走完）
      if (reverseTriggered) {
        reverseBurst += deltaSeconds / 2.5;
        if (reverseBurst >= 1.0) {
          reverseBurst = 0;
          reverseTriggered = false;
        }
      }
      material.uniforms.uReverseBurst.value = reverseBurst;

      material.uniforms.uScrollProgress.value = currentScrollProgress;
      material.uniforms.uScatterAmplitude.value = cur.maxScatterAmplitude ?? 0;
      const morphTargetValue =
        tgt.morphTarget === 'logo' ? 2.0 :
        tgt.morphTarget === 'sphere' ? 1.0 : 0.0;
      material.uniforms.uMorphTarget.value +=
        (morphTargetValue - material.uniforms.uMorphTarget.value) * lerpFactor;
      const currentMorphValue = material.uniforms.uMorphTarget.value;
      const logoBlend = jsSmoothstep(currentMorphValue, 1.15, 1.85);

      // Drift-right mode stays opt-in; the global route background remains stable.
      material.uniforms.uDriftRight.value = cur.scrollMorphEnabled ? getDriftRight() : 0;

      const slowdown = Math.max(0.6, 1.0 - jsSmoothstep(currentScrollProgress, 0.6, 0.9));
      rotationPhase += deltaSeconds * cur.speed * (1.0 + logoBlend * (2.5 * slowdown - 1.0));

      // 凝聚阶段（settle）自动转一整圈展示 CODON
      const settleProgress = jsSmoothstep(currentScrollProgress, 0.5, 0.95);
      const revealSpin = settleProgress * Math.PI * 2;
      const logoYOffset = -Math.PI * 1.3;
      const dnaRotationY = rotationPhase;
      const logoRotationY = logoYOffset + revealSpin + rotationPhase;
      points.rotation.y = THREE.MathUtils.lerp(dnaRotationY, logoRotationY, logoBlend);

      // Logo 球模式：最终保留 15° 倾斜增加立体感，确保 CODON 仍可读
      const lockH = jsSmoothstep(currentScrollProgress, 0.7, 0.95);
      const tiltX = 0.26; // ~15° 前倾
      const tiltZ = 0.10; // ~6° 侧倾
      const dnaRotationX = 0.15 + scrollY * 0.0008;
      const dnaRotationZ = cur.rotZ + scrollY * 0.0003;
      const logoRotationX = dnaRotationX * (1.0 - lockH) + tiltX * lockH;
      const logoRotationZ = dnaRotationZ * (1.0 - lockH) + tiltZ * lockH;
      points.rotation.x = THREE.MathUtils.lerp(dnaRotationX, logoRotationX, logoBlend);
      points.rotation.z = THREE.MathUtils.lerp(dnaRotationZ, logoRotationZ, logoBlend);
      points.position.x = cur.posX;

      // Mouse parallax + logo camera, blended so route changes do not snap
      camera.position.x += (mouseX * 2.0 - camera.position.x) * 0.015;
      const logoP = jsSmoothstep(currentScrollProgress, 0.5, 1.0);
      const dnaTargetY = -mouseY * 1.5;
      const logoTargetY = dnaTargetY - logoP * 2;
      const targetY = THREE.MathUtils.lerp(dnaTargetY, logoTargetY, logoBlend);
      const targetZ = 18 + logoBlend * logoP * 3;
      camera.position.y += (targetY - camera.position.y) * 0.015;
      camera.position.z += (targetZ - camera.position.z) * 0.015;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const rw = container.clientWidth || window.innerWidth;
      const rh = container.clientHeight || window.innerHeight;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [particleCount]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
