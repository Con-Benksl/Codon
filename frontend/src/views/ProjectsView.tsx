import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X, Loader2, Dna, FolderOpen, LogIn, AlertCircle } from "lucide-react";
import { createProject, deleteProject, getCurrentUser, getProjects, type Project } from "../api";
import { stagger } from "../lib/motion";
import { ProjectCard } from "../components";
import { useLocale } from "../i18n/context";

const slideUp = {
  hidden: { y: 20 },
  show: { y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const detail = (error as any)?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [pageError, setPageError] = useState("");
  const [modalError, setModalError] = useState("");
  const navigate = useNavigate();
  const { locale } = useLocale();

  const copy = locale === "zh"
    ? {
      title: "我的项目",
      subtitle: "管理你的合成生物学研究项目",
      newProject: "新建项目",
      statsAll: "全部项目",
      statsActive: "进行中",
      statsDraft: "草稿",
      loginTitle: "登录后查看项目",
      loginDesc: "登录你的账户以管理合成生物学研究项目",
      toLogin: "去登录",
      emptyTitle: "暂无项目",
      emptyDesc: "创建你的第一个合成生物学研究项目",
      createFirst: "创建第一个项目",
      modalTitle: "新建项目",
      modalSubtitle: "Synthetic biology research workspace",
      projectName: "项目名称",
      projectDesc: "项目描述",
      namePlaceholder: "例如：火星定植菌群设计",
      descPlaceholder: "简要描述项目目标、约束和研究方向...",
      cancel: "取消",
      creating: "创建中...",
      create: "创建项目",
      confirmDelete: "确定删除此项目？所有相关数据将被永久移除。",
      loadErr: "加载项目失败:",
      createErr: "创建项目失败:",
      deleteErr: "删除项目失败:",
      createFailed: "创建项目失败，请检查登录状态或稍后重试。",
      loadFailed: "项目加载失败，请刷新后重试。",
      invalidName: "项目名称不能为空。",
    }
    : {
      title: "MY PROJECTS",
      subtitle: "Manage your synthetic biology research projects",
      newProject: "NEW PROJECT",
      statsAll: "ALL PROJECTS",
      statsActive: "ACTIVE",
      statsDraft: "DRAFT",
      loginTitle: "Sign in to view projects",
      loginDesc: "Sign in to manage your synthetic biology projects",
      toLogin: "SIGN IN",
      emptyTitle: "No projects yet",
      emptyDesc: "Create your first synthetic biology project",
      createFirst: "CREATE FIRST PROJECT",
      modalTitle: "NEW PROJECT",
      modalSubtitle: "Synthetic biology research workspace",
      projectName: "Project Name",
      projectDesc: "Project Description",
      namePlaceholder: "e.g. Mars Terraforming Bacteria",
      descPlaceholder: "Briefly describe project goals and research direction...",
      cancel: "CANCEL",
      creating: "CREATING...",
      create: "CREATE PROJECT",
      confirmDelete: "Delete this project? All related data will be permanently removed.",
      loadErr: "Failed to load projects:",
      createErr: "Failed to create project:",
      deleteErr: "Failed to delete project:",
      createFailed: "Failed to create project. Check your sign-in state or try again later.",
      loadFailed: "Failed to load projects. Refresh and try again.",
      invalidName: "Project name is required.",
    };

  useEffect(() => {
    void initializeProjects();
  }, []);

  const initializeProjects = async () => {
    try {
      await getCurrentUser();
      setAuthenticated(true);
      const data = await getProjects();
      setProjects(data);
      setPageError("");
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
        setPageError(getErrorMessage(error, copy.loadFailed));
      }
      console.error(copy.loadErr, error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    if (!authenticated) return;
    try {
      const data = await getProjects();
      setProjects(data);
      setPageError("");
    } catch (error) {
      setPageError(getErrorMessage(error, copy.loadFailed));
      console.error(copy.loadErr, error);
    }
  };

  const handleNewProject = () => {
    if (!authenticated) {
      navigate("/login?redirect=/projects");
      return;
    }
    setModalError("");
    setShowModal(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const trimmedDesc = newDesc.trim();

    if (!trimmedName) {
      setModalError(copy.invalidName);
      return;
    }

    setCreating(true);
    setModalError("");
    try {
      const createdProject = await createProject({
        name: trimmedName,
        description: trimmedDesc || undefined,
      });
      setProjects((prev) => [createdProject, ...prev]);
      setNewName("");
      setNewDesc("");
      setShowModal(false);
      setPageError("");
      localStorage.setItem("active_project_id", String(createdProject.id));
      localStorage.setItem("active_project_name", createdProject.name);
      window.dispatchEvent(new Event("active-project-changed"));
      navigate("/orchestrator");
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        setAuthenticated(false);
        setShowModal(false);
        navigate("/login?redirect=/projects");
        return;
      }
      setModalError(getErrorMessage(error, copy.createFailed));
      console.error(copy.createErr, error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm(copy.confirmDelete)) return;
    setProjects((prev) => prev.filter((project) => project.id !== id));
    try {
      await deleteProject(id);
    } catch (error) {
      setPageError(getErrorMessage(error, copy.deleteErr));
      console.error(copy.deleteErr, error);
      void loadProjects();
    }
  };

  const handleOpen = (project: Project) => {
    localStorage.setItem("active_project_id", String(project.id));
    localStorage.setItem("active_project_name", project.name);
    window.dispatchEvent(new Event("active-project-changed"));
    navigate("/orchestrator");
  };

  const activeCount = projects.filter((project) => project.status === "active").length;
  const draftCount = projects.filter((project) => project.status === "draft").length;

  return (
    <div className="min-h-full p-6 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ y: -12 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-end justify-between mb-8"
      >
        <div>
          <p className="text-[10px] font-headline text-primary/50 tracking-[0.2em] uppercase mb-1">
            MARS SYNBIO AGENT
          </p>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">
            {copy.title}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1.5 font-body">
            {copy.subtitle}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNewProject}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Plus size={13} />
          {copy.newProject}
        </motion.button>
      </motion.div>

      {!loading && authenticated && pageError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-start gap-3 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{pageError}</span>
        </motion.div>
      )}

      {!loading && authenticated && (
        <motion.div
          variants={stagger(80)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: copy.statsAll, value: projects.length, color: "text-on-surface" },
            { label: copy.statsActive, value: activeCount, color: "text-tertiary" },
            { label: copy.statsDraft, value: draftCount, color: "text-primary" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={slideUp}
              className="glass-panel rounded-xl px-4 py-3 flex flex-col gap-0.5"
            >
              <span className={`text-xl font-headline font-bold ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-[10px] font-headline text-on-surface-variant/60 uppercase tracking-widest">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="text-primary/40 animate-spin" />
        </div>
      )}

      {!loading && !authenticated && (
        <motion.div
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center">
            <LogIn size={28} className="text-primary/30" />
          </div>
          <div className="text-center">
            <p className="font-headline text-sm text-on-surface/60 uppercase tracking-widest mb-1">
              {copy.loginTitle}
            </p>
            <p className="text-xs text-on-surface-variant/40 font-body">
              {copy.loginDesc}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login?redirect=/projects")}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-primary/20 transition-colors mt-2"
          >
            <LogIn size={13} />
            {copy.toLogin}
          </motion.button>
        </motion.div>
      )}

      {!loading && authenticated && projects.length === 0 && (
        <motion.div
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center">
            <Dna size={28} className="text-primary/30" />
          </div>
          <div className="text-center">
            <p className="font-headline text-sm text-on-surface/60 uppercase tracking-widest mb-1">
              {copy.emptyTitle}
            </p>
            <p className="text-xs text-on-surface-variant/40 font-body">
              {copy.emptyDesc}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNewProject}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-primary/20 transition-colors mt-2"
          >
            <Plus size={13} />
            {copy.createFirst}
          </motion.button>
        </motion.div>
      )}

      {!loading && authenticated && projects.length > 0 && (
        <motion.ul
          variants={stagger(80)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0"
        >
          {projects.map((project) => (
            <motion.li key={project.id} variants={slideUp}>
              <ProjectCard project={project} onOpen={handleOpen} onDelete={handleDelete} />
            </motion.li>
          ))}
        </motion.ul>
      )}

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="glass-panel rounded-2xl p-6 w-full max-w-md pointer-events-auto border border-outline-variant/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <FolderOpen size={15} className="text-primary/70" />
                    </div>
                    <div>
                      <h2 className="font-headline font-bold text-on-surface text-sm uppercase tracking-tight">
                        {copy.modalTitle}
                      </h2>
                      <p className="text-[10px] text-on-surface-variant/50 font-body">
                        {copy.modalSubtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-headline text-on-surface-variant/60 uppercase tracking-widest">
                      {copy.projectName} <span className="text-secondary">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={copy.namePlaceholder}
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface font-body placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-headline text-on-surface-variant/60 uppercase tracking-widest">
                      {copy.projectDesc}
                    </label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder={copy.descPlaceholder}
                      rows={3}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface font-body placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                    />
                  </div>

                  {modalError && (
                    <div className="flex items-start gap-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs text-secondary">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 text-[11px] font-headline uppercase tracking-wider text-on-surface-variant border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-colors"
                    >
                      {copy.cancel}
                    </button>
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.96 }}
                      disabled={creating || !newName.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-headline uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      {creating ? copy.creating : copy.create}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
