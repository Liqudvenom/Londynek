import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { apiPlugin } from './server/vite-plugin';

export default defineConfig(({ mode }) => {
  // Server-only secrets: no VITE_ prefix, so they are never exposed to client code.
  const env = loadEnv(mode, process.cwd(), ['TFL_', 'FORMS_']);
  return {
    plugins: [
      react(),
      apiPlugin({ TFL_APP_ID: env.TFL_APP_ID, TFL_APP_KEY: env.TFL_APP_KEY, FORMS_WEBHOOK_URL: env.FORMS_WEBHOOK_URL, FORMS_STORE_FILE: env.FORMS_STORE_FILE }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173 },
  };
});
