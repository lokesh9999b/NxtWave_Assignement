import type { Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db.js";
import { AppError } from "../errors.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireRoles } from "../middleware/rbac.js";
import { clearTaskListCache, redis } from "../redis.js";
import { validate } from "../validate.js";
import {
  assertCanChangeStatus,
  assertCanManageTask,
  assertCanReadTask
} from "./task-access.js";
import { canTransition } from "./task-status.js";
import {
  createTaskSchema,
  listTasksSchema,
  taskIdSchema,
  updateStatusSchema,
  updateTaskSchema
} from "./task.schemas.js";

const router = Router();

type ListTasksQuery = {
  page: number;
  limit: number;
  status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  assigneeId?: string;
};

router.use(authenticate);

router.get("/", validate(listTasksSchema), async (req, res, next) => {
  try {
    const user = req.user!;
    const { page, limit, status, priority, assigneeId } = req.query as unknown as ListTasksQuery;
    const effectiveAssigneeId = user.role === "MEMBER" ? user.id : assigneeId;
    const cacheKey = [
      "tasks",
      user.organizationId,
      `page:${page}`,
      `limit:${limit}`,
      `status:${status ?? "all"}`,
      `priority:${priority ?? "all"}`,
      `assignee:${effectiveAssigneeId ?? "all"}`
    ].join(":");

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const where: Prisma.TaskWhereInput = {
      organizationId: user.organizationId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(effectiveAssigneeId ? { assigneeId: effectiveAssigneeId } : {})
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { assignee: { select: { id: true, name: true, email: true } }, project: true },
        orderBy: { dueDate: "asc" },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.task.count({ where })
    ]);

    const payload = {
      data: items,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };

    await redis.set(cacheKey, JSON.stringify(payload), "EX", 60);
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRoles("ADMIN", "MANAGER"), validate(createTaskSchema), async (req, res, next) => {
  try {
    const user = req.user!;
    const { title, description, priority, projectId, assigneeId, dueDate } = req.body;

    await assertProjectInOrganization(projectId, user.organizationId);
    if (assigneeId) {
      await assertUserInOrganization(assigneeId, user.organizationId);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        projectId,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        organizationId: user.organizationId
      }
    });

    await clearTaskListCache(user.organizationId);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", validate(taskIdSchema), async (req, res, next) => {
  try {
    const task = await findTask(String(req.params.id));
    assertCanReadTask(req.user!, task);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", validate(updateTaskSchema), async (req, res, next) => {
  try {
    const user = req.user!;
    const task = await findTask(String(req.params.id));
    assertCanManageTask(user, task);

    if (req.body.assigneeId) {
      await assertUserInOrganization(req.body.assigneeId, user.organizationId);
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : req.body.dueDate
      }
    });

    await clearTaskListCache(user.organizationId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", validate(updateStatusSchema), async (req, res, next) => {
  try {
    const user = req.user!;
    const task = await findTask(String(req.params.id));
    assertCanChangeStatus(user, task);

    if (!canTransition(task.status, req.body.status)) {
      throw new AppError(400, "INVALID_STATUS_TRANSITION", `Cannot transition from ${task.status} to ${req.body.status}`);
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: req.body.status,
        completedAt: req.body.status === "DONE" ? new Date() : null
      }
    });

    await clearTaskListCache(user.organizationId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireRoles("ADMIN", "MANAGER"), validate(taskIdSchema), async (req, res, next) => {
  try {
    const user = req.user!;
    const task = await findTask(String(req.params.id));
    assertCanManageTask(user, task);
    await prisma.task.delete({ where: { id: task.id } });
    await clearTaskListCache(user.organizationId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

async function findTask(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }
  return task;
}

async function assertProjectInOrganization(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, organizationId } });
  if (!project) {
    throw new AppError(400, "INVALID_PROJECT", "Project does not belong to this organization");
  }
}

async function assertUserInOrganization(userId: string, organizationId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
  if (!user) {
    throw new AppError(400, "INVALID_ASSIGNEE", "Assignee does not belong to this organization");
  }
}

export { router as tasksRouter };
