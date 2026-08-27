import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  },
  build: {
    outDir: 'dist'
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.1.0')
  },
  esbuild: {
    pure: ['console.log', 'console.warn', 'console.debug']
  }
});
