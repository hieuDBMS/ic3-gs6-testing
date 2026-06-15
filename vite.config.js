import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Raise warning threshold (default 500kB is too aggressive for a full app)
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor code into stable, cache-friendly chunks
        manualChunks: {
          // React runtime – almost never changes → long cache TTL
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client – stable
          'vendor-supabase': ['@supabase/supabase-js'],
          // Icon library – large but shared everywhere
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Target modern browsers – smaller output, no legacy polyfills
    target: 'es2020',
    // Enable minification
    minify: 'esbuild',
    sourcemap: false,
  },
  // Speed up dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'lucide-react'],
  },
});
