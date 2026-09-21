export function FigmaImage({
  alt,
  className,
  src,
}: {
  alt: string;
  className?: string;
  src: string;
}) {
  return <img alt={alt} className={className} loading="lazy" src={src} />;
}
