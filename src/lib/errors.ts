// Thrown by services; the nearest error boundary shows a generic Polish message.
export class NotFoundError extends Error {
  constructor() {
    super("Not found");
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}
