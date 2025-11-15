import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
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
