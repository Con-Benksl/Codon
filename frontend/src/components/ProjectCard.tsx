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
      className="bg-card border border-border rounded-xl p-4 hover:border-border-hover transition-colors cursor-pointer"
      onClick={() => onOpen(project.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-text truncate pr-2">
          {project.name}
        </h3>
        <Badge variant={statusVariant(project.status)}>
          {t(`projects.status.${statusKey}`)}
        </Badge>
      </div>

      {project.description && (
        <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-dim">
          {t("projects.updated")} {timeAgo}
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            className="p-1.5 rounded-md hover:bg-danger/10 text-text-dim hover:text-danger transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project.id);
            }}
            className="p-1.5 rounded-md hover:bg-primary/10 text-text-dim hover:text-primary transition-colors"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
