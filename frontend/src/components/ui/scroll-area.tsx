export function ScrollArea({ children, className, style }: any) {
  return <div className={className} style={{ overflow: 'auto', ...style }}>{children}</div>;
}

export function ScrollBar({ orientation }: any) { return null; }
