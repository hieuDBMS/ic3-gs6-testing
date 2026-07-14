import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Raise warning threshold (default 500kB is too aggressive for a full app)
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Split vendor code into stable, cache-friendly chunks
        // (function form — Vite 8/Rolldown dropped the object form of manualChunks)
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // React runtime – almost never changes → long cache TTL
          if (/[\\/](react|react-dom|react-router|react-router-dom)[\\/]/.test(id)) return 'vendor-react';
          // Supabase client – stable
          if (id.includes('@supabase/supabase-js')) return 'vendor-supabase';
          // Icon library – large but shared everywhere
          if (id.includes('lucide-react')) return 'vendor-icons';
        },
      },
    },
    // Target modern browsers – smaller output, no legacy polyfills
    target: 'es2020',
    // Minification enabled by default (Oxc minifier in Vite 8; 'esbuild' is no
    // longer bundled and requires installing it separately)
    sourcemap: false,
  },
  // Speed up dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'lucide-react'],
  },
  test: {
    environment: 'node',
  },
});
