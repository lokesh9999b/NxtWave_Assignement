import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors.js";
import { verifyAccessToken } from "../auth/tokens.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new AppError(401, "UNAUTHENTICATED", "Access token is required");
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId
    };
    next();
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "Access token is invalid or expired");
  }
}
