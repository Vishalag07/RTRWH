import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'
import { splitVendorChunkPlugin } from 'vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react({ fastRefresh: true }),
    splitVendorChunkPlugin(),
    viteCommonjs(),
    visualizer({ open: false, gzipSize: true, brotliSize: true }),
    viteCompression({ algorithm: 'brotliCompress' }),
    viteCompression({ algorithm: 'gzip' }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'http://backend:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three-core'
            if (id.includes('@react-three/fiber') || id.includes('@react-three/drei')) return 'three-extras'
            if (id.includes('framer-motion')) return 'framer-motion'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'framer-motion',
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  // Additional performance tweaks
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
})
