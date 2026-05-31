import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRoles } from "../middleware/rbac.js";
import { validate } from "../validate.js";

const router = Router();

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional()
  })
});

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("ADMIN", "MANAGER"), validate(createProjectSchema), async (req, res, next) => {
  try {
    const project = await prisma.project.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        organizationId: req.user!.organizationId
      }
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

export { router as projectsRouter };
