import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'server-connector-boundary',
        enforce: 'pre',
        resolveId(source, importer) {
          if (!importer) return null;
          const fromClient = importer.replace(/\\/g, '/').includes('/src/');
          const normalized = source.replace(/\\/g, '/');
          const serverImport = normalized === 'server'
            || normalized.startsWith('server/')
            || normalized.includes('/server/');
          if (fromClient && serverImport) {
            throw new Error(`Client module cannot import server connector code: ${source}`);
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
