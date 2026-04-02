import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getScrollProgress } from "../lib/scroll-progress";

export interface DnaSceneParams {
  opacity: number;
  posX: number;
  rotZ: number;
  speed: number;
  scrollMorphEnabled: boolean;
  maxScatterAmplitude: number;
  morphTarget: 'none' | 'sphere';
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
  morphTarget: 'sphere',
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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute("aMorphTarget1", new THREE.BufferAttribute(morphPositions, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: currentRef.current.opacity },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uScrollProgress: { value: 0 },
        uScatterAmplitude: { value: 0 },
        uMorphTarget: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float aRandom;
        attribute vec3 aMorphTarget1;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uScrollProgress;
        uniform float uScatterAmplitude;
        uniform float uMorphTarget;

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

          // Breathe effect
          float breathe = sin(uTime * 0.4 + pos.y * 0.25) * 0.04;
          pos.x *= 1.0 + breathe;
          pos.z *= 1.0 + breathe;

          // Scroll-driven scatter
          float progress = smoothstep(0.0, 1.0, uScrollProgress);
          vec3 noiseInput = position * 0.15 + vec3(aRandom * 6.28, uTime * 0.08, 0.0);
          float nx = snoise(noiseInput);
          float ny = snoise(noiseInput + vec3(31.7, 0.0, 0.0));
          float nz = snoise(noiseInput + vec3(0.0, 47.3, 0.0));
          vec3 scatter = vec3(nx, ny, nz) * uScatterAmplitude * progress;

          // Optional sphere morph (kicks in at 30% scroll)
          float morphBlend = smoothstep(0.3, 0.9, progress) * step(0.5, uMorphTarget);
          pos = mix(pos, aMorphTarget1, morphBlend * 0.5) + scatter;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (18.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          float shift = sin(uTime * 0.25 + aRandom * 6.28 + pos.y * 0.15) * 0.5 + 0.5;
          vColor = mix(color, color.gbr, shift * 0.35);

          float depth = -mvPosition.z;
          vAlpha = smoothstep(100.0, 1.0, depth);
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
          float scatterFade = 1.0 - uScrollProgress * 0.15;
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
    const lerpFactor = 0.035; // Smooth ~1s transition

    let currentScrollProgress = 0;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
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

      // Scroll morph
      const scrollTarget = tgt.scrollMorphEnabled ? getScrollProgress() : 0;
      currentScrollProgress += (scrollTarget - currentScrollProgress) * 0.08;
      material.uniforms.uScrollProgress.value = currentScrollProgress;
      material.uniforms.uScatterAmplitude.value = cur.maxScatterAmplitude ?? 0;
      material.uniforms.uMorphTarget.value = cur.morphTarget === 'sphere' ? 1.0 : 0.0;

      points.rotation.y = elapsed * cur.speed;
      points.rotation.x = 0.15 + scrollY * 0.00015;
      points.rotation.z = cur.rotZ;
      points.position.x = cur.posX;

      // Mouse parallax
      camera.position.x += (mouseX * 2.0 - camera.position.x) * 0.015;
      camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.015;
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
