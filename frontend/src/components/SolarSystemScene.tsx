/**
 * SolarSystemScene
 *
 * 阶段：
 *   intro  → 太阳系全景，镜头从远处缓慢推入
 *   zoom   → 自动拉近到火星
 *   locked → 锁定火星，可拖拽绕火星旋转
 */
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";

// ─── 行星定义 ─────────────────────────────────────────────
interface PlanetDef {
  name: string;
  orbitR: number;      // AU 缩放单位
  radius: number;
  tilt: number;        // 自转轴倾斜 rad
  spinSpeed: number;   // 自转速度
  orbitSpeed: number;  // 公转速度
  texture: string;
  isMars?: boolean;
  hasSaturnRing?: boolean;
}

const PLANETS: PlanetDef[] = [
  { name: "Mercury", orbitR: 4,    radius: 0.18, tilt: 0.03,  spinSpeed: 0.2,  orbitSpeed: 2.0,  texture: "/textures/8k_mercury.jpg" },
  { name: "Venus",   orbitR: 6.5,  radius: 0.28, tilt: 3.09,  spinSpeed: 0.1,  orbitSpeed: 1.4,  texture: "/textures/4k_venus_atmosphere.jpg" },
  { name: "Earth",   orbitR: 9,    radius: 0.30, tilt: 0.41,  spinSpeed: 0.5,  orbitSpeed: 1.0,  texture: "/textures/8k_earth_daymap.jpg" },
  { name: "Mars",    orbitR: 12,   radius: 0.22, tilt: 0.44,  spinSpeed: 0.48, orbitSpeed: 0.65, texture: "/textures/8k_mars.jpg", isMars: true },
  { name: "Jupiter", orbitR: 22,   radius: 0.90, tilt: 0.05,  spinSpeed: 1.2,  orbitSpeed: 0.25, texture: "/textures/8k_jupiter.jpg" },
  { name: "Saturn",  orbitR: 32,   radius: 0.75, tilt: 0.47,  spinSpeed: 1.0,  orbitSpeed: 0.18, texture: "/textures/8k_saturn.jpg", hasSaturnRing: true },
  { name: "Uranus",  orbitR: 44,   radius: 0.45, tilt: 1.71,  spinSpeed: 0.7,  orbitSpeed: 0.10, texture: "/textures/2k_uranus.jpg" },
  { name: "Neptune", orbitR: 56,   radius: 0.42, tilt: 0.49,  spinSpeed: 0.6,  orbitSpeed: 0.07, texture: "/textures/2k_neptune.jpg" },
];

const MARS_DEF = PLANETS.find(p => p.isMars)!;

// ─── 轨道线（用 THREE 对象避免 JSX <line> 歧义） ────────
function OrbitRing({ radius, faded }: { radius: number; faded?: boolean }) {
  const obj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: faded ? 0.04 : 0.10,
    });
    return new THREE.Line(geo, mat);
  }, [radius, faded]);

  return <primitive object={obj} />;
}

// ─── 太阳 ─────────────────────────────────────────────────
function Sun() {
  const tex = useTexture("/textures/8k_sun.jpg");
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.05; });

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      {/* 内外两层光晕 */}
      {[2.4, 3.4].map((r, i) => (
        <mesh key={r}>
          <sphereGeometry args={[r, 32, 32]} />
          <meshBasicMaterial color="#ff8800" transparent opacity={i === 0 ? 0.06 : 0.02} side={THREE.BackSide} />
        </mesh>
      ))}
      <pointLight color="#fff5e0" intensity={150} distance={400} decay={2} />
    </group>
  );
}

// ─── 土星光环 ─────────────────────────────────────────────
function SaturnRing({ radius }: { radius: number }) {
  const ringTex = useTexture("/textures/8k_saturn_ring_alpha.png");
  const geo = useMemo(() => new THREE.RingGeometry(radius * 1.3, radius * 2.2, 128), [radius]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial map={ringTex} transparent side={THREE.DoubleSide} opacity={0.85} />
    </mesh>
  );
}

// ─── 单行星 ───────────────────────────────────────────────
function Planet({
  def,
  phaseRef,
  marsAngleRef,
  marsPosRef,
}: {
  def: PlanetDef;
  phaseRef: React.MutableRefObject<"intro" | "zoom" | "locked">;
  marsAngleRef: React.MutableRefObject<number>;
  marsPosRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const tex = useTexture(def.texture);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef  = useRef<THREE.Mesh>(null);
  const angle    = useRef(Math.random() * Math.PI * 2);

  useFrame((_, dt) => {
    angle.current += dt * def.orbitSpeed * 0.15;
    const x = Math.cos(angle.current) * def.orbitR;
    const z = Math.sin(angle.current) * def.orbitR;
    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * def.spinSpeed;
    }
    // 记录火星位置给相机用
    if (def.isMars) {
      marsAngleRef.current = angle.current;
      marsPosRef.current.set(x, 0, z);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} rotation={[def.tilt, 0, 0]}>
        <sphereGeometry args={[def.radius, 64, 64]} />
        <meshStandardMaterial map={tex} roughness={0.8} metalness={0.05} />
      </mesh>
      {def.hasSaturnRing && <SaturnRing radius={def.radius} />}
    </group>
  );
}

// ─── 相机控制器 ───────────────────────────────────────────
type Phase = "intro" | "zoom" | "locked";

function CameraController({
  phaseRef,
  marsPosRef,
  dragState,
}: {
  phaseRef: React.MutableRefObject<Phase>;
  marsPosRef: React.MutableRefObject<THREE.Vector3>;
  dragState: React.MutableRefObject<{ theta: number; phi: number; dist: number }>;
}) {
  const { camera } = useThree();
  const introT   = useRef(0);   // 0→1 intro 推进
  const zoomT    = useRef(0);   // 0→1 zoom 推进
  const lookTarget = useRef(new THREE.Vector3());

  // intro 起始/终止相机位
  const INTRO_FROM = new THREE.Vector3(0, 90, 130);
  const INTRO_TO   = new THREE.Vector3(0, 45, 65);

  function ease(t: number) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  useFrame((_, dt) => {
    const phase = phaseRef.current;
    const mars  = marsPosRef.current;

    if (phase === "intro") {
      introT.current = Math.min(introT.current + dt * 0.12, 1);
      const t = ease(introT.current);
      camera.position.lerpVectors(INTRO_FROM, INTRO_TO, t);
      lookTarget.current.lerp(new THREE.Vector3(0, 0, 0), 0.05);
      camera.lookAt(lookTarget.current);
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(60, 52, t);
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    } else if (phase === "zoom") {
      zoomT.current = Math.min(zoomT.current + dt * 0.35, 1);
      const t = ease(zoomT.current);
      // 目标：火星后方偏上
      const target = mars.clone().add(new THREE.Vector3(0, 1.5, 4.5));
      camera.position.lerp(target, t * 0.08 + 0.01);
      lookTarget.current.lerp(mars, 0.04);
      camera.lookAt(lookTarget.current);
      const fov = THREE.MathUtils.lerp(
        (camera as THREE.PerspectiveCamera).fov,
        38,
        0.03
      );
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    } else {
      // locked：绕火星轨道旋转
      const { theta, phi, dist } = dragState.current;
      const x = mars.x + dist * Math.sin(phi) * Math.cos(theta);
      const y = mars.y + dist * Math.cos(phi);
      const z = mars.z + dist * Math.sin(phi) * Math.sin(theta);
      camera.position.lerp(new THREE.Vector3(x, y, z), 0.08);
      lookTarget.current.lerp(mars, 0.08);
      camera.lookAt(lookTarget.current);
      // 自动慢转
      dragState.current.theta += dt * 0.18;
    }
  });

  return null;
}

// ─── 主场景内容 ───────────────────────────────────────────
function SceneContent({
  phaseRef,
  marsPosRef,
  marsAngleRef,
  dragState,
}: {
  phaseRef: React.MutableRefObject<Phase>;
  marsPosRef: React.MutableRefObject<THREE.Vector3>;
  marsAngleRef: React.MutableRefObject<number>;
  dragState: React.MutableRefObject<{ theta: number; phi: number; dist: number }>;
}) {
  const milkyWay = useTexture("/textures/8k_stars_milky_way.jpg");

  return (
    <>
      {/* 银河球壳 */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[500, 64, 64]} />
        <meshBasicMaterial map={milkyWay} side={THREE.BackSide} />
      </mesh>

      <Stars radius={300} depth={80} count={6000} factor={3} saturation={0.2} fade speed={0.3} />

      <ambientLight intensity={0.06} />

      <Sun />

      {PLANETS.map(def => (
        <group key={def.name}>
          <OrbitRing radius={def.orbitR} faded={def.orbitR > 20} />
          <Planet
            def={def}
            phaseRef={phaseRef}
            marsAngleRef={marsAngleRef}
            marsPosRef={marsPosRef}
          />
        </group>
      ))}

      <CameraController
        phaseRef={phaseRef}
        marsPosRef={marsPosRef}
        dragState={dragState}
      />
    </>
  );
}

// ─── HUD ──────────────────────────────────────────────────
function Hud({ phase }: { phase: Phase }) {
  return (
    <AnimatePresence mode="wait">
      {phase !== "locked" && (
        <motion.div
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-10"
        >
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[11px] tracking-[0.25em] uppercase text-cyan-300/60"
          >
            {phase === "intro" ? "SOLAR SYSTEM · SOL" : "LOCKING ON MARS ···"}
          </motion.p>
        </motion.div>
      )}

      {phase === "locked" && (
        <motion.div
          key="locked"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute bottom-4 right-5 pointer-events-none flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="font-mono text-[9px] text-red-400/60 tracking-widest uppercase">
            MARS LOCKED · SOL 1242
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── 主导出 ───────────────────────────────────────────────
interface Props {
  onComplete?: () => void;
  className?: string;
}

export default function SolarSystemScene({ onComplete, className }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const phaseRef     = useRef<Phase>("intro");
  const marsPosRef   = useRef(new THREE.Vector3(MARS_DEF.orbitR, 0, 0));
  const marsAngleRef = useRef(0);

  // 拖拽状态：theta=水平角, phi=仰角, dist=距离
  const dragState = useRef({ theta: 0, phi: Math.PI / 3, dist: 3.5 });
  const pointerDown = useRef<{ x: number; y: number; theta: number; phi: number } | null>(null);

  // 阶段推进
  useEffect(() => {
    const t1 = setTimeout(() => {
      phaseRef.current = "zoom";
      setPhase("zoom");
    }, 2800);
    const t2 = setTimeout(() => {
      phaseRef.current = "locked";
      setPhase("locked");
      onComplete?.();
    }, 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  // 鼠标 / 触摸拖拽
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phaseRef.current !== "locked") return;
    pointerDown.current = {
      x: e.clientX,
      y: e.clientY,
      theta: dragState.current.theta,
      phi: dragState.current.phi,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    const dx = (e.clientX - pointerDown.current.x) * 0.006;
    const dy = (e.clientY - pointerDown.current.y) * 0.006;
    dragState.current.theta = pointerDown.current.theta - dx;
    dragState.current.phi   = Math.max(0.2, Math.min(Math.PI - 0.2, pointerDown.current.phi + dy));
  }, []);

  const onPointerUp = useCallback(() => {
    pointerDown.current = null;
  }, []);

  // 滚轮缩放
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (phaseRef.current !== "locked") return;
    dragState.current.dist = Math.max(1.5, Math.min(12, dragState.current.dist + e.deltaY * 0.005));
  }, []);

  return (
    <div
      className={`relative ${className ?? ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
      style={{ cursor: phase === "locked" ? "grab" : "default" }}
    >
      <Canvas
        camera={{ position: [0, 90, 130], fov: 60, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#00020a" }}
        className="w-full h-full"
      >
        <SceneContent
          phaseRef={phaseRef}
          marsPosRef={marsPosRef}
          marsAngleRef={marsAngleRef}
          dragState={dragState}
        />
      </Canvas>

      <Hud phase={phase} />
    </div>
  );
}
