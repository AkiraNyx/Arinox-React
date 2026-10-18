import { cp, mkdir } from 'node:fs/promises';
await mkdir(new URL('../lib/', import.meta.url), { recursive: true });
await cp(new URL('../src/styles/', import.meta.url), new URL('../lib/styles/', import.meta.url), { recursive: true });
await cp(new URL('../src/assets/', import.meta.url), new URL('../lib/assets/', import.meta.url), { recursive: true });
