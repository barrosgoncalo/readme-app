import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Explicitly resolve web files first so cross-platform packages don't load native code
const extensions = [
  '.web.mjs',
  '.mjs',
  '.web.js',
  '.js',
  '.web.mts',
  '.mts',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.tsx',
  '.tsx',
  '.json',
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      extensions,
      alias: {
        // Mock Google Sign-In completely on the web
        '@react-native-google-signin/google-signin': path.resolve(__dirname, 'src/mocks/googleSigninMock.js'),
        // Share package link
        '@readme/shared': path.resolve(__dirname, '../../packages/shared'),
        // React Native web safety net
        'react-native': 'react-native-web'
      },
      dedupe: ['react', 'react-dom', 'react-router-dom']
    },
    optimizeDeps: {
      esbuildOptions: {
        resolveExtensions: extensions,
      },
    },
    server: {
      fs: {
        allow: ['../..']
      }
    },
    define: {
      'process.env': env
    }
  };
});
