import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-300 group/item ${
        active
          ? "bg-surface-container text-tertiary shadow-[0_0_15px_rgba(100,221,153,0.3)]"
          : "text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-surface-container"
      }`}
    >
      <Icon size={24} className="shrink-0" />
      <span className="font-headline text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
