import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: "primary" | "secondary" | "tertiary";
}

const colorMap = {
  primary: "bg-primary/10 border-primary/20 text-primary",
  secondary: "bg-secondary/10 border-secondary/20 text-secondary",
  tertiary: "bg-tertiary/10 border-tertiary/20 text-tertiary",
} as const;

export default function Badge({ children, color = "primary" }: BadgeProps) {
  return (
    <span className={`px-3 py-1 border text-[10px] font-headline tracking-tighter uppercase rounded-sm ${colorMap[color]}`}>
      {children}
    </span>
  );
}
