import type { Plugin } from 'vite';
import { createApiMiddleware, type ServerEnv } from './middleware';

/** Mounts the internal API on the Vite dev and preview servers. */
export function apiPlugin(env: ServerEnv): Plugin {
  return {
    name: 'londynek-api',
    configureServer(server) {
      server.middlewares.use(createApiMiddleware(env));
    },
    configurePreviewServer(server) {
      server.middlewares.use(createApiMiddleware(env));
    },
  };
}
