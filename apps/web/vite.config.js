import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

import AutoImport from 'unplugin-auto-import/vite';
import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    plugins: [
        react(),
        AutoImport({
            resolvers: [IconsResolver({ prefix: 'Icon', enabledCollections: ['lucide'] })],
            dts: 'src/auto-imports.d.ts',
        }),
        Icons({ compiler: 'jsx', jsx: 'react', autoInstall: true }),
    ],
    resolve: {
      extensions,
      alias: {
        // Mock Google Sign-In completely on the web
        '@react-native-google-signin/google-signin': path.resolve(__dirname, 'src/mocks/googleSigninMock.js'),
        // Share package link
        '@readme/shared': path.resolve(__dirname, '../../packages/shared'),
        // React Native web safety net
        'react-native': 'react-native-web',

        'react': path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),

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
