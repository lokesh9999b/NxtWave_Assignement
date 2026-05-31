import type { TaskStatus } from "@prisma/client";

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["IN_REVIEW", "BLOCKED"],
  IN_REVIEW: ["DONE", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS"],
  DONE: []
};

export function canTransition(from: TaskStatus, to: TaskStatus) {
  return allowedTransitions[from].includes(to);
}
