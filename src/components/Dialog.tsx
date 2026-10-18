import { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ComponentPropsWithRef, ReactNode, RefObject } from 'react';
import { useControllable, useEvent, useNode, usePresence } from '../motion.js';
import type { MotionPhase } from '../motion.js';
import { OverlayHost, useOverlayRoot } from './Theme.js';
export type DialogControls = { close: () => void; phase: MotionPhase };
export type DialogTriggerProps = Pick<ComponentPropsWithRef<'button'>, 'onClick' | 'aria-haspopup' | 'aria-controls' | 'aria-expanded'> & { ref: RefObject<HTMLButtonElement | null> };
export type DialogProps = Omit<ComponentPropsWithRef<'dialog'>, 'open' | 'children'> & {
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; onAfterClose?: () => void;
  trigger?: (props: DialogTriggerProps) => ReactNode; children?: ReactNode | ((controls: DialogControls) => ReactNode);
  initialFocusRef?: RefObject<HTMLElement | null>; returnFocus?: () => HTMLElement | null;
};
export function Dialog({ open: controlled, defaultOpen = false, onOpenChange, onAfterClose, trigger, children, initialFocusRef, returnFocus, className = '', ref, id: explicitId, onCancel, onClose, ...props }: DialogProps) {
  const [open, setOpen] = useControllable(controlled, defaultOpen, onOpenChange);
  const [node, attach] = useNode<HTMLDialogElement>(ref);
  const source = useRef<HTMLButtonElement>(null), previous = useRef<HTMLElement | null>(null), closingNative = useRef(false);
  const portal = useOverlayRoot(), generated = useId(), id = explicitId ?? generated;
  const restore = useEvent(() => { const target = returnFocus?.() ?? source.current ?? previous.current; if (target?.isConnected && !target.closest('[inert]')) target.focus({ preventScroll: true }); });
  const prepare = useEvent(() => {
    if (!node) return;
    if (!node.open) { previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; closingNative.current = false; node.showModal(); }
    const target = returnFocus?.() ?? source.current ?? previous.current;
    const bounds = node.getBoundingClientRect(), origin = target?.getBoundingClientRect();
    if (origin) node.style.transformOrigin = Math.max(0, Math.min(bounds.width, origin.left + origin.width / 2 - bounds.left)) + 'px ' + Math.max(0, Math.min(bounds.height, origin.top + origin.height / 2 - bounds.top)) + 'px';
    if (initialFocusRef?.current?.isConnected) initialFocusRef.current.focus({ preventScroll: true });
    else if (!node.contains(document.activeElement)) node.querySelector<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')?.focus({ preventScroll: true });
  });
  const presence = usePresence(open, node, 'dialog', prepare, () => { closingNative.current = true; node?.close(); restore(); onAfterClose?.(); });
  useLayoutEffect(() => () => { if (node?.open) { closingNative.current = true; node.close(); restore(); } }, [node, restore]);
  return <>{trigger?.({ ref: source, 'aria-haspopup': 'dialog', 'aria-controls': id, 'aria-expanded': open, onClick: () => setOpen(true) })}{portal && presence.present && createPortal(<dialog {...props} ref={attach} id={id} className={'ax-dialog ax-glass ' + className} inert={!open} data-motion-state={presence.phase} onCancel={event => { onCancel?.(event); if (event.defaultPrevented) return; event.preventDefault(); setOpen(false); }} onClose={event => { onClose?.(event); if (!closingNative.current) setOpen(false); }}><OverlayHost root={node}>{typeof children === 'function' ? children({ close: () => setOpen(false), phase: presence.phase }) : children}</OverlayHost></dialog>, portal)}</>;
}
