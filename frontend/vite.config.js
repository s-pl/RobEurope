import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../',

  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Heavy editor — only loaded in pages that use it
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-monaco';
          if (id.includes('react-quill') || id.includes('/quill/')) return 'vendor-quill';
          // Animation libs — not needed on first paint
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('/gsap/') || id.includes('gsap/')) return 'vendor-gsap';
          // Real-time transport
          if (id.includes('socket.io')) return 'vendor-socket';
          // i18n — loaded after hydration
          if (id.includes('i18next')) return 'vendor-i18n';
          // Markdown / syntax highlighting
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype') ||
            id.includes('react-syntax-highlighter') ||
            id.includes('highlight.js')
          ) return 'vendor-markdown';
          // Radix UI components
          if (id.includes('@radix-ui')) return 'vendor-radix';
          // Icon library
          if (id.includes('lucide')) return 'vendor-icons';
          // File utilities — archive page only
          if (id.includes('jszip') || id.includes('file-saver')) return 'vendor-files';
          // Everything else in node_modules (includes React, react-dom, react-router)
          // NOTE: React core must NOT be manually split — Vite/Rollup manages it to
          // guarantee a single instance. Splitting it causes "useLayoutEffect undefined".
          return 'vendor';
        }
      }
    }
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },

  server: {
    host: true,
    allowedHosts: [
      'robeurope.samuelponce.es',
      'www.robeurope.samuelponce.es',
      'localhost',
      '127.0.0.1',
      '46.101.255.106'
    ]
  }
})
