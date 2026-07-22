import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // El bundle de producción no debe exponer mensajes de consola ni depuración
    esbuild: command === 'build' ? {drop: ['console', 'debugger']} : undefined,
    build: {
      rollupOptions: {
        output: {
          // Separar las librerías pesadas en chunks propios: el navegador solo
          // descarga pdf.js/pdf-lib cuando se abre el anotador de PDF.
          manualChunks: {
            react: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            pdf: ['pdfjs-dist', 'pdf-lib'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
