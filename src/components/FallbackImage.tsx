import { useState, useCallback } from "react";
import type { ReactNode, CSSProperties } from "react";

interface FallbackImageProps {
  src?: string;
  alt?: string;
  fallbackSrc?: string;
  fallbackElement?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Image component with automatic fallback on load error.
 * Falls back to fallbackSrc → fallbackElement → CSS gradient placeholder.
 */
export default function FallbackImage({
  src,
  alt,
  fallbackSrc,
  fallbackElement,
  className,
  style,
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  }, [fallbackSrc, imgSrc]);

  if (hasError) {
    if (fallbackElement) {
      return <>{fallbackElement}</>;
    }
    // Default gradient placeholder
    return (
      <div
        className={className}
        style={{
          background: "linear-gradient(135deg, rgba(78,168,217,0.3) 0%, rgba(100,221,153,0.2) 100%)",
          ...style,
        }}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      referrerPolicy="no-referrer"
    />
  );
}
