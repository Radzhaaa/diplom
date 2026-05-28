export function Separator({ orientation = 'horizontal', className, style }: any) {
  return (
    <div className={className} style={{
      ...(orientation === 'horizontal'
        ? { width: '100%', height: '1px' }
        : { height: '100%', width: '1px' }),
      background: 'rgba(255,255,255,0.1)',
      flexShrink: 0,
      ...style,
    }} />
  );
}
