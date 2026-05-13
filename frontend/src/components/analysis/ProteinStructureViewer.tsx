import { useEffect, useMemo, useRef, useState } from "react";
import { Viewer } from "molstar/lib/apps/viewer/app";
import { Vec3 } from "molstar/lib/mol-math/linear-algebra/3d/vec3";
import { PresetStructureRepresentations } from "molstar/lib/mol-plugin-state/builder/structure/representation-preset";
import "molstar/build/viewer/theme/dark.css";

export type StructureRepresentation = "mixed" | "cartoon" | "surface" | "ball-stick";

export interface ProteinStructureViewerProps {
  modelUrl: string;
  className?: string;
  defaultRepresentation?: StructureRepresentation;
  representation?: StructureRepresentation;
  resetSignal?: number;
}

type ViewerPhase = "idle" | "loading" | "ready" | "error";
type ProteinStructureViewerRuntimeProps =
  | (ProteinStructureViewerProps & {
      structureUrl?: string;
      autoRotate?: boolean;
    })
  | (Omit<ProteinStructureViewerProps, "modelUrl"> & {
      modelUrl?: string;
      structureUrl: string;
      autoRotate?: boolean;
    });

const REPRESENTATION_PRESETS = {
  mixed: PresetStructureRepresentations["polymer-and-ligand"],
  cartoon: PresetStructureRepresentations["polymer-cartoon"],
  surface: PresetStructureRepresentations["molecular-surface"],
  "ball-stick": PresetStructureRepresentations["atomic-detail"],
} as const;

const SPIN_AXIS = Vec3.create(0, -1, 0);

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function applyRepresentation(viewer: Viewer, representation: StructureRepresentation) {
  const hierarchy = viewer.plugin.managers.structure.hierarchy;
  const structures =
    hierarchy.selection.structures.length > 0
      ? hierarchy.selection.structures
      : hierarchy.current.structures;

  if (structures.length === 0) return;

  await viewer.plugin.managers.structure.component.applyPreset(
    structures,
    REPRESENTATION_PRESETS[representation],
  );
}

function focusLoadedStructure(viewer: Viewer, durationMs = 250) {
  viewer.plugin.managers.camera.focusObject({ targets: [], durationMs });
}

function setAutoRotate(viewer: Viewer, autoRotate: boolean) {
  viewer.plugin.canvas3d?.setProps({
    trackball: {
      animate: autoRotate
        ? { name: "spin", params: { speed: 0.08, axis: SPIN_AXIS } }
        : { name: "off", params: {} },
    },
  });
}

export default function ProteinStructureViewer({
  modelUrl,
  structureUrl,
  className,
  defaultRepresentation = "mixed",
  representation,
  resetSignal,
  autoRotate = false,
}: ProteinStructureViewerRuntimeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const activeRepresentationRef = useRef<StructureRepresentation>(defaultRepresentation);
  const appliedRepresentationRef = useRef<StructureRepresentation | null>(null);
  const autoRotateRef = useRef(autoRotate);
  const previousResetSignalRef = useRef(resetSignal);
  const [phase, setPhase] = useState<ViewerPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolvedModelUrl = modelUrl ?? structureUrl ?? "";
  const activeRepresentation = representation ?? defaultRepresentation;
  activeRepresentationRef.current = activeRepresentation;
  autoRotateRef.current = autoRotate;

  const rootClassName = useMemo(
    () =>
      [
        "codon-molstar-viewer relative min-h-[420px] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#050816]",
        className,
      ]
        .filter(Boolean)
        .join(" "),
    [className],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let localViewer: Viewer | null = null;

    async function mountViewer() {
      if (!resolvedModelUrl) {
        setPhase("error");
        setErrorMessage("No structure model URL was provided.");
        return;
      }

      setPhase("loading");
      setErrorMessage(null);
      container.innerHTML = "";

      try {
        localViewer = await Viewer.create(container, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          layoutShowSequence: false,
          layoutShowLog: false,
          layoutShowLeftPanel: false,
          layoutShowRemoteState: false,
          collapseRightPanel: true,
          viewportShowControls: true,
          viewportShowExpand: false,
          viewportShowSelectionMode: false,
          viewportShowAnimation: false,
          viewportShowTrajectoryControls: false,
          viewportBackgroundColor: "#050816",
        });

        if (cancelled) {
          localViewer.dispose();
          return;
        }

        viewerRef.current = localViewer;
        await localViewer.plugin.clear();
        setAutoRotate(localViewer, autoRotateRef.current);
        await localViewer.loadStructureFromUrl(resolvedModelUrl, "mmcif", false);

        if (cancelled) return;

        await applyRepresentation(localViewer, activeRepresentationRef.current);
        appliedRepresentationRef.current = activeRepresentationRef.current;
        focusLoadedStructure(localViewer, 0);

        if (!cancelled) {
          setPhase("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setPhase("error");
          setErrorMessage(getErrorMessage(error));
        }
      }
    }

    const mountHandle = window.setTimeout(() => {
      void mountViewer();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(mountHandle);
      viewerRef.current = null;
      appliedRepresentationRef.current = null;

      if (localViewer) {
        localViewer.dispose();
      }

      container.innerHTML = "";
    };
  }, [resolvedModelUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || phase !== "ready") return;
    if (appliedRepresentationRef.current === activeRepresentation) return;

    let cancelled = false;

    async function updateRepresentation() {
      try {
        await applyRepresentation(viewer, activeRepresentation);
        if (!cancelled) {
          appliedRepresentationRef.current = activeRepresentation;
          focusLoadedStructure(viewer);
        }
      } catch (error) {
        if (!cancelled) {
          setPhase("error");
          setErrorMessage(getErrorMessage(error));
        }
      }
    }

    void updateRepresentation();

    return () => {
      cancelled = true;
    };
  }, [activeRepresentation, phase]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer) {
      setAutoRotate(viewer, autoRotate);
    }
  }, [autoRotate, phase]);

  useEffect(() => {
    if (resetSignal === undefined || resetSignal === previousResetSignalRef.current) return;

    previousResetSignalRef.current = resetSignal;
    const viewer = viewerRef.current;

    if (viewer && phase === "ready") {
      focusLoadedStructure(viewer);
    }
  }, [phase, resetSignal]);

  const showLoading = phase === "idle" || phase === "loading";
  const showError = phase === "error";

  return (
    <div className={rootClassName}>
      <style>
        {`
          .codon-molstar-viewer .msp-plugin {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          .codon-molstar-viewer .msp-layout-expanded,
          .codon-molstar-viewer .msp-layout-standard,
          .codon-molstar-viewer .msp-layout-standard-reactive {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          .codon-molstar-viewer .msp-layout-main {
            inset: 0 !important;
          }
        `}
      </style>
      <div ref={containerRef} className="absolute inset-0" />

      {showLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#050816]/90 px-6 text-center"
          aria-live="polite"
        >
          <div className="h-10 w-10 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
          <div>
            <div className="text-base font-semibold text-text">Loading molecular structure</div>
            <div className="mt-1 text-sm text-text-muted">Preparing Mol* mmCIF view...</div>
          </div>
        </div>
      )}

      {showError && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-[#050816]/95 px-6 text-center"
          role="alert"
        >
          <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <div className="text-base font-semibold text-red-200">Structure viewer failed to load</div>
            <div className="mt-2 break-words text-sm text-red-100/75">{errorMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
