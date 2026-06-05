import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function createVercelResponse(response) {
  return {
    statusCode: 200,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(payload) {
      response.statusCode = this.statusCode;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(payload));
    }
  };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk) => {
      rawBody += chunk;
    });

    request.on('end', () => {
      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function localApiPlugin() {
  return {
    name: 'predictwc-local-api',
    configureServer(server) {
      const routes = {
        '/api/request-password-reset': () => import('./api/request-password-reset.js'),
        '/api/confirm-password-reset': () => import('./api/confirm-password-reset.js')
      };

      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split('?')[0];
        const loadHandler = routes[pathname];

        if (!loadHandler) {
          next();
          return;
        }

        try {
          request.body = await readJsonBody(request);
          const { default: handler } = await loadHandler();
          await handler(request, createVercelResponse(response));
        } catch (error) {
          console.error(`Local API failed for ${pathname}:`, error);
          response.statusCode = 500;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ success: false, error: 'Local API failed.' }));
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), localApiPlugin()]
  };
});
