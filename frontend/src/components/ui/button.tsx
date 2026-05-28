import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={className}
        style={{ cursor: 'pointer', borderRadius: '0.5rem', fontWeight: 500, transition: 'all 0.2s', ...style }}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
