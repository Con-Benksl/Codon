import { startTransition, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, ArrowRight, FolderOpen, Loader2, RefreshCw, UploadCloud, Database, Layers3 } from 'lucide-react';
import { useLocale } from '../i18n/context';
import type { Locale } from '../i18n/context';

function locVal(value: any, locale: Locale): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && (value.zh || value.en)) {
    return locale === 'zh' ? (value.zh || value.en) : (value.en || value.zh);
  }
  return String(value);
}
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
  const { t, locale } = useLocale();
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
  const [activeProjectId, setActiveProjectId] = useState<number | null>(() => getActiveProjectId());

  useEffect(() => {
    const syncActiveProject = () => setActiveProjectId(getActiveProjectId());

    window.addEventListener('storage', syncActiveProject);
    window.addEventListener('active-project-changed', syncActiveProject as EventListener);

    return () => {
      window.removeEventListener('storage', syncActiveProject);
      window.removeEventListener('active-project-changed', syncActiveProject as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!activeProjectId) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setProject(null);
      setSnapshot(null);
      setArtifacts([]);
      setJob(null);
      setError(null);
      setLoading(false);
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
    <div className="flex flex-col gap-5 p-4 md:p-8 min-h-full">
      {!loading && !activeProjectId && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden glass-panel rounded-[1.75rem] border border-primary/15 p-6 md:p-10"
        >
          {/* 背景装饰 */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/6 blur-3xl" />

          <div className="relative flex flex-col items-start gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_20px_rgba(78,168,217,0.15)]">
              <FolderOpen size={24} className="text-primary" />
            </div>
            <div className="max-w-2xl">
              <p className="text-[10px] font-headline uppercase tracking-[0.25em] text-primary/70 mb-2">
                {t('dynamicView.noProject.eyebrow')}
              </p>
              <h1 className="text-2xl md:text-3xl font-headline font-black tracking-tight text-on-surface leading-tight">
                {t('dynamicView.noProject.title')}{' '}
                <span className="text-primary">{getFallbackTitle(viewKey)}</span>{' '}
                {t('dynamicView.noProject.titleSuffix')}
              </h1>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                {t('dynamicView.noProject.desc')}
              </p>
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-2.5 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-[11px] font-headline uppercase tracking-widest text-primary hover:bg-primary/20 transition-colors"
            >
              <FolderOpen size={14} />
              {t('dynamicView.noProject.open')}
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </motion.section>
      )}

      {activeProjectId && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden glass-panel rounded-[1.75rem] border border-outline-variant/20 p-5 md:p-6"
        >
          {/* 顶部装饰线 */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Layers3 size={11} className="text-primary" />
                </div>
                <p className="text-[10px] font-headline uppercase tracking-[0.25em] text-primary/70">
                  {t('dynamicView.header.eyebrow')}
                </p>
              </div>
              <h1 className="text-2xl md:text-3xl font-headline font-black tracking-tight text-on-surface">
                {project?.name || localStorage.getItem('active_project_name') || 'Project'}
              </h1>
              <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
                {project?.description || `${getFallbackTitle(viewKey)} · Schema-driven runtime view`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUploadFiles}
                accept=".json,.csv,.xlsx,.xls,.pdf,.doc,.docx,.txt,.md"
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleUploadClick}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-[11px] font-headline uppercase tracking-widest text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
                {t('dynamicView.header.uploadData')}
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={handleRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container px-4 py-2.5 text-[11px] font-headline uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50 transition-colors"
              >
                {regenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {t('dynamicView.header.regenerate')}
              </motion.button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: t('dynamicView.stats.view'),
                value: locVal(snapshot?.layout?.page?.title, locale) || getFallbackTitle(viewKey),
                color: 'text-primary',
                icon: <Layers3 size={13} className="text-primary/60" />,
              },
              {
                label: t('dynamicView.stats.datasetVersion'),
                value: snapshot?.dataset_version ?? '—',
                color: 'text-on-surface',
                icon: <RefreshCw size={13} className="text-on-surface-variant/50" />,
              },
              {
                label: t('dynamicView.stats.artifacts'),
                value: String(artifacts.length),
                color: 'text-tertiary',
                icon: <Database size={13} className="text-tertiary/60" />,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="group rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3 flex items-start gap-3 hover:border-outline-variant/30 transition-colors"
              >
                <div className="mt-0.5">{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant/70">
                    {stat.label}
                  </p>
                  <p className={`mt-1.5 text-lg font-headline font-black leading-none ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {(job || error || (snapshot && !schemaValid)) && (
        <motion.section
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl border border-outline-variant/20 p-4"
        >
          {error ? (
            <div className="flex items-start gap-3 text-secondary">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : !schemaValid ? (
            <div className="flex items-start gap-3 text-secondary">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p className="text-sm">{t('dynamicView.errors.schemaFailed')}</p>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-headline uppercase tracking-widest text-on-surface-variant">
                  {job?.job_type || 'job'} · {job?.status || 'pending'}
                </p>
                <p className="text-sm text-on-surface">{lastEvent?.message || t('dynamicView.job.started')}</p>
              </div>
            </div>
          )}
        </motion.section>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary/60" />
        </div>
      ) : !activeProjectId ? null : snapshot && schemaValid ? (
        <ViewRenderer layout={snapshot.layout} data={snapshot.data} />
      ) : !error ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/25 px-5 py-12 text-center text-sm text-on-surface-variant/60">
          {t('dynamicView.errors.noSnapshot')}
        </div>
      ) : null}
    </div>
  );
}
