/**
 * SolarSystemScene — 全屏入场动画 + 持久背景太阳系
 *
 * 阶段：
 *  0 → GALAXY   : 银河星云全景，镜头极远
 *  1 → APPROACH : 镜头向太阳系拉近，行星轨道浮现
 *  2 → FOCUS    : 镜头锁定火星轨道，火星高亮
 *  3 → LOCKED   : 全屏收缩，UI 层淡入，Three.js 场景转为背景
 */
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Stars, Trail } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";

// ─── 常量 ──────────────────────────────────────────────────
const PHASE_DURATIONS = [1200, 2200, 1800, 1000]; // ms per phase

type Phase = 0 | 1 | 2 | 3;

interface PlanetDef {
  name: string;
  radius: number;
  orbitR: number;
  speed: number; // rad/s
  color: string;
  emissive?: string;
  textureUrl?: string;
  isMars?: boolean;
}

const PLANETS: PlanetDef[] = [
  { name: "Mercury", radius: 0.12, orbitR: 3.2, speed: 2.4, color: "#9e9e9e" },
  { name: "Venus",   radius: 0.22, orbitR: 5.0, speed: 1.6, color: "#e8c97a" },
  { name: "Earth",   radius: 0.24, orbitR: 7.2, speed: 1.0, color: "#4a90d9", emissive: "#0a2a4a" },
  {
    name: "Mars", radius: 0.18, orbitR: 10.0, speed: 0.65,
    color: "#c1440e", emissive: "#3d1000",
    textureUrl: "/textures/8k_mars.jpg",
    isMars: true,
  },
];

// ─── 相机动画参数 ──────────────────────────────────────────
const CAM_KEYFRAMES = [
  { pos: new THREE.Vector3(0, 80, 120), target: new THREE.Vector3(0, 0, 0), fov: 55 }, // phase 0 galaxy
  { pos: new THREE.Vector3(0, 40,  60), target: new THREE.Vector3(0, 0, 0), fov: 45 }, // phase 1 approach
  { pos: new THREE.Vector3(8,  6,  16), target: new THREE.Vector3(0, 0, 0), fov: 35 }, // phase 2 focus mars
  { pos: new THREE.Vector3(0,  3,   6), target: new THREE.Vector3(0, 0, 0), fov: 28 }, // phase 3 locked
];

// ─── easing ───────────────────────────────────────────────
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── 太阳 ──────────────────────────────────────────────────
function Sun() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
  });
  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial
          color="#ff9d00"
          emissive="#ff6600"
          emissiveIntensity={3}
          roughness={0.4}
        />
      </mesh>
      {/* 日冕光晕 */}
      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#ff9d00" intensity={120} distance={200} decay={2} />
    </group>
  );
}

// ─── 轨道环 ────────────────────────────────────────────────
function OrbitRing({ radius, highlight }: { radius: number; highlight?: boolean }) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  // 用 primitive 避免 JSX <line> 与 SVG 冲突
  const lineObj = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      color: highlight ? "#e05020" : "#ffffff",
      transparent: true,
      opacity: highlight ? 0.45 : 0.12,
    })
  );
  return <primitive object={lineObj} />;
}

// ─── 单颗行星 ──────────────────────────────────────────────
function Planet({ def, phase }: { def: PlanetDef; phase: Phase }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef  = useRef<THREE.Mesh>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  const texture = def.textureUrl
    ? useTexture(def.textureUrl)
    : null;

  useFrame((_, delta) => {
    angleRef.current += delta * def.speed * (phase >= 1 ? 1 : 0.3);
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * def.orbitR;
      groupRef.current.position.z = Math.sin(angleRef.current) * def.orbitR;
    }
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.4;
  });

  const isHighlighted = def.isMars && phase >= 2;
  const scale = phase === 0 ? 0.6 : 1;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} scale={scale}>
        <sphereGeometry args={[def.radius, 48, 48]} />
        {texture ? (
          <meshStandardMaterial
            map={texture}
            emissive={new THREE.Color(def.emissive ?? "#000000")}
            emissiveIntensity={isHighlighted ? 1.2 : 0.3}
            roughness={0.8}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial
            color={def.color}
            emissive={new THREE.Color(def.emissive ?? "#000000")}
            emissiveIntensity={isHighlighted ? 0.6 : 0}
            roughness={0.7}
          />
        )}
      </mesh>
      {/* 火星锁定光环 */}
      {isHighlighted && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[def.radius * 1.6, def.radius * 1.8, 64]} />
            <meshBasicMaterial color="#e05020" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[def.radius * 2.0, def.radius * 2.1, 64]} />
            <meshBasicMaterial color="#ff4400" transparent opacity={0.3} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color="#ff4400" intensity={4} distance={8} decay={2} />
        </>
      )}
    </group>
  );
}

// ─── 小行星带 ─────────────────────────────────────────────
function AsteroidBelt() {
  const count = 600;
  const geo = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 11.5 + Math.random() * 2.0;
      arr[i * 3]     = Math.cos(angle) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial color="#888880" size={0.04} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ─── 相机控制器 ────────────────────────────────────────────
function CameraRig({ phase, progress }: { phase: Phase; progress: number }) {
  const { camera } = useThree();
  const t = easeInOutCubic(progress);

  useFrame(() => {
    const from = CAM_KEYFRAMES[phase];
    const to   = CAM_KEYFRAMES[Math.min(phase + 1, 3)];

    camera.position.lerpVectors(from.pos, to.pos, t);

    const targetPos = new THREE.Vector3().lerpVectors(from.target, to.target, t);
    camera.lookAt(targetPos);

    const fov = THREE.MathUtils.lerp(from.fov, to.fov, t);
    (camera as THREE.PerspectiveCamera).fov = fov;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  });

  return null;
}

// ─── 内部 3D 场景 ──────────────────────────────────────────
function Scene({ phase, progress }: { phase: Phase; progress: number }) {
  const milkyWayTex = useTexture("/textures/8k_stars_milky_way.jpg");

  return (
    <>
      {/* 银河背景球 */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[300, 64, 64]} />
        <meshBasicMaterial map={milkyWayTex} side={THREE.BackSide} />
      </mesh>

      {/* 额外星点层 */}
      <Stars radius={200} depth={60} count={8000} factor={4} saturation={0.3} fade speed={0.4} />

      {/* 环境光 */}
      <ambientLight intensity={0.15} />

      <Sun />

      {PLANETS.map((p) => (
        <group key={p.name}>
          <OrbitRing radius={p.orbitR} highlight={p.isMars && phase >= 2} />
          <Planet def={p} phase={phase} />
        </group>
      ))}

      <AsteroidBelt />

      <CameraRig phase={phase} progress={progress} />
    </>
  );
}

// ─── HUD 文字叠层 ──────────────────────────────────────────
const HUD_LINES: Record<Phase, { title: string; sub: string }> = {
  0: { title: "MILKY WAY GALAXY", sub: "NAVIGATING TO SOL SYSTEM · 26,000 LY" },
  1: { title: "INNER SOLAR SYSTEM", sub: "SCANNING TERRESTRIAL PLANETS · 1 AU" },
  2: { title: "MARS DETECTED", sub: "LOCKING TRAJECTORY · HOHMANN TRANSFER" },
  3: { title: "MARS LOCKED", sub: "ARES MONITORING SYSTEM ONLINE" },
};

// ─── 主导出组件 ────────────────────────────────────────────
interface Props {
  onComplete?: () => void;
  className?: string;
}

export default function SolarSystemScene({ onComplete, className }: Props) {
  const [phase, setPhase]       = useState<Phase>(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);
  const startRef = useRef<number | null>(null);
  const rafRef   = useRef<number>(0);

  const tick = useCallback((now: number) => {
    if (startRef.current === null) startRef.current = now;
    const elapsed = now - startRef.current;
    const dur     = PHASE_DURATIONS[phase];
    const p       = Math.min(elapsed / dur, 1);
    setProgress(p);

    if (p >= 1) {
      if (phase < 3) {
        const next = (phase + 1) as Phase;
        setPhase(next);
        setProgress(0);
        startRef.current = now;
      } else {
        setDone(true);
        onComplete?.();
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [phase, onComplete]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  const hud = HUD_LINES[phase];

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Three.js 画布 */}
      <Canvas
        camera={{ position: [0, 80, 120], fov: 55, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#000508" }}
        className="w-full h-full"
      >
        <Scene phase={phase} progress={progress} />
      </Canvas>

      {/* HUD 叠层 */}
      <AnimatePresence mode="wait">
        {!done && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-12"
          >
            {/* 扫描线装饰 */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-full h-[1px] bg-cyan-400"
                  style={{ top: `${15 + i * 14}%` }}
                  animate={{ opacity: [0, 0.6, 0], x: ["-100%", "100%"] }}
                  transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5 }}
                />
              ))}
            </div>

            {/* 中心准星 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border border-cyan-500/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-3 border border-cyan-500/20 rounded-full"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              {/* 四角瞄准线 */}
              {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy],i)=>(
                <div key={i} className="absolute top-1/2 left-1/2" style={{
                  width: 12, height: 12,
                  borderTop: sy < 0 ? "1.5px solid rgba(78,168,217,0.6)" : "none",
                  borderBottom: sy > 0 ? "1.5px solid rgba(78,168,217,0.6)" : "none",
                  borderLeft: sx < 0 ? "1.5px solid rgba(78,168,217,0.6)" : "none",
                  borderRight: sx > 0 ? "1.5px solid rgba(78,168,217,0.6)" : "none",
                  transform: `translate(${sx > 0 ? "8px" : "calc(-100% - 8px)"}, ${sy > 0 ? "8px" : "calc(-100% - 8px)"})`
                }} />
              ))}
            </div>

            {/* 顶部坐标 */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-[10px] text-cyan-400/60 tracking-widest">
              RA 17h 45m 40s · DEC -29° 0' 28"
            </div>

            {/* 底部 HUD 文字 */}
            <div className="text-center">
              <p className="font-mono text-[10px] text-cyan-400/50 tracking-[0.3em] uppercase mb-1">
                {phase === 3 ? "SYSTEM ONLINE" : `PHASE ${phase + 1}/4`}
              </p>
              <h2 className="font-headline text-2xl md:text-3xl font-black tracking-tighter text-white mb-1">
                {hud.title}
              </h2>
              <p className="font-mono text-[11px] text-cyan-300/70 tracking-widest">{hud.sub}</p>
            </div>

            {/* 进度条 */}
            <div className="mt-6 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #4ea8d9, #e05020)" }}
                animate={{
                  width: `${((phase * PHASE_DURATIONS[phase] + progress * PHASE_DURATIONS[phase]) /
                    PHASE_DURATIONS.reduce((a, b) => a + b, 0)) * 100}%`
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 完成后的角落标识 */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute bottom-4 right-4 pointer-events-none"
          >
            <div className="flex items-center gap-2 font-mono text-[9px] text-cyan-400/50 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              MARS LOCKED · SOL 1242
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
