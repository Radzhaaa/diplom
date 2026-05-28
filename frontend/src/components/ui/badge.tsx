import { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ children, className, variant, style, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className || ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '9999px', padding: '0.125rem 0.625rem', fontSize: '0.75rem', fontWeight: 500, ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
