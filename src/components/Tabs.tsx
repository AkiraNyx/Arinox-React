import { useId, useRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useControllable, useIndicator, useNode } from '../motion.js';
export type TabItem = { value: string; label: ReactNode; content: ReactNode; disabled?: boolean };
export type TabsProps = Omit<ComponentPropsWithRef<'div'>, 'onChange'> & { items: readonly TabItem[]; label: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void };
export function Tabs({ items, label, value, defaultValue, onValueChange, className = '', ref, ...props }: TabsProps) {
  const [selected, setSelected] = useControllable(value, defaultValue ?? items.find(item => !item.disabled)?.value ?? '', onValueChange);
  const active = items.find(item => item.value === selected && !item.disabled)?.value ?? items.find(item => !item.disabled)?.value;
  const id = useId(); const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [root, attach] = useNode<HTMLDivElement>(ref);
  useIndicator(root, active);
  const select = (index: number) => { if (items[index].disabled) return; setSelected(items[index].value); buttons.current[index]?.focus({ preventScroll: true }); };
  return <div {...props} ref={attach} className={'ax-tabs ' + className}><div role="tablist" aria-label={label} className="ax-tablist"><span className="ax-selection-indicator" aria-hidden="true" />{items.map((item, index) => <button key={item.value} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={active === item.value} aria-controls={`${id}-panel-${index}`} disabled={item.disabled} tabIndex={active === item.value ? 0 : -1} ref={node => { buttons.current[index] = node; }} onClick={() => select(index)} onKeyDown={event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const enabled = items.map((entry, i) => entry.disabled ? -1 : i).filter(i => i >= 0), position = enabled.indexOf(index);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (position + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length;
    if (enabled[next] !== undefined) select(enabled[next]);
  }}>{item.label}</button>)}</div>{items.map((item, index) => <section key={item.value} className="ax-tabpanel" role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} tabIndex={0} hidden={active !== item.value}>{item.content}</section>)}</div>;
}
