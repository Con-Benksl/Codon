/**
 * SolarSystemScene
 * - intro:  太阳系全景缓推 (2.5s)
 * - zoom:   自动拉近火星 (3.3s)
 * - locked: 绕火星旋转，拖拽/滚轮交互
 *
 * 修复:
 * 1. onComplete 触发后，EnvironmentView 不销毁重建，同一实例持续运行
 * 2. 拖拽用 gl.domElement 原生事件，完全绕开 R3F 内部指针捕获
 * 3. 太阳光晕用 AdditiveBlending 多层球体，真实发光感
 */
import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Stars } from "@react-three/drei";
import * as THREE from "three";

type Phase = "intro" | "zoom" | "locked";

interface PlanetDef {
  name: string;
  orbitR: number;
  radius: number;
  tilt: number;
  spinSpeed: number;
  orbitSpeed: number;
  texture: string;
  isMars?: boolean;
  hasSaturnRing?: boolean;
  initAngle: number;
}

const PLANETS: PlanetDef[] = [
  { name: "Mercury", orbitR: 5.5,  radius: 0.22, tilt: 0.03, spinSpeed: 0.12, orbitSpeed: 0.18,  texture: "/textures/8k_mercury.jpg",         initAngle: 0.8 },
  { name: "Venus",   orbitR: 8.5,  radius: 0.34, tilt: 3.09, spinSpeed: 0.07, orbitSpeed: 0.12,  texture: "/textures/4k_venus_atmosphere.jpg", initAngle: 2.1 },
  { name: "Earth",   orbitR: 12,   radius: 0.36, tilt: 0.41, spinSpeed: 0.30, orbitSpeed: 0.09,  texture: "/textures/8k_earth_daymap.jpg",     initAngle: 4.0 },
  { name: "Mars",    orbitR: 16.5, radius: 0.30, tilt: 0.44, spinSpeed: 0.28, orbitSpeed: 0.06,  texture: "/textures/8k_mars.jpg",             initAngle: 1.2, isMars: true },
  { name: "Jupiter", orbitR: 27,   radius: 0.85, tilt: 0.05, spinSpeed: 0.60, orbitSpeed: 0.03,  texture: "/textures/8k_jupiter.jpg",          initAngle: 3.5 },
  { name: "Saturn",  orbitR: 37,   radius: 0.70, tilt: 0.47, spinSpeed: 0.55, orbitSpeed: 0.018, texture: "/textures/8k_saturn.jpg",           initAngle: 5.2, hasSaturnRing: true },
  { name: "Uranus",  orbitR: 47,   radius: 0.45, tilt: 1.71, spinSpeed: 0.40, orbitSpeed: 0.012, texture: "/textures/2k_uranus.jpg",           initAngle: 0.3 },
  { name: "Neptune", orbitR: 56,   radius: 0.43, tilt: 0.49, spinSpeed: 0.38, orbitSpeed: 0.008, texture: "/textures/2k_neptune.jpg",          initAngle: 2.8 },
];

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── 共享轨道状态 ─────────────────────────────────────────
interface OrbitState {
  theta: number;
  phi: number;
  dist: number;
  autoSpin: boolean;
}

// ─── 轨道圈 ───────────────────────────────────────────────
function OrbitRing({ radius, dim }: { radius: number; dim?: boolean }) {
  const obj = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: "#4488bb",
        transparent: true,
        opacity: dim ? 0.04 : 0.12,
      })
    );
  }, [radius, dim]);
  return <primitive object={obj} />;
}

// ─── 太阳（AdditiveBlending 多层光晕）────────────────────
function Sun() {
  const tex  = useTexture("/textures/8k_sun.jpg");
  const mesh = useRef<THREE.Mesh>(null);

  const glowMats = useMemo(() => [
    // 内层：亮橙，最浓
    new THREE.MeshBasicMaterial({ color: "#ff7700", transparent: true, opacity: 0.60, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    // 中层
    new THREE.MeshBasicMaterial({ color: "#ff4400", transparent: true, opacity: 0.30, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    // 外层：更大、更淡
    new THREE.MeshBasicMaterial({ color: "#ff2200", transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    // 最外大晕
    new THREE.MeshBasicMaterial({ color: "#ff6600", transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }),
  ], []);

  useFrame((_, dt) => { if (mesh.current) mesh.current.rotation.y += dt * 0.025; });

  return (
    <group>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <mesh material={glowMats[0]}><sphereGeometry args={[2.0, 32, 32]} /></mesh>
      <mesh material={glowMats[1]}><sphereGeometry args={[3.2, 32, 32]} /></mesh>
      <mesh material={glowMats[2]}><sphereGeometry args={[5.0, 32, 32]} /></mesh>
      <mesh material={glowMats[3]}><sphereGeometry args={[8.0, 32, 32]} /></mesh>
      <pointLight color="#fff4cc" intensity={300} distance={800} decay={1.8} />
    </group>
  );
}

// ─── 土星环 ───────────────────────────────────────────────
function SaturnRing({ r }: { r: number }) {
  const tex = useTexture("/textures/8k_saturn_ring_alpha.png");
  const geo = useMemo(() => new THREE.RingGeometry(r * 1.4, r * 2.4, 128), [r]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2.3, 0, 0]}>
      <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} opacity={0.9} />
    </mesh>
  );
}

// ─── 行星 ─────────────────────────────────────────────────
function Planet({ def, marsPosRef }: {
  def: PlanetDef;
  marsPosRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const tex   = useTexture(def.texture);
  const group = useRef<THREE.Group>(null);
  const mesh  = useRef<THREE.Mesh>(null);
  const angle = useRef(def.initAngle);

  useFrame((_, dt) => {
    angle.current += dt * def.orbitSpeed;
    const x = Math.cos(angle.current) * def.orbitR;
    const z = Math.sin(angle.current) * def.orbitR;
    group.current?.position.set(x, 0, z);
    if (mesh.current) mesh.current.rotation.y += dt * def.spinSpeed;
    if (def.isMars) marsPosRef.current.set(x, 0, z);
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} rotation={[def.tilt, 0, 0]}>
        <sphereGeometry args={[def.radius, 64, 64]} />
        <meshStandardMaterial map={tex} roughness={0.75} metalness={0.05} />
      </mesh>
      {def.hasSaturnRing && <SaturnRing r={def.radius} />}
    </group>
  );
}

// ─── 相机控制器 ───────────────────────────────────────────
function CameraController({ phaseRef, marsPosRef, orbitRef }: {
  phaseRef: React.MutableRefObject<Phase>;
  marsPosRef: React.MutableRefObject<THREE.Vector3>;
  orbitRef: React.MutableRefObject<OrbitState>;
}) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));
  const introT = useRef(0);
  const FROM   = useMemo(() => new THREE.Vector3(0, 52, 68), []);
  const TO     = useMemo(() => new THREE.Vector3(0, 36, 50), []);

  useFrame((_, dt) => {
    const phase = phaseRef.current;
    const mars  = marsPosRef.current;
    const cam   = camera as THREE.PerspectiveCamera;

    if (phase === "intro") {
      introT.current = Math.min(introT.current + dt * 0.07, 1);
      camera.position.lerpVectors(FROM, TO, easeInOut(introT.current));
      lookAt.current.lerp(new THREE.Vector3(0, 0, 0), 0.04);
      camera.lookAt(lookAt.current);
      cam.fov = THREE.MathUtils.lerp(58, 52, introT.current);
      cam.updateProjectionMatrix();

    } else if (phase === "zoom") {
      const dest = mars.clone().add(new THREE.Vector3(0, 1.0, 4.0));
      camera.position.lerp(dest, dt * 1.4);
      lookAt.current.lerp(mars, dt * 1.8);
      camera.lookAt(lookAt.current);
      cam.fov = Math.max(cam.fov - dt * 18, 40);
      cam.updateProjectionMatrix();

    } else {
      // locked：球坐标绕火星
      if (orbitRef.current.autoSpin) {
        orbitRef.current.theta += dt * 0.15;
      }
      const { theta, phi, dist } = orbitRef.current;
      const tx = mars.x + dist * Math.sin(phi) * Math.cos(theta);
      const ty = mars.y + dist * Math.cos(phi);
      const tz = mars.z + dist * Math.sin(phi) * Math.sin(theta);
      camera.position.lerp(new THREE.Vector3(tx, ty, tz), dt * 6);
      lookAt.current.lerp(mars, dt * 6);
      camera.lookAt(lookAt.current);
    }
  });
  return null;
}

// ─── 拖拽控制器（直接绑定 gl.domElement 原生事件）─────────
function DragController({ phaseRef, orbitRef }: {
  phaseRef: React.MutableRefObject<Phase>;
  orbitRef: React.MutableRefObject<OrbitState>;
}) {
  const { gl } = useThree();

  useEffect(() => {
    const el = gl.domElement;
    // 拖拽起始快照
    let active = false;
    let sx = 0, sy = 0, sTheta = 0, sPhi = 0;
    let spinTimer: ReturnType<typeof setTimeout> | null = null;

    const onDown = (e: PointerEvent) => {
      if (phaseRef.current !== "locked") return;
      active = true;
      sx = e.clientX; sy = e.clientY;
      sTheta = orbitRef.current.theta;
      sPhi   = orbitRef.current.phi;
      orbitRef.current.autoSpin = false;
      if (spinTimer) clearTimeout(spinTimer);
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = (e.clientX - sx) * 0.006;
      const dy = (e.clientY - sy) * 0.006;
      orbitRef.current.theta = sTheta - dx;
      orbitRef.current.phi   = Math.max(0.1, Math.min(Math.PI - 0.1, sPhi + dy));
    };

    const onUp = () => {
      if (!active) return;
      active = false;
      spinTimer = setTimeout(() => { orbitRef.current.autoSpin = true; }, 3000);
    };

    const onWheel = (e: WheelEvent) => {
      if (phaseRef.current !== "locked") return;
      e.preventDefault();
      orbitRef.current.dist = Math.max(0.8, Math.min(20, orbitRef.current.dist + e.deltaY * 0.004));
    };

    el.addEventListener("pointerdown",  onDown);
    el.addEventListener("pointermove",  onMove);
    el.addEventListener("pointerup",    onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown",  onDown);
      el.removeEventListener("pointermove",  onMove);
      el.removeEventListener("pointerup",    onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, phaseRef, orbitRef]);

  return null;
}

// ─── 场景内容 ─────────────────────────────────────────────
function SceneContent({ phaseRef, marsPosRef, orbitRef }: {
  phaseRef: React.MutableRefObject<Phase>;
  marsPosRef: React.MutableRefObject<THREE.Vector3>;
  orbitRef: React.MutableRefObject<OrbitState>;
}) {
  const milkyWay = useTexture("/textures/8k_stars_milky_way.jpg");

  return (
    <>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[900, 64, 64]} />
        <meshBasicMaterial map={milkyWay} side={THREE.BackSide} />
      </mesh>
      <Stars radius={400} depth={60} count={4000} factor={3} saturation={0.1} fade speed={0.15} />
      <ambientLight intensity={0.04} />
      <Sun />
      {PLANETS.map(def => (
        <group key={def.name}>
          <OrbitRing radius={def.orbitR} dim={def.orbitR > 30} />
          <Planet def={def} marsPosRef={marsPosRef} />
        </group>
      ))}
      <CameraController phaseRef={phaseRef} marsPosRef={marsPosRef} orbitRef={orbitRef} />
      <DragController   phaseRef={phaseRef} orbitRef={orbitRef} />
    </>
  );
}

// ─── HUD ─────────────────────────────────────────────────
function Hud({ phase }: { phase: Phase }) {
  if (phase === "intro") {
    return (
      <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none">
        <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-cyan-300/50 animate-pulse">
          SOLAR SYSTEM · SOL
        </p>
      </div>
    );
  }
  if (phase === "zoom") {
    return (
      <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none">
        <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-orange-300/60 animate-pulse">
          LOCKING ON MARS ···
        </p>
      </div>
    );
  }
  return (
    <div className="absolute bottom-4 right-5 pointer-events-none flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      <span className="font-mono text-[9px] text-red-400/60 tracking-widest uppercase">
        MARS LOCKED · SOL 1242
      </span>
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────
interface Props {
  onComplete?: () => void;
  className?: string;
}

export default function SolarSystemScene({ onComplete, className }: Props) {
  const phaseRef   = useRef<Phase>("intro");
  const marsPosRef = useRef(new THREE.Vector3(
    Math.cos(1.2) * 16.5, 0, Math.sin(1.2) * 16.5,
  ));
  const orbitRef = useRef<OrbitState>({ theta: 0.5, phi: 1.1, dist: 3.2, autoSpin: true });

  // phase state 仅用于 HUD 显示
  const [hudPhase, setHudPhase] = useState<Phase>("intro");

  useEffect(() => {
    const t1 = setTimeout(() => {
      phaseRef.current = "zoom";
      setHudPhase("zoom");
    }, 2500);
    const t2 = setTimeout(() => {
      phaseRef.current = "locked";
      setHudPhase("locked");
      onComplete?.();
    }, 5800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // onComplete 意图上是稳定的，但若父组件传入不稳定的函数引用会导致重置
  // 用 eslint-disable 明确说明
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`relative select-none overflow-hidden ${className ?? ""}`}
      style={{ cursor: hudPhase === "locked" ? "grab" : "default" }}
    >
      <Canvas
        camera={{ position: [0, 52, 68], fov: 58, near: 0.05, far: 2000 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        style={{ background: "#00020a", display: "block", width: "100%", height: "100%" }}
      >
        <SceneContent phaseRef={phaseRef} marsPosRef={marsPosRef} orbitRef={orbitRef} />
      </Canvas>
      <Hud phase={hudPhase} />
    </div>
  );
}
