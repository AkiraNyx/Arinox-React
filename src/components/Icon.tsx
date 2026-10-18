import type { ComponentPropsWithRef } from 'react';
import { iconPaths } from './icon-paths.js';
export type IconName = keyof typeof iconPaths;
export type IconProps = ComponentPropsWithRef<'svg'> & { name: IconName };
export function Icon({ name, className = '', ...props }: IconProps) { return <svg aria-hidden="true" viewBox="0 0 24 24" {...props} className={'ax-icon ' + className}>{iconPaths[name]}</svg>; }
