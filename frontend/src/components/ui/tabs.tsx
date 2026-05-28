import { createContext, useContext, useState, ReactNode } from 'react';

const TabsContext = createContext<{ value: string; onValueChange: (v: string) => void }>({ value: '', onValueChange: () => {} });

export function Tabs({ defaultValue, value, onValueChange, children, className, style, ...props }: any) {
  const [internal, setInternal] = useState(defaultValue || '');
  const current = value !== undefined ? value : internal;
  const onChange = onValueChange || setInternal;
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: onChange }}>
      <div className={className} style={style} {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className, style, ...props }: any) {
  return <div role="tablist" className={className} style={{ display: 'flex', gap: '4px', ...style }} {...props}>{children}</div>;
}

export function TabsTrigger({ value, children, className, style, ...props }: any) {
  const { value: current, onValueChange } = useContext(TabsContext);
  const isActive = current === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onValueChange(value)}
      className={className}
      style={{ cursor: 'pointer', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: isActive ? 600 : 400, transition: 'all 0.2s', ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className, style, ...props }: any) {
  const { value: current } = useContext(TabsContext);
  if (current !== value) return null;
  return <div role="tabpanel" className={className} style={style} {...props}>{children}</div>;
}
