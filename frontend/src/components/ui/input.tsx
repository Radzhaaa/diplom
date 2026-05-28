import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, style, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={className}
      style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none', ...style }}
      {...props}
    />
  );
});
Input.displayName = 'Input';
