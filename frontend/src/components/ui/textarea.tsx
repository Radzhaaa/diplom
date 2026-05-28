import { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, style, ...props }, ref) => {
  return (
    <textarea ref={ref} className={className}
      style={{ width: '100%', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', fontSize: '0.875rem', resize: 'vertical', outline: 'none', ...style }}
      {...props} />
  );
});
Textarea.displayName = 'Textarea';
