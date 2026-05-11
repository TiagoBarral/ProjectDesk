import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function localApiPlugin() {
  return {
    name: 'projectdesk-local-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/improve-task', async (request, response) => {
        const { default: handler } = await import('./api/improve-task.js');
        handler(request, response);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.ANTHROPIC_API_KEY ||= env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_MODEL ||= env.ANTHROPIC_MODEL;

  return {
    plugins: [react(), localApiPlugin()],
  };
});
