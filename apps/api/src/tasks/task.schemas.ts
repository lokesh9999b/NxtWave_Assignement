import { z } from "zod";

const uuid = z.string().uuid();
const futureDate = z
  .string()
  .datetime()
  .refine((value) => new Date(value) > new Date(), "due_date must be a future date");

export const listTasksSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    assigneeId: uuid.optional()
  })
});

export const taskIdSchema = z.object({
  params: z.object({
    id: uuid
  })
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
    projectId: uuid,
    assigneeId: uuid.optional(),
    dueDate: futureDate.optional()
  })
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: uuid
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    assigneeId: uuid.nullable().optional(),
    dueDate: futureDate.nullable().optional()
  })
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: uuid
  }),
  body: z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"])
  })
});
