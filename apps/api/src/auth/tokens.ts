import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { config } from "../config.js";
import { prisma } from "../db.js";
import type { AuthUser } from "../types.js";

type JwtPayload = AuthUser & { tokenId?: string };

export function signAccessToken(user: AuthUser) {
  return jwt.sign(user, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL as StringValue
  });
}

export async function createRefreshToken(user: AuthUser) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.REFRESH_TOKEN_TTL_DAYS);

  const record = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: "pending",
      expiresAt
    }
  });

  const token = jwt.sign({ ...user, tokenId: record.id }, config.JWT_REFRESH_SECRET, {
    expiresIn: `${config.REFRESH_TOKEN_TTL_DAYS}d`
  });

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { tokenHash: await bcrypt.hash(token, 12) }
  });

  return token;
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
}
