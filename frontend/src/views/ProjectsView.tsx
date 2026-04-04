import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { useLocale } from "../i18n/context";
import { getProjects, createProject, deleteProject, type Project } from "../api/projects";
import { ProjectCard } from "../components";
import { viewTransition, stagger, fadeSlideUp } from "../lib/motion";

type ApiDetailItem = { msg?: string };

const getErrorMessage = (detail: unknown, fallback: string) => {
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === "object" && item ? (item as ApiDetailItem).msg : ""))
      .filter(Boolean);
    if (messages.length > 0) return messages.join("; ");
  }
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};

const getRequestErrorMessage = (error: unknown, fallback: string) => {
  const detail = (error as any)?.response?.data?.detail;
  return getErrorMessage(detail, fallback);
};

export default function ProjectsView() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      setError("");
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(getRequestErrorMessage(err, t("projects.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await createProject({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      setShowCreate(false);
      await fetchProjects();
    } catch (err) {
      setError(getRequestErrorMessage(err, t("projects.createFailed")));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("projects.confirmDelete"))) return;
    setError("");
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(getRequestErrorMessage(err, t("projects.deleteFailed")));
    }
  };

  const handleOpen = (id: number) => {
    localStorage.setItem("active_project_id", String(id));
    navigate("/designer");
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 md:p-8 max-w-5xl"
    >
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-xl font-headline font-medium text-text tracking-tight">
            {t("projects.title")}
          </h1>
          <p className="text-sm text-text-muted mt-1">{t("projects.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          {t("projects.newProject")}
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-danger/10 border border-danger/20 rounded-lg">
          <p className="text-danger text-xs">{error}</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-headline font-medium text-text">
                {t("projects.createProject")}
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-text-dim hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">{t("projects.projectName")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">{t("projects.projectDescription")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
                >
                  {t("projects.cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="px-4 py-2 bg-primary text-bg rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? t("common.loading") : t("projects.create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-text-muted text-sm">{t("common.loading")}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted text-sm">{t("projects.empty")}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 border border-border text-text-muted rounded-lg text-sm hover:border-border-hover hover:text-text transition-colors"
          >
            <Plus size={14} className="inline mr-1" />
            {t("projects.newProject")}
          </button>
        </div>
      ) : (
        <motion.div
          variants={stagger(60)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={fadeSlideUp}>
              <ProjectCard
                project={project}
                onOpen={handleOpen}
                onDelete={handleDelete}
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

