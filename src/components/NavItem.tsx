import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export default function NavItem({ icon: Icon, label, active = false, disabled = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? `${label}（即将推出）` : label}
      className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-300 group/item text-left ${
        disabled
          ? "opacity-25 cursor-not-allowed text-on-surface-variant"
          : active
            ? "bg-surface-container text-tertiary shadow-[0_0_15px_rgba(100,221,153,0.3)] cursor-pointer"
            : "text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-surface-container cursor-pointer"
      }`}
    >
      <Icon size={24} className="shrink-0" />
      <span className="font-headline text-xs tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
        {disabled && <span className="ml-1 text-[9px] normal-case opacity-60">即将推出</span>}
      </span>
    </button>
  );
}
