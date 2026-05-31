export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Team Task Tracker API",
    version: "1.0.0"
  },
  servers: [{ url: "http://localhost:4000" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "organizationName"],
        properties: {
          name: { type: "string", example: "Lokesh" },
          email: { type: "string", format: "email", example: "lokesh@example.com" },
          password: { type: "string", minLength: 8, example: "Password123" },
          organizationName: { type: "string", example: "Lokesh Org" },
          role: { type: "string", enum: ["ADMIN", "MANAGER", "MEMBER"], example: "ADMIN" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "lokesh@example.com" },
          password: { type: "string", example: "Password123" }
        }
      },
      RefreshRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "paste-refresh-token-here" }
        }
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "00000000-0000-0000-0000-000000000000" },
          email: { type: "string", format: "email", example: "lokesh@example.com" },
          role: { type: "string", enum: ["ADMIN", "MANAGER", "MEMBER"], example: "ADMIN" },
          organizationId: { type: "string", format: "uuid", example: "00000000-0000-0000-0000-000000000000" }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/AuthUser" },
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        }
      },
      RefreshResponse: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        }
      },
      CreateProjectRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Assignment Project" },
          description: { type: "string", example: "SDE II task tracker implementation" }
        }
      },
      CreateTaskRequest: {
        type: "object",
        required: ["title", "projectId"],
        properties: {
          title: { type: "string", example: "Implement RBAC middleware" },
          description: { type: "string", example: "Protect task routes using role middleware" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], example: "HIGH" },
          projectId: { type: "string", format: "uuid", example: "00000000-0000-0000-0000-000000000000" },
          assigneeId: { type: "string", format: "uuid", example: "00000000-0000-0000-0000-000000000000" },
          dueDate: { type: "string", format: "date-time", example: "2026-12-31T18:30:00.000Z" }
        }
      },
      UpdateTaskRequest: {
        type: "object",
        properties: {
          title: { type: "string", example: "Implement task caching" },
          description: { type: "string", example: "Cache task list by organization and filters" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], example: "MEDIUM" },
          assigneeId: {
            oneOf: [{ type: "string", format: "uuid" }, { type: "null" }],
            example: "00000000-0000-0000-0000-000000000000"
          },
          dueDate: {
            oneOf: [{ type: "string", format: "date-time" }, { type: "null" }],
            example: "2026-12-31T18:30:00.000Z"
          }
        }
      },
      UpdateStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"], example: "IN_PROGRESS" }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "due_date must be a future date" }
        }
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register user and organization",
        requestBody: jsonBody("RegisterRequest"),
        responses: authResponses()
      }
    },
    "/auth/login": {
      post: {
        summary: "Login and receive tokens",
        requestBody: jsonBody("LoginRequest"),
        responses: authResponses()
      }
    },
    "/auth/refresh": {
      post: {
        summary: "Rotate refresh token",
        requestBody: jsonBody("RefreshRequest"),
        responses: defaultResponses()
      }
    },
    "/auth/logout": {
      post: {
        summary: "Revoke refresh token",
        requestBody: jsonBody("RefreshRequest"),
        responses: {
          204: { description: "Logged out" },
          ...errorResponses()
        }
      }
    },
    "/projects": {
      get: {
        summary: "List organization projects",
        security: [{ bearerAuth: [] }],
        responses: defaultResponses()
      },
      post: {
        summary: "Create project",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateProjectRequest"),
        responses: defaultResponses(201)
      }
    },
    "/tasks": {
      get: {
        summary: "List tasks with pagination and filters",
        security: [{ bearerAuth: [] }],
        parameters: [
          queryParam("page", "integer", "Page number", 1),
          queryParam("limit", "integer", "Items per page", 20),
          queryParam("status", "string", "Task status", "TODO", ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"]),
          queryParam("priority", "string", "Task priority", "HIGH", ["LOW", "MEDIUM", "HIGH"]),
          queryParam("assigneeId", "string", "Assignee user id")
        ],
        responses: defaultResponses()
      },
      post: {
        summary: "Create task",
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody("CreateTaskRequest"),
        responses: defaultResponses(201)
      }
    },
    "/tasks/{id}": {
      get: {
        summary: "Get task by id",
        security: [{ bearerAuth: [] }],
        parameters: [pathParam("id")],
        responses: defaultResponses()
      },
      patch: {
        summary: "Update task details",
        security: [{ bearerAuth: [] }],
        parameters: [pathParam("id")],
        requestBody: jsonBody("UpdateTaskRequest"),
        responses: defaultResponses()
      },
      delete: {
        summary: "Delete task",
        security: [{ bearerAuth: [] }],
        parameters: [pathParam("id")],
        responses: {
          204: { description: "Task deleted" },
          ...errorResponses()
        }
      }
    },
    "/tasks/{id}/status": {
      patch: {
        summary: "Advance task status",
        security: [{ bearerAuth: [] }],
        parameters: [pathParam("id")],
        requestBody: jsonBody("UpdateStatusRequest"),
        responses: defaultResponses()
      }
    }
  }
};

function jsonBody(schemaName: string) {
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schemaName}` }
      }
    }
  };
}

function defaultResponses(successStatus = 200) {
  return {
    [successStatus]: { description: "Success" },
    ...errorResponses()
  };
}

function authResponses() {
  return {
    200: {
      description: "Authenticated",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/AuthResponse" }
        }
      }
    },
    201: {
      description: "Registered",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/AuthResponse" }
        }
      }
    },
    ...errorResponses()
  };
}

function errorResponses() {
  return {
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/ErrorResponse" }
        }
      }
    },
    401: { description: "Unauthenticated" },
    403: { description: "Forbidden" },
    404: { description: "Not found" }
  };
}

function pathParam(name: string) {
  return {
    name,
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" }
  };
}

function queryParam(name: string, type: string, description: string, example?: unknown, enumValues?: string[]) {
  return {
    name,
    in: "query",
    required: false,
    description,
    schema: {
      type,
      ...(enumValues ? { enum: enumValues } : {})
    },
    ...(example ? { example } : {})
  };
}
