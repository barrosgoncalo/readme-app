import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Esta linha diz ao browser para permitir que o pop-up do Google comunique com a app!
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
})
