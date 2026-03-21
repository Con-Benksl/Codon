import { useState } from "react";
import FallbackImage from "./FallbackImage";

interface AvatarProps {
  src?: string;
  alt: string;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * Avatar component with fallback to initials when image fails to load.
 */
export default function Avatar({ src, alt, name, size = 32, className = "" }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Extract initials from name or alt
  const initials = (name ?? alt)
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const initialsElement = (
    <div
      className={`rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={alt}
    >
      <span
        className="font-headline font-bold text-primary"
        style={{ fontSize: size * 0.4 }}
      >
        {initials}
      </span>
    </div>
  );

  if (!src || hasError) {
    return initialsElement;
  }

  return (
    <div
      className={`rounded-full overflow-hidden border border-primary/20 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
