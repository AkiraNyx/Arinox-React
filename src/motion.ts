import { animate, createScope, cubicBezier } from 'animejs';
import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Ref, RefObject } from 'react';
import { useImperativeHandle } from 'react';

let media: MediaQueryList | undefined;
function reducedMedia() { if (typeof window === 'undefined') return undefined; return media ??= window.matchMedia('(prefers-reduced-motion: reduce)'); }
export function useReducedMotion() {
  return useSyncExternalStore(useCallback(notify => { const query = reducedMedia(); query?.addEventListener('change', notify); return () => query?.removeEventListener('change', notify); }, []), () => reducedMedia()?.matches ?? false, () => false);
}
export function useEvent<A extends unknown[], R>(handler: (...args: A) => R) {
  const latest = useRef(handler);
  useLayoutEffect(() => { latest.current = handler; });
  return useCallback((...args: A) => latest.current(...args), []);
}
export function useControllable<T>(value: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [internal, setInternal] = useState(initial);
  const actual = value === undefined ? internal : value;
  const latest = useRef(actual);
  useLayoutEffect(() => { latest.current = actual; });
  const change = useEvent((next: T | ((current: T) => T)) => {
    const resolved = typeof next === 'function' ? (next as (current: T) => T)(latest.current) : next;
    if (Object.is(resolved, latest.current)) return;
    latest.current = resolved;
    if (value === undefined) setInternal(resolved);
    onChange?.(resolved);
  });
  return [actual, change] as const;
}
export function useNode<T extends HTMLElement>(external?: Ref<T>) {
  const ref = useRef<T | null>(null);
  const [node, setNode] = useState<T | null>(null);
  useImperativeHandle(external, () => ref.current!, [node]);
  const attach = useCallback((value: T | null) => { ref.current = value; setNode(value); }, []);
  return [node, attach] as const;
}
export function motionTokens(node: Element) {
  const style = getComputedStyle(node);
  const duration = (name: string, fallback: number) => parseFloat(style.getPropertyValue('--ax-motion-duration-' + name)) || fallback;
  const curve = (name: string) => {
    const values = style.getPropertyValue('--ax-motion-easing-' + name).match(/[\d.]+/g)?.map(Number);
    return values?.length === 4 ? cubicBezier(values[0], values[1], values[2], values[3]) : cubicBezier(.2, 0, 0, 1);
  };
  return { fast: duration('fast', 120), base: duration('base', 200), slow: duration('slow', 320), enter: curve('standard'), exit: curve('exit') };
}
type Frame = { node: HTMLElement; opacity: number; scale: number; y: number };
function frame(node: HTMLElement): Frame {
  const style = getComputedStyle(node);
  const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
  return { node, opacity: Number(style.opacity), scale: matrix.a, y: matrix.f };
}
export type MotionPhase = 'closed' | 'opening' | 'open' | 'closing';
export function usePresence(open: boolean, node: HTMLElement | null, kind: 'menu' | 'dialog', prepare: () => void, exited: () => void) {
  const [retained, setRetained] = useState(open);
  const [phase, setPhase] = useState<MotionPhase>(open ? 'opening' : 'closed');
  const reduced = useReducedMotion();
  const snapshot = useRef<Frame | null>(null);
  const present = open || retained;
  const before = useEvent(prepare), after = useEvent(exited);
  useLayoutEffect(() => {
    if (!node || !present) return;
    if (open) { setRetained(true); before(); }
    let active = true;
    const tokens = motionTokens(node);
    const offset = kind === 'menu' ? Number(node.dataset.offset || -4) : 0;
    const start = snapshot.current?.node === node ? snapshot.current : open ? { opacity: 0, scale: .97, y: offset } : frame(node);
    setPhase(open ? 'opening' : 'closing');
    let animation: ReturnType<typeof animate> | undefined;
    const scope = createScope({ root: node }).add(() => {
      animation = animate(node, {
        opacity: [start.opacity, open ? 1 : 0], scale: [start.scale, open ? 1 : kind === 'dialog' ? .985 : .97], translateY: [start.y, open ? 0 : offset],
        duration: open ? kind === 'dialog' ? tokens.slow : tokens.base : kind === 'dialog' ? tokens.base : tokens.fast,
        ease: open ? tokens.enter : tokens.exit,
        onComplete: () => { if (!active) return; setPhase(open ? 'open' : 'closed'); if (!open) { setRetained(false); after(); } },
      });
      if (reduced || (!open && node instanceof HTMLDialogElement && !node.open)) animation.complete();
    });
    return () => { active = false; snapshot.current = frame(node); animation?.cancel(); scope.revert(); };
  }, [node, open, present, kind, reduced, before, after]);
  return { present, phase: present ? !open ? 'closing' : phase === 'closed' || phase === 'closing' ? 'opening' : phase : 'closed' } as const;
}

export function useIndicator(root: HTMLElement | null, selected: unknown) {
  const reduced = useReducedMotion();
  const [revision, setRevision] = useState(0);
  const saved = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  useLayoutEffect(() => {
    if (!root) return;
    const observer = new ResizeObserver(() => setRevision(value => value + 1)); observer.observe(root);
    let active = true;
    document.fonts.ready.then(() => { if (active) setRevision(value => value + 1); });
    return () => { active = false; observer.disconnect(); };
  }, [root]);
  useLayoutEffect(() => {
    if (!root) return;
    const indicator = root.querySelector<HTMLElement>('.ax-selection-indicator');
    const tab = root.querySelector<HTMLElement>('[aria-selected="true"],[aria-pressed="true"]');
    if (!indicator || !tab) return;
    const list = root.querySelector<HTMLElement>('.ax-tablist') ?? root;
    const bounds = list.getBoundingClientRect(), target = tab.getBoundingClientRect();
    const underline = root.dataset.indicator === 'underline';
    const next = { x: target.left - bounds.left - list.clientLeft, y: underline ? 0 : target.top - bounds.top - list.clientTop, width: target.width, height: underline ? 2 : target.height };
    const previous = saved.current || next;
    let animation: ReturnType<typeof animate> | undefined;
    const scope = createScope({ root }).add(() => {
      const tokens = motionTokens(root);
      animation = animate(indicator, { translateX: [previous.x, next.x], translateY: [previous.y, next.y], width: [previous.width, next.width], height: [previous.height, next.height], duration: tokens.base, ease: tokens.enter });
      if (reduced || !saved.current) animation.complete();
    });
    return () => { const matrix = new DOMMatrixReadOnly(getComputedStyle(indicator).transform); saved.current = { x: matrix.e, y: matrix.f, width: indicator.getBoundingClientRect().width, height: indicator.getBoundingClientRect().height }; animation?.cancel(); scope.revert(); };
  }, [root, selected, revision, reduced]);
}

export function useLayoutTransition(root: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  const pending = useRef<Map<string, DOMRect> | null>(null);
  const scope = useRef<ReturnType<typeof createScope> | null>(null);
  const animations = useRef<ReturnType<typeof animate>[]>([]);
  const cancel = useCallback(() => { scope.current?.revert(); scope.current = null; animations.current = []; pending.current = null; }, []);
  useLayoutEffect(() => {
    if (!pending.current || !root.current) return;
    const previous = pending.current; pending.current = null;
    scope.current?.revert(); animations.current = [];
    const element = root.current;
    scope.current = createScope({ root: element }).add(() => {
      const tokens = motionTokens(element);
      for (const item of element.querySelectorAll<HTMLElement>('[data-ax-layout-item]')) {
        const old = previous.get(item.dataset.axLayoutItem!);
        const target = item.getBoundingClientRect();
        const x = old ? old.left - target.left - scrollX : 0, y = old ? old.top - target.top - scrollY : 4;
        if (!old || Math.abs(x) + Math.abs(y) > .5) animations.current.push(animate(item, { translateX: [x, 0], translateY: [y, 0], opacity: [old ? 1 : 0, 1], duration: tokens.slow, ease: tokens.enter }));
      }
      if (reduced) for (const animation of animations.current) animation.complete();
    });
  });
  useLayoutEffect(() => { if (reduced) { for (const animation of animations.current) animation.complete(); cancel(); } }, [reduced, cancel]);
  useLayoutEffect(() => { window.addEventListener('resize', cancel); return () => { window.removeEventListener('resize', cancel); cancel(); }; }, [cancel]);
  return useCallback((update: () => void) => {
    if (!reduced && root.current) pending.current = new Map([...root.current.querySelectorAll<HTMLElement>('[data-ax-layout-item]')].map(item => { const rect = item.getBoundingClientRect(); return [item.dataset.axLayoutItem!, new DOMRect(rect.left + scrollX, rect.top + scrollY, rect.width, rect.height)]; }));
    update();
  }, [reduced, root]);
}
