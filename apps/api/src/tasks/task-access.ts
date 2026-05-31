import type { Task } from "@prisma/client";
import { AppError } from "../errors.js";
import type { AuthUser } from "../types.js";

export function assertCanReadTask(user: AuthUser, task: Task) {
  assertSameOrganization(user, task);
  if (user.role === "MEMBER" && task.assigneeId !== user.id) {
    throw new AppError(403, "FORBIDDEN", "Members can only view tasks assigned to them");
  }
}

export function assertCanManageTask(user: AuthUser, task: Task) {
  assertSameOrganization(user, task);
  if (user.role === "MEMBER") {
    throw new AppError(403, "FORBIDDEN", "Members cannot manage task details");
  }
}

export function assertCanChangeStatus(user: AuthUser, task: Task) {
  assertSameOrganization(user, task);
  if (user.role === "MEMBER" && task.assigneeId !== user.id) {
    throw new AppError(403, "FORBIDDEN", "Only the assignee or a manager can advance status");
  }
}

function assertSameOrganization(user: AuthUser, task: Task) {
  if (task.organizationId !== user.organizationId) {
    throw new AppError(404, "TASK_NOT_FOUND", "Task not found");
  }
}
