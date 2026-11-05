import http from 'node:http';
import { createContainer } from './compositionRoot.js';
import { createApp } from './app.js';

const container = createContainer();
const app = createApp(container);
const server = http.createServer(app);

server.listen(container.config.PORT, () => {
  container.logger.info({ port: container.config.PORT, instance_id: container.config.INSTANCE_ID, api_version: container.config.API_VERSION }, 'wealth demo server started');
});

async function shutdown(signal) {
  container.logger.info({ signal }, 'shutting down');
  server.close(async () => {
    await container.db.close();
    process.exit(0);
  });
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

export { app, container, server };
