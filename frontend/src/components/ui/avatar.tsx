export function Avatar({ children, className, style }: any) {
  return <div className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', overflow: 'hidden', ...style }}>{children}</div>;
}

export function AvatarImage({ src, alt, className, style }: any) {
  if (!src) return null;
  return <img src={src} alt={alt} className={className} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;
}

export function AvatarFallback({ children, className, style }: any) {
  return <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '0.75rem', fontWeight: 600, ...style }}>{children}</div>;
}
