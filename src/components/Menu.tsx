import { createContext, useContext, useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react';
import { useControllable, useEvent, useNode, usePresence } from '../motion.js';
import { useOverlayRoot } from './Theme.js';
export type MenuTriggerProps = Pick<ComponentPropsWithRef<'button'>, 'onClick' | 'onKeyDown' | 'aria-expanded' | 'aria-controls' | 'aria-haspopup'> & { ref: RefObject<HTMLButtonElement | null> };
export type MenuProps = Omit<ComponentPropsWithRef<'div'>, 'children'> & { trigger: (props: MenuTriggerProps) => ReactNode; children: ReactNode; open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; onAfterClose?: () => void; triggerRef?: RefObject<HTMLButtonElement | null> };
const MenuContext = createContext<(() => void) | null>(null);
export function Menu({ trigger, children, open: controlled, defaultOpen = false, onOpenChange, onAfterClose, triggerRef, ref, className = '', id: explicitId, onKeyDown, ...props }: MenuProps) {
  const [open, setOpen] = useControllable(controlled, defaultOpen, onOpenChange);
  const internal = useRef<HTMLButtonElement>(null), source = triggerRef ?? internal;
  const [node, attach] = useNode<HTMLDivElement>(ref);
  const portal = useOverlayRoot(), generated = useId(), id = explicitId ?? generated;
  const first = useRef<'first' | 'last'>('first');
  const items = useEvent(() => node ? [...node.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled):not([aria-disabled="true"])')] : []);
  const position = useEvent(() => {
    if (!node || !source.current?.isConnected) { if (open && node) setOpen(false); return; }
    const bounds = source.current.getBoundingClientRect(), width = node.offsetWidth, height = node.offsetHeight;
    const above = bounds.bottom + height + 8 > innerHeight;
    const left = Math.max(8, Math.min(innerWidth - width - 8, bounds.right - width));
    node.style.left = left + 'px'; node.style.top = (above ? Math.max(8, bounds.top - height - 8) : bounds.bottom + 8) + 'px';
    node.style.transformOrigin = Math.max(0, Math.min(width, bounds.left + bounds.width / 2 - left)) + 'px ' + (above ? '100%' : '0'); node.dataset.offset = above ? '4' : '-4';
  });
  const close = useEvent((returnFocus: boolean) => { setOpen(false); if (returnFocus && source.current?.isConnected) source.current.focus({ preventScroll: true }); });
  const presence = usePresence(open, node, 'menu', () => { if (node?.showPopover && !node.matches(':popover-open')) node.showPopover({ source: source.current ?? undefined }); position(); const enabled = items(); (first.current === 'last' ? enabled.at(-1) : enabled[0])?.focus({ preventScroll: true }); }, () => onAfterClose?.());
  useLayoutEffect(() => () => { if (node?.hidePopover && node.matches(':popover-open')) node.hidePopover(); }, [node]);
  useLayoutEffect(() => {
    if (!open || !node) return;
    const outside = (event: PointerEvent) => { if (!node.contains(event.target as Node) && !source.current?.contains(event.target as Node)) close(false); };
    const focus = (event: FocusEvent) => { if (!node.contains(event.target as Node) && !source.current?.contains(event.target as Node)) close(false); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(true); } };
    const scroll = (event: Event) => { if (!node.contains(event.target as Node)) close(false); };
    const resize = () => { position(); close(false); };
    const observer = new ResizeObserver(position); observer.observe(node);
    document.addEventListener('pointerdown', outside); document.addEventListener('focusin', focus); document.addEventListener('keydown', key);
    window.addEventListener('scroll', position, true); window.addEventListener('wheel', scroll, { passive: true }); window.addEventListener('touchmove', scroll, { passive: true }); window.addEventListener('resize', resize);
    return () => { observer.disconnect(); document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', focus); document.removeEventListener('keydown', key); window.removeEventListener('scroll', position, true); window.removeEventListener('wheel', scroll); window.removeEventListener('touchmove', scroll); window.removeEventListener('resize', resize); };
  }, [open, node, source, close, position]);
  return <>{trigger({ ref: source, 'aria-haspopup': 'menu', 'aria-controls': id, 'aria-expanded': open, onClick: () => { first.current = 'first'; setOpen(current => !current); }, onKeyDown: event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); first.current = event.key === 'ArrowUp' ? 'last' : 'first'; setOpen(true); } } })}{portal && presence.present && createPortal(<MenuContext.Provider value={() => close(true)}><div {...props} popover="manual" ref={attach} id={id} role="menu" className={'ax-menu ax-glass ' + className} inert={!open} aria-hidden={!open || undefined} data-motion-state={presence.phase} onKeyDown={event => {
    onKeyDown?.(event); if (event.defaultPrevented || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation(); const enabled = items(), index = enabled.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
    enabled[next]?.focus({ preventScroll: true });
  }}>{children}</div></MenuContext.Provider>, portal)}</>;
}
export type MenuItemProps = Omit<ComponentPropsWithRef<'button'>, 'onSelect' | 'role'> & { onSelect?: () => void };
export function MenuItem({ onSelect, onClick, className = '', type = 'button', ...props }: MenuItemProps) {
  const close = useContext(MenuContext);
  return <button {...props} type={type} role="menuitem" className={'ax-menuitem ' + className} onClick={event => { if (props.disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true') { event.preventDefault(); return; } onClick?.(event); if (event.defaultPrevented) return; onSelect?.(); close?.(); }} />;
}
