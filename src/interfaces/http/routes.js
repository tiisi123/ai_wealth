import express from 'express';
import { asyncHandler } from '../../platform/http/errors.js';
import { createControllers } from './controllers.js';

export function createApiRouter(container) {
  const router = express.Router();
  const controller = createControllers(container);

  router.get('/health', asyncHandler(controller.health));
  router.get('/demo-data', asyncHandler(controller.demoData));
  router.get('/knowledge', asyncHandler(controller.knowledge));
  router.post('/sessions', asyncHandler(controller.createSession));
  router.get('/sessions/:sessionId', asyncHandler(controller.getSession));
  router.patch('/sessions/:sessionId', asyncHandler(controller.patchSession));
  router.post('/sessions/:sessionId/commands', asyncHandler(controller.sessionCommand));
  router.post('/ai/generate', asyncHandler(controller.generate));
  return router;
}

export function createReadyRouter(container) {
  const router = express.Router();
  const controller = createControllers(container);
  router.get('/', asyncHandler(controller.ready));
  return router;
}
