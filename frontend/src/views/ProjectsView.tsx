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
    navigate(`/projects/${id}/designer`);
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-8 md:p-12 max-w-7xl"
    >
      <div className="flex items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-headline font-semibold text-text tracking-tight">
            {t("projects.title")}
          </h1>
          <p className="text-lg text-text-muted mt-2">{t("projects.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-primary text-bg rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={22} />
          {t("projects.newProject")}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-danger/10 border border-danger/20 rounded-xl">
          <p className="text-danger text-base">{error}</p>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-white/15 rounded-2xl p-8 w-full max-w-lg mx-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-headline font-semibold text-text">
                {t("projects.createProject")}
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-text-dim hover:text-text">
                <X size={26} />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-base text-text-muted mb-2">{t("projects.projectName")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-white/15 rounded-xl text-lg text-text focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-base text-text-muted mb-2">{t("projects.projectDescription")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-card border border-white/15 rounded-xl text-lg text-text focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-5 py-3 text-base text-text-muted hover:text-text transition-colors"
                >
                  {t("projects.cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="px-6 py-3 bg-primary text-bg rounded-xl text-base font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? t("common.loading") : t("projects.create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-24 text-text-muted text-lg">{t("common.loading")}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-text-muted text-lg">{t("projects.empty")}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 px-6 py-3 border border-white/15 text-text-muted rounded-xl text-base hover:border-primary/40 hover:text-text transition-colors"
          >
            <Plus size={18} className="inline mr-2" />
            {t("projects.newProject")}
          </button>
        </div>
      ) : (
        <motion.div
          variants={stagger(60)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
