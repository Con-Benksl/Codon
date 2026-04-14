import { motion } from "motion/react";
import { Trash2, ExternalLink } from "lucide-react";
import Badge from "./Badge";
import { cardHover } from "../lib/motion";
import type { Project } from "../api/projects";

interface ProjectCardProps {
  project: Project;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  t: (key: string) => string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "active" as const;
    case "in_progress": return "progress" as const;
    case "completed": return "active" as const;
    default: return "draft" as const;
  }
};

export default function ProjectCard({ project, onOpen, onDelete, t }: ProjectCardProps) {
  const statusKey = ["active", "in_progress", "completed", "draft"].includes(project.status)
    ? project.status
    : "draft";
  const timeAgo = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString()
    : new Date(project.created_at).toLocaleDateString();

  return (
    <motion.div
      {...cardHover}
      className="bg-card-translucent border border-white/20 rounded-2xl p-6 hover:border-primary/40 hover:bg-primary/[0.04] transition-all duration-300 cursor-pointer"
      onClick={() => onOpen(project.id)}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3 className="text-xl font-semibold text-text truncate pr-1">
          {project.name}
        </h3>
        <Badge variant={statusVariant(project.status)}>
          {t(`projects.status.${statusKey}`)}
        </Badge>
      </div>

      {project.description && (
        <p className="text-base text-text-muted line-clamp-2 mb-5 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-text-dim">
          {t("projects.updated")} {timeAgo}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            className="p-2.5 rounded-lg hover:bg-danger/10 text-text-dim hover:text-danger transition-colors"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project.id);
            }}
            className="p-2.5 rounded-lg hover:bg-primary/10 text-text-dim hover:text-primary transition-colors"
          >
            <ExternalLink size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
