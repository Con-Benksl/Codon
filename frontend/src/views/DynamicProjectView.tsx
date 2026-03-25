import { startTransition, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import {
  buildJobEventsUrl,
  getProject,
  getProjectArtifacts,
  getProjectView,
  regenerateProjectViews,
  uploadProjectArtifacts,
  type Project,
  type ProjectArtifact,
  type ProjectJob,
  type ProjectViewSnapshot,
} from '../api';
import ViewRenderer from '../runtime-schema/ViewRenderer';
import { validateRuntimeSchema } from '../runtime-schema/schemaValidator';

interface DynamicProjectViewProps {
  viewKey: string;
}

function getActiveProjectId() {
  const raw = localStorage.getItem('active_project_id');
  const parsed = raw ? Number(raw) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getFallbackTitle(viewKey: string) {
  return viewKey.charAt(0).toUpperCase() + viewKey.slice(1);
}

export default function DynamicProjectView({ viewKey }: DynamicProjectViewProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [snapshot, setSnapshot] = useState<ProjectViewSnapshot | null>(null);
  const [artifacts, setArtifacts] = useState<ProjectArtifact[]>([]);
  const [job, setJob] = useState<ProjectJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeProjectId = useMemo(() => getActiveProjectId(), []);

  useEffect(() => {
    if (!activeProjectId) {
      navigate('/projects');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [projectData, viewData, artifactData] = await Promise.all([
          getProject(activeProjectId),
          getProjectView(activeProjectId, viewKey),
          getProjectArtifacts(activeProjectId),
        ]);
        if (cancelled) return;
        startTransition(() => {
          setProject(projectData);
          setSnapshot(viewData);
          setArtifacts(artifactData);
        });
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.response?.data?.detail || err?.message || 'Failed to load project view');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [activeProjectId, navigate, viewKey]);

  const subscribeToJob = (nextJob: ProjectJob) => {
    if (!activeProjectId) return;
    eventSourceRef.current?.close();

    const source = new EventSource(buildJobEventsUrl(activeProjectId, nextJob.id), {
      withCredentials: true,
    });
    eventSourceRef.current = source;
    setJob(nextJob);

    source.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setJob((prev) =>
          prev
            ? {
                ...prev,
                events_json: [...prev.events_json, payload],
              }
            : nextJob
        );
      } catch {
        // ignore malformed event payloads
      }
    });

    source.addEventListener('done', async (event) => {
      source.close();
      try {
        const payload = JSON.parse(event.data);
        setJob((prev) => (prev ? { ...prev, status: payload.status } : prev));
        const [viewData, artifactData] = await Promise.all([
          getProjectView(activeProjectId, viewKey),
          getProjectArtifacts(activeProjectId),
        ]);
        startTransition(() => {
          setSnapshot(viewData);
          setArtifacts(artifactData);
        });
      } catch {
        // ignore reload failures here, page level error will show on next action
      } finally {
        setUploading(false);
        setRegenerating(false);
      }
    });

    source.onerror = () => {
      source.close();
      setUploading(false);
      setRegenerating(false);
    };
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    if (!activeProjectId || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const response = await uploadProjectArtifacts(activeProjectId, files);
      subscribeToJob(response.job);
    } catch (err: any) {
      setUploading(false);
      setError(err?.response?.data?.detail || err?.message || 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRegenerate = async () => {
    if (!activeProjectId) return;
    setRegenerating(true);
    setError(null);
    try {
      const nextJob = await regenerateProjectViews(activeProjectId, [viewKey]);
      subscribeToJob(nextJob);
    } catch (err: any) {
      setRegenerating(false);
      setError(err?.response?.data?.detail || err?.message || 'Regeneration failed');
    }
  };

  const lastEvent = job?.events_json?.[job.events_json.length - 1];
  const schemaValid = snapshot ? validateRuntimeSchema(snapshot.layout) : false;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 min-h-full">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-[1.75rem] border border-outline-variant/20 p-5 md:p-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-headline uppercase tracking-[0.25em] text-primary/60">
              Dynamic Frontend Runtime
            </p>
            <h1 className="text-2xl md:text-3xl font-headline font-black tracking-tight text-on-surface mt-1">
              {project?.name || localStorage.getItem('active_project_name') || 'Project'}
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-3xl">
              {project?.description || `Schema-driven ${getFallbackTitle(viewKey)} view backed by uploaded artifacts and project jobs.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUploadFiles}
              accept=".json,.csv,.xlsx,.xls,.pdf,.doc,.docx,.txt,.md"
            />
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-[11px] font-headline uppercase tracking-widest text-primary disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
              Upload Data
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container px-4 py-2.5 text-[11px] font-headline uppercase tracking-widest text-on-surface-variant disabled:opacity-50"
            >
              {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Regenerate View
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
            <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">View</p>
            <p className="mt-2 text-lg font-headline font-black text-primary">
              {snapshot?.layout?.page?.title || getFallbackTitle(viewKey)}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
            <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">Dataset Version</p>
            <p className="mt-2 text-lg font-headline font-black text-on-surface">
              {snapshot?.dataset_version ?? '-'}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
            <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">Artifacts</p>
            <p className="mt-2 text-lg font-headline font-black text-tertiary">
              {artifacts.length}
            </p>
          </div>
        </div>
      </motion.section>

      {(job || error || (snapshot && !schemaValid)) && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-2xl border border-outline-variant/20 p-4">
          {error ? (
            <div className="flex items-start gap-3 text-secondary">
              <AlertCircle size={18} className="mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          ) : !schemaValid ? (
            <div className="flex items-start gap-3 text-secondary">
              <AlertCircle size={18} className="mt-0.5" />
              <p className="text-sm">Runtime schema validation failed for this snapshot.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                {job?.job_type || 'job'} · {job?.status || 'pending'}
              </p>
              <p className="text-sm text-on-surface">{lastEvent?.message || 'Job started'}</p>
            </div>
          )}
        </motion.section>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : snapshot && schemaValid ? (
        <ViewRenderer layout={snapshot.layout} data={snapshot.data} />
      ) : !error ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/25 px-5 py-10 text-sm text-on-surface-variant">
          No dynamic snapshot available for this view yet.
        </div>
      ) : null}
    </div>
  );
}
