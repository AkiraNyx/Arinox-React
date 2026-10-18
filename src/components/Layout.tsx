import type { ComponentPropsWithRef, CSSProperties } from 'react';
export type CardProps = ComponentPropsWithRef<'article'> & { surface?: 'paper' | 'glass' };
export function Card({ surface = 'paper', className = '', ...props }: CardProps) { return <article {...props} className={'ax-card ' + (surface === 'glass' ? 'ax-glass ' : '') + className} />; }
export type GlassProps = ComponentPropsWithRef<'div'>;
export function Glass({ className = '', ...props }: GlassProps) { return <div {...props} className={'ax-glass ' + className} />; }
type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
export type LayoutProps = ComponentPropsWithRef<'div'> & { gap?: Spacing };
function spacing(gap: Spacing, style?: CSSProperties): CSSProperties { return { gap: `var(--ax-space-${gap})`, ...style }; }
export function Stack({ gap = 4, style, className = '', ...props }: LayoutProps) { return <div {...props} className={'ax-stack ' + className} style={spacing(gap, style)} />; }
export function Inline({ gap = 2, style, className = '', ...props }: LayoutProps) { return <div {...props} className={'ax-inline ' + className} style={spacing(gap, style)} />; }
