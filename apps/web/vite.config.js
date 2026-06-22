import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer `.web.js` siblings when an import has no extension, so a single
    // shared service file that imports `./firebase` resolves to `firebase.web.js`
    // on web (and `firebase.js` on mobile via Metro). Mirrors react-native-web.
    // Explicit `.web` imports (e.g. `./auth.web`) still resolve as before — used
    // by services whose web/mobile implementations genuinely diverge.
    extensions: ['.web.js', '.web.jsx', '.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      // Force all shared code to use the same React copy as the web app,
      // preventing the "multiple React instances" hook error in monorepos.
      'react': path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
})
