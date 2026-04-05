import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // appType: 'spa' 让 dev / preview 服务器对所有未知路由回退到 index.html
    appType: 'spa' as const,
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      port: 5173,
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    preview: {
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['motion'],
            'vendor-three': ['three'],
            'vendor-utils': ['axios', 'lucide-react'],
          },
        },
      },
    },
  };
});
