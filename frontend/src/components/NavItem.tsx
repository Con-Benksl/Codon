import type { LucideIcon } from "lucide-react";
import { useLocale } from "../i18n/context";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  alwaysShowLabel?: boolean;
  onClick?: () => void;
}

export default function NavItem({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  alwaysShowLabel = false,
  onClick,
}: NavItemProps) {
  const { locale } = useLocale();
  const comingSoon = locale === "zh" ? "即将推出" : "Coming soon";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? `${label} (${comingSoon})` : label}
      className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all duration-200 group/item text-left active:scale-95 ${
        disabled
          ? "opacity-25 cursor-not-allowed text-on-surface-variant"
          : active
            ? "bg-surface-container text-tertiary shadow-[0_0_15px_rgba(100,221,153,0.3)] cursor-pointer"
            : "text-on-surface-variant opacity-60 hover:opacity-100 hover:bg-surface-container active:bg-surface-container cursor-pointer"
      }`}
    >
      <Icon size={24} className="shrink-0" />
      <span
        className={`font-headline text-xs tracking-widest uppercase transition-opacity whitespace-nowrap ${
          alwaysShowLabel ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {label}
        {disabled && <span className="ml-1 text-[9px] normal-case opacity-60">{comingSoon}</span>}
      </span>
    </button>
  );
}
