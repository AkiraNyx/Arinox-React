import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Button } from './Button.js';
import type { ButtonProps } from './Button.js';
import { useControllable, useIndicator, useNode } from '../motion.js';
export type SegmentOption = { value: string; label: ReactNode; disabled?: boolean; buttonProps?: ButtonProps & { [key: `data-${string}`]: string | number | boolean | undefined } };
export type SegmentedControlProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & { label: string; options: readonly SegmentOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; appearance?: 'pill' | 'underline' };
export function SegmentedControl({ label, options, value, defaultValue, onValueChange, appearance = 'pill', ref, className = '', ...props }: SegmentedControlProps) {
  const [selected, change] = useControllable(value, defaultValue ?? options.find(option => !option.disabled)?.value ?? '', onValueChange);
  const [node, attach] = useNode<HTMLDivElement>(ref);
  useIndicator(node, selected);
  return <div {...props} ref={attach} role="group" aria-label={label} data-indicator={appearance} className={'ax-segmented ' + className}><span aria-hidden="true" className="ax-selection-indicator" />{options.map(option => <Button key={option.value} {...option.buttonProps} variant="ghost" className={'ax-segment ' + (option.buttonProps?.className ?? '')} disabled={option.disabled || option.buttonProps?.disabled} aria-pressed={selected === option.value} onClick={event => { option.buttonProps?.onClick?.(event); if (!event.defaultPrevented) change(option.value); }}>{option.label}</Button>)}</div>;
}
