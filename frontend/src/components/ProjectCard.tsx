import type { MouseEvent } from "react";
import { motion } from "motion/react";
import { Dna, Calendar, ChevronRight, Trash2 } from "lucide-react";
import { cardHover } from "../lib/motion";
import type { Project } from "../api";
import { useLocale } from "../i18n/context";

const STATUS_STYLE: Record<string, { colorClass: string }> = {
  draft: { colorClass: "text-primary   bg-primary/10   border-primary/20" },
  active: { colorClass: "text-tertiary  bg-tertiary/10  border-tertiary/20" },
  completed: { colorClass: "text-secondary bg-secondary/10 border-secondary/20" },
};

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete: (id: number, e: MouseEvent) => void;
}

export default function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  const { locale } = useLocale();
  const copy = locale === "zh"
    ? {
      status: { draft: "草稿", active: "进行中", completed: "已完成" },
      noDesc: "暂无描述",
      deleteTitle: "删除项目",
      open: "打开",
    }
    : {
      status: { draft: "DRAFT", active: "ACTIVE", completed: "DONE" },
      noDesc: "No description",
      deleteTitle: "Delete project",
      open: "Open",
    };

  const status = STATUS_STYLE[project.status] ?? { colorClass: "text-on-surface-variant bg-surface-container border-outline-variant" };
  const statusLabel = copy.status[project.status as keyof typeof copy.status] ?? String(project.status ?? "unknown").toUpperCase();
  const formattedDate = new Date(project.created_at).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
          {statusLabel}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-tight leading-snug mb-1.5 line-clamp-1">
          {project.name}
        </h3>
        <p className="text-xs text-on-surface-variant font-body leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {project.description || copy.noDesc}
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
            title={copy.deleteTitle}
          >
            <Trash2 size={13} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-headline uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors"
          >
            {copy.open}
            <ChevronRight size={11} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
