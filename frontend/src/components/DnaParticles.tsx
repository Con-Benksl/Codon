import { useEffect, useRef } from "react";
import * as THREE from "three";

interface DnaParticlesProps {
  opacity?: number;
  particleCount?: number;
  className?: string;
}

export default function DnaParticles({
  opacity = 0.15,
  particleCount = 3000,
  className = "",
}: DnaParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // DNA helix parameters
    const radius = 4;
    const pitch = 0.6;
    const turns = 8;
    const pointsPerStrand = Math.floor(particleCount / 2);
    const totalAngle = turns * Math.PI * 2;

    // Create particle positions
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const primaryColor = new THREE.Color("#38bdf8");
    const secondaryColor = new THREE.Color("#1e3a5f");

    for (let i = 0; i < pointsPerStrand; i++) {
      const t = i / pointsPerStrand;
      const angle = t * totalAngle;
      const y = (t - 0.5) * turns * pitch * 10;

      // Add slight noise to radius for organic feel
      const noiseR = radius + (Math.random() - 0.5) * 0.8;

      // Strand A
      const idxA = i * 3;
      positions[idxA] = noiseR * Math.cos(angle);
      positions[idxA + 1] = y;
      positions[idxA + 2] = noiseR * Math.sin(angle);

      const colorA = Math.random() > 0.3 ? primaryColor : secondaryColor;
      colors[idxA] = colorA.r;
      colors[idxA + 1] = colorA.g;
      colors[idxA + 2] = colorA.b;

      sizes[i] = 1.5 + Math.random() * 2.0;

      // Strand B (phase offset π)
      const idxB = (pointsPerStrand + i) * 3;
      positions[idxB] = noiseR * Math.cos(angle + Math.PI);
      positions[idxB + 1] = y;
      positions[idxB + 2] = noiseR * Math.sin(angle + Math.PI);

      const colorB = Math.random() > 0.5 ? primaryColor : secondaryColor;
      colors[idxB] = colorB.r;
      colors[idxB + 1] = colorB.g;
      colors[idxB + 2] = colorB.b;

      sizes[pointsPerStrand + i] = 1.5 + Math.random() * 2.0;
    }

    // Points geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Breathing: subtle radius oscillation
          float breathe = sin(uTime * 0.5 + pos.y * 0.3) * 0.15;
          pos.x *= 1.0 + breathe;
          pos.z *= 1.0 + breathe;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (8.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Distance-based alpha
          float dist = length(pos.xz);
          vAlpha = smoothstep(8.0, 2.0, dist);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uOpacity;

        void main() {
          // Soft circle
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Base-pair rungs (LineSegments connecting strands)
    const rungCount = Math.floor(turns * 10);
    const rungPositions = new Float32Array(rungCount * 6);
    const rungColor = new THREE.Color("#1a2d45");

    for (let i = 0; i < rungCount; i++) {
      const t = i / rungCount;
      const angle = t * totalAngle;
      const y = (t - 0.5) * turns * pitch * 10;

      rungPositions[i * 6] = radius * Math.cos(angle);
      rungPositions[i * 6 + 1] = y;
      rungPositions[i * 6 + 2] = radius * Math.sin(angle);
      rungPositions[i * 6 + 3] = radius * Math.cos(angle + Math.PI);
      rungPositions[i * 6 + 4] = y;
      rungPositions[i * 6 + 5] = radius * Math.sin(angle + Math.PI);
    }

    const rungGeometry = new THREE.BufferGeometry();
    rungGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(rungPositions, 3)
    );
    const rungMaterial = new THREE.LineBasicMaterial({
      color: rungColor,
      transparent: true,
      opacity: opacity * 0.4,
      blending: THREE.AdditiveBlending,
    });
    const rungs = new THREE.LineSegments(rungGeometry, rungMaterial);
    scene.add(rungs);

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
      rungs.rotation.y = elapsed * 0.08;

      // Scroll-driven pitch change
      const scrollFactor = scrollY * 0.0003;
      points.rotation.x = scrollFactor * 0.5;
      rungs.rotation.x = scrollFactor * 0.5;

      // Mouse parallax on camera
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 1.0 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      rungGeometry.dispose();
      rungMaterial.dispose();
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
