import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    basicSsl() // Automatically generates HTTPS certificate
  ],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
  },
})
