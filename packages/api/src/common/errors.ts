export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto de estado") {
    super(409, "CONFLICT", message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos invalidos") {
    super(400, "VALIDATION_ERROR", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accion no permitida") {
    super(403, "FORBIDDEN", message);
  }
}
