import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { AppError } from './errors.js';

export function applyMiddleware(app, { config, logger }) {
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  if (config.CORS_ORIGIN) app.use(cors({ origin: config.CORS_ORIGIN }));
  app.use(pinoHttp({ logger }));
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) {
      return next();
    }
    return next();
  });
}

export function errorMiddleware(error, req, res, _next) {
  const normalized = error instanceof AppError
    ? error
    : new AppError('Internal server error', { code: 'INTERNAL_ERROR', status: 500, cause: error });

  req.log?.error({ err: error, code: normalized.code }, normalized.message);
  res.status(normalized.status).json({
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {})
    },
    request_id: req.requestId || req.get('x-request-id') || undefined
  });
}
