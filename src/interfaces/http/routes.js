import express from 'express';
import { asyncHandler } from '../../platform/http/errors.js';
import { createControllers } from './controllers.js';

// W1 波次 3 新增的只读路由（GET only）。全部不进入 SESSION_COMMANDS / SESSION_PATCH_FIELDS，
// 也不新增会话状态 key；只读计算不持久化任何状态。
export function createApiRouter(container) {
  const router = express.Router();
  const controller = createControllers(container);

  router.get('/health', asyncHandler(controller.health));
  // P-01 前置：只读暴露 /ready 的 7 项 checks。
  router.get('/health/checks', asyncHandler(controller.healthChecks));
  router.get('/demo-data', asyncHandler(controller.demoData));
  router.get('/knowledge', asyncHandler(controller.knowledge));
  // §8.1 #4 / #5 / #6 只读计算与数据投影。
  router.get('/calculations/deposit', asyncHandler(controller.calculateDeposit));
  router.get('/calculations/portfolio', asyncHandler(controller.calculatePortfolio));
  router.get('/insurance/coverage', asyncHandler(controller.insuranceCoverage));
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
