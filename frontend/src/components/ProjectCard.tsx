import type { MouseEvent } from "react";
import { motion } from "motion/react";
import { Dna, Calendar, ChevronRight, Trash2 } from "lucide-react";
import { cardHover } from "../lib/motion";
import type { Project } from "../api";
import { useLocale } from "../i18n/context";

const STATUS_STYLE: Record<string, { colorClass: string; dotColor: string }> = {
  draft: {
    colorClass: "text-primary bg-primary/10 border-primary/20",
    dotColor: "bg-primary",
  },
  active: {
    colorClass: "text-tertiary bg-tertiary/10 border-tertiary/20",
    dotColor: "bg-tertiary",
  },
  completed: {
    colorClass: "text-secondary bg-secondary/10 border-secondary/20",
    dotColor: "bg-secondary",
  },
};

// 根据项目 id 取一个稳定的装饰色
const ACCENT_GRADIENTS = [
  "from-primary/15 to-transparent",
  "from-tertiary/12 to-transparent",
  "from-secondary/10 to-transparent",
  "from-primary/10 via-tertiary/8 to-transparent",
];

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onDelete: (id: number, e: MouseEvent) => void;
}

export default function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  const { locale } = useLocale();
  const copy =
    locale === "zh"
      ? {
          status: { draft: "草稿", active: "进行中", completed: "已完成" },
          noDesc: "暂无项目描述",
          deleteTitle: "删除项目",
          open: "打开",
        }
      : {
          status: { draft: "DRAFT", active: "ACTIVE", completed: "DONE" },
          noDesc: "No description",
          deleteTitle: "Delete project",
          open: "Open",
        };

  const status =
    STATUS_STYLE[project.status] ?? {
      colorClass: "text-on-surface-variant bg-surface-container border-outline-variant",
      dotColor: "bg-on-surface-variant",
    };
  const statusLabel =
    copy.status[project.status as keyof typeof copy.status] ??
    String(project.status ?? "unknown").toUpperCase();
  const formattedDate = new Date(project.created_at).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );
  const accentGradient = ACCENT_GRADIENTS[project.id % ACCENT_GRADIENTS.length];

  return (
    <motion.div
      layout
      {...cardHover}
      onClick={() => onOpen(project)}
      className="relative overflow-hidden glass-panel rounded-2xl p-5 cursor-pointer group flex flex-col gap-4 border border-outline-variant/20 hover:border-outline-variant/40 transition-colors"
    >
      {/* 顶部渐变装饰 */}
      <div className={`pointer-events-none absolute top-0 left-0 right-0 h-24 bg-gradient-to-b ${accentGradient} opacity-60`} />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

      {/* 头部：图标 + 状态徽章 */}
      <div className="relative flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_2px_12px_rgba(78,168,217,0.12)]">
          <Dna size={18} className="text-primary/80" />
        </div>
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-headline tracking-widest uppercase rounded-full ${status.colorClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
          {statusLabel}
        </span>
      </div>

      {/* 项目信息 */}
      <div className="relative flex-1">
        <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-tight leading-snug mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <p className="text-xs text-on-surface-variant/70 font-body leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {project.description || copy.noDesc}
        </p>
      </div>

      {/* 底部：日期 + 操作 */}
      <div className="relative flex items-center justify-between pt-3.5 border-t border-outline-variant/20">
        <span className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/50 font-body">
          <Calendar size={11} />
          {formattedDate}
        </span>

        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={(e) => onDelete(project.id, e)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant/30 hover:text-secondary hover:bg-secondary/10 transition-colors opacity-0 group-hover:opacity-100"
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
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-headline uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
          >
            {copy.open}
            <ChevronRight size={11} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
