import { LabelHTMLAttributes, forwardRef } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, style, ...props }, ref) => {
  return <label ref={ref} className={className} style={{ fontSize: '0.875rem', fontWeight: 500, ...style }} {...props} />;
});
Label.displayName = 'Label';
