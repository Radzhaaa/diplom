import { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, onCheckedChange, onChange, style, ...props }, ref) => {
  return (
    <input type="checkbox" ref={ref} className={className}
      style={{ width: '1rem', height: '1rem', cursor: 'pointer', ...style }}
      onChange={(e) => { onChange?.(e); onCheckedChange?.(e.target.checked); }}
      {...props} />
  );
});
Checkbox.displayName = 'Checkbox';
