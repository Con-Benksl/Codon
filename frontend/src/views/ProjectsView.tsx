import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Loader2, Dna, FolderOpen } from 'lucide-react';
import { createProject, deleteProject, getProjects, type Project } from '../api';
import { stagger, fadeSlideUp } from '../lib/motion';
import { ProjectCard } from '../components';

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      console.error('加载项目失败:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createProject({ name: newName.trim(), description: newDesc.trim() || undefined });
      setNewName('');
      setNewDesc('');
      setShowModal(false);
      loadProjects();
    } catch (e) {
      console.error('创建项目失败:', e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除此项目？所有相关数据将被永久清除。')) return;
    setProjects(ps => ps.filter(p => p.id !== id));
    try {
      await deleteProject(id);
    } catch (err) {
      console.error('删除失败:', err);
      loadProjects();
    }
  };

  const handleOpen = (project: Project) => {
    localStorage.setItem('active_project_id', String(project.id));
    localStorage.setItem('active_project_name', project.name);
    navigate('/orchestrator');
  };

  const activeCount = projects.filter(p => p.status === 'active').length;
  const draftCount = projects.filter(p => p.status === 'draft').length;

  return (
    <div className="min-h-full p-6 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-end justify-between mb-8"
      >
        <div>
          <p className="text-[10px] font-headline text-primary/50 tracking-[0.2em] uppercase mb-1">
            MARS SYNBIO AGENT
          </p>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">
            MY PROJECTS
          </h1>
          <p className="text-xs text-on-surface-variant mt-1.5 font-body">
            管理你的合成生物学研究项目
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-primary/20 transition-colors"
        >
          <Plus size={13} />
          新建项目
        </motion.button>
      </motion.div>

      {/* Stats strip */}
      {!loading && (
        <motion.div
          variants={stagger(80)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {[
            { label: '全部项目', value: projects.length, color: 'text-on-surface' },
            { label: '进行中',   value: activeCount,     color: 'text-tertiary'   },
            { label: '草稿',     value: draftCount,      color: 'text-primary'    },
          ].map(stat => (
            <motion.div
              key={stat.label}
              variants={fadeSlideUp}
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

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="text-primary/40 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center">
            <Dna size={28} className="text-primary/30" />
          </div>
          <div className="text-center">
            <p className="font-headline text-sm text-on-surface/60 uppercase tracking-widest mb-1">
              暂无项目
            </p>
            <p className="text-xs text-on-surface-variant/40 font-body">
              创建你的第一个合成生物学研究项目
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 text-primary text-[11px] font-headline tracking-widest uppercase rounded-lg hover:bg-primary/20 transition-colors mt-2"
          >
            <Plus size={13} />
            创建第一个项目
          </motion.button>
        </motion.div>
      )}

      {/* Project grid */}
      {!loading && projects.length > 0 && (
        <motion.ul
          variants={stagger(80)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0"
        >
          {projects.map(project => (
            <motion.li key={project.id} variants={fadeSlideUp}>
              <ProjectCard
                project={project}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* Create project modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="glass-panel rounded-2xl p-6 w-full max-w-md pointer-events-auto border border-outline-variant/20"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <FolderOpen size={15} className="text-primary/70" />
                    </div>
                    <div>
                      <h2 className="font-headline font-bold text-on-surface text-sm uppercase tracking-tight">
                        新建项目
                      </h2>
                      <p className="text-[10px] text-on-surface-variant/50 font-body">
                        合成生物学研究项目
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

                {/* Form */}
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-headline text-on-surface-variant/60 uppercase tracking-widest">
                      项目名称 <span className="text-secondary">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Mars Terraforming Bacteria"
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface font-body placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-headline text-on-surface-variant/60 uppercase tracking-widest">
                      项目描述
                    </label>
                    <textarea
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="简短描述项目目标与研究方向..."
                      rows={3}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface font-body placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 py-2.5 text-[11px] font-headline uppercase tracking-wider text-on-surface-variant border border-outline-variant/30 rounded-lg hover:bg-surface-container transition-colors"
                    >
                      取消
                    </button>
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.96 }}
                      disabled={creating || !newName.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-headline uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      {creating ? '创建中...' : '创建项目'}
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
