import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
await build({ root:fileURLToPath(new URL('./consumer/',import.meta.url)),configFile:false,plugins:[react()],logLevel:'warn',build:{outDir:'dist'} });
console.log('External tarball consumer built');
