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

export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
