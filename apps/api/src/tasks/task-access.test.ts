import type { Task } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { AppError } from "../errors.js";
import type { AuthUser } from "../types.js";
import { assertCanChangeStatus, assertCanReadTask } from "./task-access.js";

const member: AuthUser = {
  id: "user-1",
  email: "member@example.com",
  role: "MEMBER",
  organizationId: "org-1"
};

const manager: AuthUser = {
  ...member,
  id: "manager-1",
  role: "MANAGER"
};

const task = {
  id: "task-1",
  title: "Write tests",
  description: null,
  priority: "HIGH",
  status: "TODO",
  dueDate: null,
  projectId: "project-1",
  assigneeId: "user-1",
  organizationId: "org-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null
} satisfies Task;

describe("task access rules", () => {
  it("allows members to read and advance their own assigned tasks", () => {
    expect(() => assertCanReadTask(member, task)).not.toThrow();
    expect(() => assertCanChangeStatus(member, task)).not.toThrow();
  });

  it("blocks members from reading tasks assigned to somebody else", () => {
    expect(() => assertCanReadTask({ ...member, id: "other-user" }, task)).toThrow(AppError);
  });

  it("allows managers to advance organization tasks", () => {
    expect(() => assertCanChangeStatus(manager, task)).not.toThrow();
  });
});
