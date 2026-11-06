export class AppError extends Error {
  constructor(message, { code = 'APP_ERROR', status = 500, details = undefined, cause = undefined } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { code: 'VALIDATION_ERROR', status: 400, details });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { code: 'NOT_FOUND', status: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(message, details) {
    super(message, { code: 'VERSION_CONFLICT', status: 409, details });
  }
}

export class DependencyUnavailableError extends AppError {
  constructor(message, details) {
    super(message, { code: 'DEPENDENCY_UNAVAILABLE', status: 503, details });
  }
}

export class InsufficientEvidenceError extends AppError {
  constructor(message, details) {
    super(message, { code: 'INSUFFICIENT_EVIDENCE', status: 422, details });
  }
}

// 数据源给出了脏值（例如 NUMERIC 列里出现非数字文本）：这是数据/输入错误而非服务故障，
// 沿用 VALIDATION_ERROR，绝不静默降级为 0 或 null 后继续计算。
export class DataValueError extends ValidationError {}

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
