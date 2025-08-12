import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      // 針對舊版 Safari（iOS 12）
      targets: ['defaults', 'ios_saf >= 12'],
      renderLegacyChunks: true,
      modernPolyfills: true,
      polyfills: [
        'es.symbol',
        'es.array.find',
        'es.array.flat',
        'es.object.from-entries',
        'es.promise.finally',
        'es.string.replace',
      ],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          store: ['zustand']
        }
      }
    },
  },
  esbuild: {
    target: 'es2018'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'zustand']
  }
})
