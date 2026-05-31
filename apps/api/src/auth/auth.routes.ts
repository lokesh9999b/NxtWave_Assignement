import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { validate } from "../validate.js";
import { createRefreshToken, signAccessToken, verifyRefreshToken } from "./tokens.js";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    organizationName: z.string().min(2),
    role: z.enum(["ADMIN", "MANAGER", "MEMBER"]).default("ADMIN")
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, organizationName, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "EMAIL_EXISTS", "A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const organization = await prisma.organization.create({ data: { name: organizationName } });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        organizationId: organization.id
      }
    });

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };

    res.status(201).json({
      user: authUser,
      accessToken: signAccessToken(authUser),
      refreshToken: await createRefreshToken(authUser)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    };

    res.json({
      user: authUser,
      accessToken: signAccessToken(authUser),
      refreshToken: await createRefreshToken(authUser)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);
    if (!payload.tokenId) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid");
    }

    const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
    }

    const matches = await bcrypt.compare(refreshToken, stored.tokenHash);
    if (!matches) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid");
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    const authUser = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId
    };

    res.json({
      accessToken: signAccessToken(authUser),
      refreshToken: await createRefreshToken(authUser)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", validate(refreshSchema), async (req, res, next) => {
  try {
    const payload = verifyRefreshToken(req.body.refreshToken);
    if (payload.tokenId) {
      await prisma.refreshToken.updateMany({
        where: { id: payload.tokenId },
        data: { revokedAt: new Date() }
      });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as authRouter };
