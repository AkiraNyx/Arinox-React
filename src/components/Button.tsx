import type { ComponentPropsWithRef } from 'react';
export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: 'primary' | 'neutral' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};
export function Button({ variant = 'neutral', size = 'md', loading = false, disabled, type = 'button', className = '', children, ...props }: ButtonProps) {
  return <button {...props} type={type} className={'ax-button ' + className} data-variant={variant} data-size={size} disabled={disabled || loading} aria-busy={loading || props['aria-busy']}>{children}</button>;
}
