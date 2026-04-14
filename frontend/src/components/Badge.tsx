import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "active" | "progress" | "draft" | "default";
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  progress: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-text-dim/10 text-text-muted border-border",
  default: "bg-card text-text-muted border-border",
};

export default function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
