export function Card({ children, className, style, ...props }: any) {
  return <div className={className} style={{ borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', ...style }} {...props}>{children}</div>;
}
export function CardHeader({ children, className, style, ...props }: any) {
  return <div className={className} style={{ padding: '1.5rem 1.5rem 0', ...style }} {...props}>{children}</div>;
}
export function CardTitle({ children, className, style, ...props }: any) {
  return <h3 className={className} style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0, ...style }} {...props}>{children}</h3>;
}
export function CardDescription({ children, className, style, ...props }: any) {
  return <p className={className} style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0.25rem 0 0', ...style }} {...props}>{children}</p>;
}
export function CardContent({ children, className, style, ...props }: any) {
  return <div className={className} style={{ padding: '1rem 1.5rem', ...style }} {...props}>{children}</div>;
}
export function CardFooter({ children, className, style, ...props }: any) {
  return <div className={className} style={{ padding: '0 1.5rem 1.5rem', display: 'flex', ...style }} {...props}>{children}</div>;
}
