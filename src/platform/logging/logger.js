import pino from 'pino';

export function createLogger(config) {
  return pino({
    level: config.NODE_ENV === 'test' ? 'silent' : 'info',
    base: { service: 'wealth-prototype-demo', instance_id: config.INSTANCE_ID },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'MODEL_API_KEY', '*.apiKey', '*.api_key'],
      censor: '[REDACTED]'
    }
  });
}
