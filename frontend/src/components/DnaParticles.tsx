import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface DnaSceneParams {
  opacity: number;
  posX: number;
  rotZ: number;
  speed: number;
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
  }, [params.opacity, params.posX, params.rotZ, params.speed]);

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
        sizes[idx] = 4.0 + Math.random() * 3.5;
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
        sizes[idx] = 3.5 + (1.0 - midDist * 2) * 3.0 + Math.random() * 1.5;
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
      sizes[idx] = 2.0 + Math.random() * 2.5;
      randoms[idx] = Math.random() * 6.28;
      idx++;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: currentRef.current.opacity },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float aRandom;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vec3 pos = position;
          float breathe = sin(uTime * 0.4 + pos.y * 0.25) * 0.04;
          pos.x *= 1.0 + breathe;
          pos.z *= 1.0 + breathe;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (18.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          float shift = sin(uTime * 0.25 + aRandom * 6.28 + pos.y * 0.15) * 0.5 + 0.5;
          vColor = mix(color, color.gbr, shift * 0.3);
          float depth = -mvPosition.z;
          vAlpha = smoothstep(80.0, 2.0, depth);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uOpacity;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float core = 1.0 - smoothstep(0.0, 0.1, d);
          float glow = 1.0 - smoothstep(0.05, 0.45, d);
          float alpha = (core * 0.85 + glow * 0.45) * vAlpha * uOpacity;
          alpha = min(alpha, 1.0);
          gl_FragColor = vec4(vColor * (1.0 + core * 0.8), alpha);
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

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uOpacity.value = cur.opacity;

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
