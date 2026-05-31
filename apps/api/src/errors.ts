import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, "NOT_FOUND", "Route not found"));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Invalid request"
    });
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({
      status: error.status,
      code: error.code,
      message: error.message
    });
  }

  console.error(error);
  return res.status(500).json({
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error"
  });
}
