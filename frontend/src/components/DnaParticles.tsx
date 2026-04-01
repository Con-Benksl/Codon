import { useEffect, useRef } from "react";
import * as THREE from "three";

interface DnaParticlesProps {
  opacity?: number;
  particleCount?: number;
  className?: string;
}

// Palette: each particle gets a random color from this set
const PALETTE = [
  "#38bdf8", // cyan-400
  "#60a5fa", // blue-400
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#34d399", // emerald-400
  "#2dd4bf", // teal-400
  "#67e8f9", // cyan-300
  "#93c5fd", // blue-300
];

export default function DnaParticles({
  opacity = 0.7,
  particleCount = 3000,
  className = "",
}: DnaParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Helix geometry — larger, fills viewport
    const radius = 5;
    const pitch = 0.35;
    const turns = 5;
    const pointsPerStrand = Math.floor(particleCount / 2);
    const totalAngle = turns * Math.PI * 2;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const randoms = new Float32Array(particleCount); // per-particle random for dynamic color shift

    const paletteColors = PALETTE.map((hex) => new THREE.Color(hex));

    const pickColor = () => paletteColors[Math.floor(Math.random() * paletteColors.length)];

    for (let i = 0; i < pointsPerStrand; i++) {
      const t = i / pointsPerStrand;
      const angle = t * totalAngle;
      const y = (t - 0.5) * turns * pitch * 10;
      const noiseR = radius + (Math.random() - 0.5) * 1.2;

      // Strand A
      const idxA = i * 3;
      positions[idxA] = noiseR * Math.cos(angle);
      positions[idxA + 1] = y;
      positions[idxA + 2] = noiseR * Math.sin(angle);
      const cA = pickColor();
      colors[idxA] = cA.r;
      colors[idxA + 1] = cA.g;
      colors[idxA + 2] = cA.b;
      sizes[i] = 5.0 + Math.random() * 5.0;
      randoms[i] = Math.random() * 6.28;

      // Strand B (phase offset π)
      const idxB = (pointsPerStrand + i) * 3;
      positions[idxB] = noiseR * Math.cos(angle + Math.PI);
      positions[idxB + 1] = y;
      positions[idxB + 2] = noiseR * Math.sin(angle + Math.PI);
      const cB = pickColor();
      colors[idxB] = cB.r;
      colors[idxB + 1] = cB.g;
      colors[idxB + 2] = cB.b;
      sizes[pointsPerStrand + i] = 3.0 + Math.random() * 3.0;
      randoms[pointsPerStrand + i] = Math.random() * 6.28;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    // Shader: dynamic color cycling per particle
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float aRandom;
        varying vec3 vColor;
        varying float vAlpha;
        varying float vRandom;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vRandom = aRandom;
          vec3 pos = position;

          // Breathing oscillation
          float breathe = sin(uTime * 0.5 + pos.y * 0.3) * 0.05;
          pos.x *= 1.0 + breathe;
          pos.z *= 1.0 + breathe;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (12.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Dynamic color: hue-shift the base color over time, unique per particle
          float shift = sin(uTime * 0.3 + aRandom * 6.28 + pos.y * 0.2) * 0.5 + 0.5;
          vColor = mix(color, color.gbr, shift * 0.35);

          // Alpha
          float dist = length(pos.xz);
          vAlpha = smoothstep(12.0, 1.0, dist);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uOpacity;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float circle = 1.0 - smoothstep(0.0, 0.5, d);
          float alpha = circle * vAlpha * uOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Scroll response
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      material.uniforms.uTime.value = elapsed;

      // Slow rotation
      points.rotation.y = elapsed * 0.08;

      // Scroll-driven tilt
      const scrollFactor = scrollY * 0.0003;
      points.rotation.x = scrollFactor * 0.5;

      // Mouse parallax on camera
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 1.0 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize
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
  }, [opacity, particleCount]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
