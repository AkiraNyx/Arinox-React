import { createContext, useContext, useImperativeHandle, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type ThemeName = 'day' | 'night';
export type ThemeProps = ComponentPropsWithRef<'div'> & { theme?: ThemeName };
const OverlayContext = createContext<{ root: HTMLElement | null } | null>(null);
export function OverlayHost({ root, children }: { root: HTMLElement | null; children: ReactNode }) { return <OverlayContext.Provider value={{ root }}>{children}</OverlayContext.Provider>; }

export function Theme({ theme = 'day', className = '', children, ref, ...props }: ThemeProps) {
  const element = useRef<HTMLDivElement>(null);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => element.current!, []);
  return <OverlayContext.Provider value={{ root }}><div {...props} ref={element} className={'ax-theme ' + className} data-theme={theme}>{children}<div className="ax-portals" ref={setRoot} /></div></OverlayContext.Provider>;
}

export function useOverlayRoot() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error('Arinox Menu and Dialog must be inside <Theme>.');
  return context.root;
}
