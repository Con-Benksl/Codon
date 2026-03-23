import type { MouseEvent } from 'react';
import { motion } from 'motion/react';
import { Dna, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { cardHover } from '../lib/motion';
import type { Project } from '../api';

const STATUS_CONFIG: Record<string, { label: string; colorClass: string }> = {
  draft:     { label: 'DRAFT',   colorClass: 'text-primary   bg-primary/10   border-primary/20'   },
  active:    { label: 'ACTIVE',  colorClass: 'text-tertiary  bg-tertiary/10  border-tertiary/20'  },
  completed: { label: 'DONE',    colorClass: 'text-secondary bg-secondary/10 border-secondary/20' },
};

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete: (id: number, e: MouseEvent) => void;
}

export default function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  const status = STATUS_CONFIG[project.status] ?? { label: project.status.toUpperCase(), colorClass: 'text-on-surface-variant bg-surface-container border-outline-variant' };
  const formattedDate = new Date(project.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <motion.div
      layout
      {...cardHover}
      onClick={() => onOpen(project)}
      className="glass-panel rounded-xl p-5 cursor-pointer group flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Dna size={18} className="text-primary/70" />
        </div>
        <span className={`px-2.5 py-0.5 border text-[10px] font-headline tracking-widest uppercase rounded ${status.colorClass}`}>
          {status.label}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-tight leading-snug mb-1.5 line-clamp-1">
          {project.name}
        </h3>
        <p className="text-xs text-on-surface-variant font-body leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {project.description || '暂无描述'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
        <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60 font-body">
          <Calendar size={11} />
          {formattedDate}
        </span>

        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={(e) => onDelete(project.id, e)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant/40 hover:text-secondary hover:bg-secondary/10 transition-colors opacity-0 group-hover:opacity-100"
            title="删除项目"
          >
            <Trash2 size={13} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={(e) => { e.stopPropagation(); onOpen(project); }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-headline uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors"
          >
            打开
            <ChevronRight size={11} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
