import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    req.body = (parsed as { body?: unknown }).body ?? req.body;
    req.params = (parsed as { params?: Record<string, string> }).params ?? req.params;
    req.query = (parsed as { query?: Record<string, string> }).query ?? req.query;
    next();
  };
}
