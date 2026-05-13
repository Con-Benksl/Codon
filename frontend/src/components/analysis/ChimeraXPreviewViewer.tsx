import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

interface ChimeraXPreviewViewerProps {
  modelUrl: string;
  className?: string;
  resetSignal?: number;
  autoRotate?: boolean;
}

type ViewerStatus = "loading" | "ready" | "error";

const TARGET_MODEL_SIZE = 4;

function disposeMaterial(material: THREE.Material) {
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });
  material.dispose();
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
    } else if (material) {
      disposeMaterial(material);
    }
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to load the GLB preview.";
}

function frameModel(
  model: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);
  const scale = maxDimension > 0 ? TARGET_MODEL_SIZE / maxDimension : 1;
  const radius = Math.max((maxDimension * scale) / 2, 1);
  const cameraDistance =
    radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

  camera.near = Math.max(cameraDistance / 100, 0.01);
  camera.far = cameraDistance * 100;
  camera.position.set(0, radius * 0.35, cameraDistance * 1.25);
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.minDistance = Math.max(cameraDistance * 0.25, 0.75);
  controls.maxDistance = cameraDistance * 4;
  controls.update();
  controls.saveState();
}

export default function ChimeraXPreviewViewer({
  modelUrl,
  className = "",
  resetSignal,
  autoRotate = false,
}: ChimeraXPreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setStatus("loading");
    setErrorMessage("");

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const controls = new OrbitControls(camera, renderer.domElement);
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let modelRoot: THREE.Group | null = null;
    let isDisposed = false;

    camera.position.set(0, 0, 6);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controls.target.set(0, 0, 0);
    controls.saveState();

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 8);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);

    rendererRef.current = renderer;
    controlsRef.current = controls;
    resetViewRef.current = () => {
      controls.reset();
      controls.update();
    };

    const resize = () => {
      const nextWidth = Math.max(container.clientWidth, 1);
      const nextHeight = Math.max(container.clientHeight, 1);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    if (!modelUrl) {
      setStatus("error");
      setErrorMessage("Missing GLB model URL.");
    } else {
      loader.load(
        modelUrl,
        (gltf) => {
          if (isDisposed) {
            disposeObject(gltf.scene);
            return;
          }

          modelRoot = new THREE.Group();
          modelRoot.add(gltf.scene);
          frameModel(modelRoot, camera, controls);
          scene.add(modelRoot);
          setStatus("ready");
        },
        undefined,
        (error) => {
          if (isDisposed) return;
          setStatus("error");
          setErrorMessage(getErrorMessage(error));
        },
      );
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      controls.dispose();

      if (modelRoot) {
        scene.remove(modelRoot);
        disposeObject(modelRoot);
      }

      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      scene.clear();
      if (rendererRef.current === renderer) {
        rendererRef.current = null;
      }
      if (controlsRef.current === controls) {
        controlsRef.current = null;
      }
      if (resetViewRef.current) {
        resetViewRef.current = null;
      }
    };
  }, [modelUrl]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    if (resetSignal === undefined) return;
    resetViewRef.current?.();
  }, [resetSignal]);

  return (
    <div
      className={`relative min-h-[22rem] overflow-hidden rounded-2xl border border-white/15 bg-surface ${className}`}
      aria-busy={status === "loading"}
    >
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-3">
        <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            ChimeraX GLB
          </div>
          <div className="mt-1 text-sm text-text-muted">Fallback preview</div>
        </div>
        {status === "ready" && (
          <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-text-dim backdrop-blur-sm">
            Drag to rotate · Scroll to zoom
          </div>
        )}
      </div>

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            <div className="text-sm font-medium text-text-muted">Loading GLB preview...</div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg/70 px-6 backdrop-blur-sm">
          <div className="max-w-md rounded-xl border border-danger/35 bg-danger/10 px-5 py-4 text-center">
            <div className="text-base font-semibold text-danger">Preview unavailable</div>
            <div className="mt-2 break-words text-sm leading-relaxed text-rose-100/80">
              {errorMessage}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
