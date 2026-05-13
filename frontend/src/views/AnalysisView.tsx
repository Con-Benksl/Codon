import { useState } from "react";
import { motion } from "motion/react";
import {
  Atom,
  BookOpen,
  Boxes,
  Database,
  Eye,
  ExternalLink,
  FileText,
  Layers3,
  Microscope,
  Network,
  RefreshCcw,
  Rotate3D,
  ScanLine,
  Sparkles,
} from "lucide-react";
import { useLocale } from "../i18n/context";
import { viewTransition } from "../lib/motion";
import { DEFAULT_PROTEIN_MODEL, type ProteinModelRecord } from "../lib/protein-models";
import ProteinStructureViewer from "../components/analysis/ProteinStructureViewer";
import ChimeraXPreviewViewer from "../components/analysis/ChimeraXPreviewViewer";

type ViewerMode = "structure" | "chimerax";
type Representation = "mixed" | "cartoon" | "surface" | "ball-stick";
type DossierTab = "overview" | "assembly" | "paper";

const VIEWER_MODES: Array<{
  id: ViewerMode;
  label: string;
  description: string;
}> = [
  {
    id: "structure",
    label: "结构解析",
    description: "mmCIF · Mol*",
  },
  {
    id: "chimerax",
    label: "ChimeraX 预览",
    description: "GLB · 渲染资产",
  },
];

const REPRESENTATIONS: Array<{
  id: Representation;
  label: string;
  icon: typeof Atom;
}> = [
  { id: "mixed", label: "混合", icon: Layers3 },
  { id: "cartoon", label: "Cartoon", icon: ScanLine },
  { id: "surface", label: "Surface", icon: Boxes },
  { id: "ball-stick", label: "Ball-stick", icon: Atom },
];

function DetailRows({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="divide-y divide-white/10">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 py-3 first:pt-0 last:pb-0">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-text-dim">
            {item.label}
          </dt>
          <dd className="min-w-0 break-words text-sm font-semibold leading-6 text-text">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Atom;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[0.12] bg-black/20 p-3 shadow-inner shadow-black/20 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-text-dim">
          {label}
        </span>
        <Icon size={16} className="shrink-0 text-primary" />
      </div>
      <div className="truncate font-mono text-lg font-semibold text-text sm:text-xl">{value}</div>
      <div className="mt-1 truncate text-xs text-text-muted">{detail}</div>
    </div>
  );
}

function FactGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 rounded-lg border border-white/10 bg-white/[0.03] p-3"
        >
          <dt className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-text-dim">
            {item.label}
          </dt>
          <dd className="mt-1 min-w-0 break-words text-sm font-semibold leading-5 text-text">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const DOSSIER_TABS: Array<{ id: DossierTab; label: string; icon: typeof Atom }> = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "assembly", label: "Assembly", icon: Network },
  { id: "paper", label: "Paper", icon: BookOpen },
];

function DossierTabs({
  activeTab,
  onChange,
}: {
  activeTab: DossierTab;
  onChange: (tab: DossierTab) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/25 p-1">
      {DOSSIER_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
            className={`inline-flex min-h-[38px] min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors ${
              active
                ? "bg-primary/[0.18] text-primary"
                : "text-text-muted hover:bg-white/[0.05] hover:text-text"
            }`}
          >
            <Icon size={14} className="shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function DossierPanel({
  model,
  activeTab,
  onTabChange,
  identityRows,
  citationRows,
  viewerItems,
}: {
  model: ProteinModelRecord;
  activeTab: DossierTab;
  onTabChange: (tab: DossierTab) => void;
  identityRows: Array<{ label: string; value: string }>;
  citationRows: Array<{ label: string; value: string }>;
  viewerItems: Array<{ label: string; value: string }>;
}) {
  const method = model.metadata.find((item) => item.label === "Method")?.value ?? "cryo-EM";
  const resolution =
    model.experimentalDetails.find((item) => item.label === "Resolution")?.value ?? "2.01 Å";
  const assembly =
    model.assemblyDetails.find((item) => item.label === "Assembly")?.value ??
    "Biological Assembly 1";
  const symmetry =
    model.assemblyDetails.find((item) => item.label === "Global symmetry")?.value ?? "Cyclic C3";
  const mass =
    model.assemblyDetails.find((item) => item.label === "Structure weight")?.value ??
    "1,111.57 kDa";
  const chainCount =
    model.assemblyDetails.find((item) => item.label === "Unique protein chains")?.value ?? "";

  return (
    <section className="overflow-hidden rounded-2xl border border-white/15 bg-slate-950/[0.88] shadow-2xl shadow-black/35 backdrop-blur-xl">
      <div className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.14),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.72))] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <Database size={21} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Molecular Dossier
            </div>
            <h2 className="mt-2 break-words font-mono text-2xl font-semibold tracking-tight text-text">
              {model.pdbEntry.code}/{model.pdbEntry.accession}
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-text-muted">{model.entryTitle}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {[method, resolution, model.pdbEntry.emdbId].map((chip) => (
            <span
              key={chip}
              className="inline-flex min-h-[28px] items-center rounded-full border border-white/[0.12] bg-white/[0.05] px-3 text-xs font-semibold text-text-muted"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 border-b border-white/10 p-5 sm:grid-cols-2">
        <MetricTile label="Method" value={method} detail="Experimental record" icon={Microscope} />
        <MetricTile label="Resolution" value={resolution} detail="Density map" icon={ScanLine} />
        <MetricTile label="Assembly" value={symmetry} detail={assembly} icon={Boxes} />
        <MetricTile
          label="Mass"
          value={mass}
          detail={`${chainCount} chain types`}
          icon={Atom}
        />
      </div>

      <div className="p-5">
        <DossierTabs activeTab={activeTab} onChange={onTabChange} />

        <div className="mt-5 min-h-[320px]">
          {activeTab === "overview" && (
            <div className="space-y-5">
              <FactGrid items={identityRows} />
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-dim">
                  <Eye size={14} />
                  Viewer state
                </div>
                <DetailRows items={viewerItems} />
              </div>
            </div>
          )}

          {activeTab === "assembly" && (
            <div className="space-y-4">
              <FactGrid items={model.assemblyDetails} />
              <a
                href={model.pdbEntry.emdbUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 text-xs font-semibold text-success transition-colors hover:border-success/50"
              >
                <ExternalLink size={14} />
                {model.pdbEntry.emdbId}
              </a>
            </div>
          )}

          {activeTab === "paper" && (
            <div className="space-y-4">
              <ul className="space-y-3 border-y border-white/10 py-4">
                {model.researchHighlights.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-text-muted">
                    <Atom size={15} className="mt-1 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
              <DetailRows items={citationRows} />
              <a
                href={model.literature.doi}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-3 text-xs font-semibold text-text-muted transition-colors hover:border-warning/40 hover:text-text"
              >
                <ExternalLink size={14} />
                Science DOI · PubMed {model.literature.pubmed}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AnalysisView() {
  const { t } = useLocale();
  const [viewerMode, setViewerMode] = useState<ViewerMode>("structure");
  const [representation, setRepresentation] = useState<Representation>("mixed");
  const [resetSignal, setResetSignal] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [dossierTab, setDossierTab] = useState<DossierTab>("overview");

  const model = DEFAULT_PROTEIN_MODEL;
  const activeAssetUrl = viewerMode === "structure" ? model.structureUrl : model.previewUrl;
  const activeModeLabel = viewerMode === "structure" ? "Structure" : "ChimeraX";
  const activeRepresentation =
    viewerMode === "structure"
      ? REPRESENTATIONS.find((item) => item.id === representation)?.label ?? "Mixed"
      : "Rendered GLB";
  const analysisStats = [
    { label: "PDB", value: model.pdbEntry.code, tone: "text-primary" },
    { label: "Resolution", value: "2.01 Å", tone: "text-success" },
    { label: "EMDB", value: model.pdbEntry.emdbId.replace("EMD-", ""), tone: "text-warning" },
  ];
  const identityRows = [
    { label: "Classification", value: model.pdbEntry.classification },
    { label: "Organism", value: model.pdbEntry.organism },
    { label: "Expression system", value: model.pdbEntry.expressionSystem },
    { label: "Mutation", value: model.pdbEntry.mutations },
  ];
  const citationRows = [
    { label: "Primary citation", value: model.literature.title },
    { label: "Journal", value: `${model.literature.journal} (${model.literature.year})` },
    { label: "Deposition authors", value: model.pdbEntry.authors.join(", ") },
    { label: "Funding", value: model.pdbEntry.funding.join("; ") },
  ];
  const viewerItems = [
    { label: "Mode", value: activeModeLabel },
    { label: "Representation", value: activeRepresentation },
    { label: "Auto rotate", value: autoRotate ? "ON" : "OFF" },
    { label: "Reset count", value: String(resetSignal) },
    {
      label: "Record dates",
      value: `Deposited ${model.pdbEntry.deposited}; released ${model.pdbEntry.released}`,
    },
  ];

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative min-h-screen overflow-hidden p-4 sm:p-6 md:p-8 xl:p-10"
    >
      <div className="pointer-events-none fixed inset-0 z-0 bg-slate-950/62 backdrop-blur-[1px]" />
      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles size={14} />
              Molecular Analysis Workstation
            </div>
            <h1 className="text-3xl font-headline font-semibold leading-[1.15] tracking-tight text-text md:text-5xl">
              {t("analysis.title")} · {model.name}
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-text-muted">
              {t("analysis.subtitle")}，聚焦 {model.scientificName} 的结构浏览、ChimeraX 导出资产与
              9EYS 科研记录。
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-[380px]">
            {analysisStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-0 rounded-2xl border border-white/15 bg-card-translucent px-3 py-3 sm:px-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-text-dim">
                  {stat.label}
                </div>
                <div
                  className={`mt-1 truncate font-mono text-base font-semibold sm:text-lg md:text-2xl ${stat.tone}`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 2xl:grid-cols-[minmax(580px,1fr)_430px]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-surface/90 shadow-2xl shadow-black/25">
            <div className="grid gap-4 border-b border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
              <div className="grid gap-2 sm:grid-cols-2">
                {VIEWER_MODES.map((mode) => {
                  const active = viewerMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setViewerMode(mode.id)}
                      className={`min-h-12 min-w-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                        active
                          ? "border-primary/50 bg-primary/15 text-text shadow-[inset_0_0_0_1px_rgba(56,189,248,0.12)]"
                          : "border-white/15 bg-white/[0.03] text-text-muted hover:border-primary/30 hover:bg-white/[0.06] hover:text-text"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{mode.label}</span>
                      <span className="block text-xs text-text-dim">{mode.description}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:grid-cols-2">
                <button
                  type="button"
                  aria-pressed={autoRotate}
                  onClick={() => setAutoRotate((current) => !current)}
                  className={`inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 text-sm font-semibold transition-colors ${
                    autoRotate
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-white/15 bg-white/[0.03] text-text-muted hover:border-primary/30 hover:bg-white/[0.06] hover:text-text"
                  }`}
                >
                  <Rotate3D size={17} className="shrink-0" />
                  Auto rotate
                </button>
                <button
                  type="button"
                  onClick={() => setResetSignal((current) => current + 1)}
                  className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-white/15 bg-white/[0.03] px-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary/30 hover:bg-white/[0.06] hover:text-text"
                >
                  <RefreshCcw size={17} className="shrink-0" />
                  Reset view
                </button>
              </div>
            </div>

            <div className="relative h-[58vh] min-h-[420px] max-h-[620px] bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.12),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.96))] md:h-auto md:min-h-[620px] md:max-h-none">
              <div className="absolute left-5 top-5 z-10 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-mono text-text-dim backdrop-blur-md">
                {viewerMode === "structure" ? model.formats.structure : model.formats.preview}
              </div>

              {viewerMode === "structure" ? (
                <ProteinStructureViewer
                  structureUrl={model.structureUrl}
                  className="h-full min-h-[420px] rounded-none border-0 bg-transparent md:min-h-[620px]"
                  representation={representation}
                  resetSignal={resetSignal}
                  autoRotate={autoRotate}
                />
              ) : (
                <ChimeraXPreviewViewer
                  modelUrl={model.previewUrl}
                  className="h-full min-h-[420px] rounded-none border-0 bg-transparent md:min-h-[620px]"
                  resetSignal={resetSignal}
                  autoRotate={autoRotate}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3 text-sm text-text-muted">
                <Database size={17} className="shrink-0 text-primary" />
                <span title={activeAssetUrl} className="truncate font-mono text-xs text-text-dim">
                  {activeAssetUrl}
                </span>
              </div>
              <div className="flex max-w-full overflow-x-auto rounded-lg border border-white/15 bg-white/[0.03] p-1">
                {REPRESENTATIONS.map((item) => {
                  const Icon = item.icon;
                  const active = representation === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      disabled={viewerMode !== "structure"}
                      onClick={() => setRepresentation(item.id)}
                      className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-transparent ${
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-text-muted hover:bg-white/[0.06] hover:text-text"
                      }`}
                    >
                      <Icon size={15} className="shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="min-w-0 2xl:sticky 2xl:top-6 2xl:max-h-[calc(100vh-3rem)] 2xl:overflow-y-auto 2xl:overscroll-contain 2xl:pr-1 [scrollbar-gutter:stable]">
            <DossierPanel
              model={model}
              activeTab={dossierTab}
              onTabChange={setDossierTab}
              identityRows={identityRows}
              citationRows={citationRows}
              viewerItems={viewerItems}
            />
          </aside>
        </section>
      </div>
    </motion.div>
  );
}
