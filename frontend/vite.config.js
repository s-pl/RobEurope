import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Lee los archivos .env desde la raíz del proyecto en vez de frontend/
  envDir: '../',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  server: {
    host: true, // Escucha en todas las interfaces
    allowedHosts: [
      'robeurope.samuelponce.es',
      'www.robeurope.samuelponce.es',
      '*.robeurope.samuelponce.es',
      'localhost',
      '127.0.0.1',
      '46.101.255.106'
    ]
  }

})
