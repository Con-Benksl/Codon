interface IconProps {
  name: string;
  size?: number;
  className?: string;
  fill?: boolean;
}

export default function Icon({ name, size = 24, className = "", fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  );
}
