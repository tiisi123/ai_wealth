import path from 'node:path';
import express from 'express';
import { applyMiddleware, errorMiddleware } from './platform/http/middleware.js';
import { asyncHandler } from './platform/http/errors.js';
import { createApiRouter, createReadyRouter } from './interfaces/http/routes.js';

export function createApp(container) {
  const app = express();
  applyMiddleware(app, container);
  app.use(express.json({ limit: '2mb' }));
  app.use((req, res, next) => {
    req.requestId = req.get('x-request-id') || req.id;
    res.setHeader('x-request-id', req.requestId);
    next();
  });

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.use('/ready', createReadyRouter(container));
  // Open-source Nginx reacts to 503/passive failures; this gate ensures a node that
  // becomes unready after startup never executes business requests.
  app.use('/api', asyncHandler(async (req, res, next) => {
    if (container.config.NODE_ENV !== 'production' || req.path === '/health' || req.path === '/api/health') return next();
    const readiness = await container.healthService.ready();
    if (!readiness.ready) return res.status(503).json({ error: { code: 'NODE_NOT_READY', message: '应用节点未就绪', details: readiness.checks } });
    return next();
  }));
  app.use('/api', createApiRouter(container));

  // 静态服务只暴露 public/，数据库、文档目录和向量接口不直接暴露给浏览器。
  app.use(express.static(container.config.PUBLIC_DIR, { index: 'index.html', fallthrough: true }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.startsWith('/ready')) {
      return res.sendFile(path.join(container.config.PUBLIC_DIR, 'index.html'));
    }
    return next();
  });
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } }));
  app.use(errorMiddleware);
  return app;
}
