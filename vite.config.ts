import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  logLevel: 'warn',
  plugins: [react()],
  optimizeDeps: { exclude: ['@arinox/react'] },
  build: { rollupOptions: { input: ['index.html', 'showcase.html', 'checks.html'] } },
});
