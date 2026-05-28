import { InputHTMLAttributes, forwardRef } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ onCheckedChange, onChange, checked, style, ...props }, ref) => {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
      <input type="checkbox" ref={ref} checked={checked}
        onChange={(e) => { onChange?.(e); onCheckedChange?.(e.target.checked); }}
        style={{ display: 'none' }} {...props} />
      <div style={{
        width: '2.5rem', height: '1.375rem', borderRadius: '9999px', position: 'relative',
        background: checked ? '#6366f1' : 'rgba(255,255,255,0.2)', transition: 'background 0.2s', ...style,
      }}>
        <div style={{
          position: 'absolute', top: '0.1875rem', left: checked ? 'calc(100% - 1.0625rem)' : '0.1875rem',
          width: '1rem', height: '1rem', borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        }} />
      </div>
    </label>
  );
});
Switch.displayName = 'Switch';
