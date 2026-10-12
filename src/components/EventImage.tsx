'use client';

export default function EventImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" fill="%23f3f4f6"><rect width="800" height="450"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="%239ca3af" text-anchor="middle" dy=".3em">No Image Available</text></svg>';
      }}
    />
  );
}
