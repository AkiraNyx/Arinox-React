import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
export type InputProps = ComponentPropsWithRef<'input'> & { invalid?: boolean };
export function Input({ invalid, className = '', ...props }: InputProps) { return <input {...props} className={'ax-input ' + className} aria-invalid={invalid ?? props['aria-invalid']} />; }
export type TextareaProps = ComponentPropsWithRef<'textarea'> & { invalid?: boolean };
export function Textarea({ invalid, className = '', ...props }: TextareaProps) { return <textarea {...props} className={'ax-input ' + className} aria-invalid={invalid ?? props['aria-invalid']} />; }
export type SelectProps = ComponentPropsWithRef<'select'> & { invalid?: boolean };
export function Select({ invalid, className = '', ...props }: SelectProps) { return <select {...props} className={'ax-input ax-select ' + className} aria-invalid={invalid ?? props['aria-invalid']} />; }
export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type'> & { indeterminate?: boolean };
export function Checkbox({ indeterminate = false, className = '', ref, ...props }: CheckboxProps) {
  const element = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => element.current!, []);
  useLayoutEffect(() => { if (element.current) element.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input {...props} type="checkbox" ref={element} className={'ax-checkbox ' + className} />;
}
export type SwitchProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'role'>;
export function Switch({ className = '', ...props }: SwitchProps) { return <input {...props} type="checkbox" role="switch" className={'ax-switch ' + className} />; }
export type FieldProps = ComponentPropsWithRef<'div'> & { label: ReactNode; htmlFor: string; hint?: ReactNode; error?: ReactNode };
export function Field({ label, htmlFor, hint, error, children, className = '', ...props }: FieldProps) {
  return <div {...props} className={'ax-field ' + className} data-error={!!error}><label className="ax-label" htmlFor={htmlFor}>{label}</label>{children}{(hint || error) && <p className="ax-help" id={htmlFor + '-help'} role={error ? 'alert' : undefined}>{error || hint}</p>}</div>;
}
