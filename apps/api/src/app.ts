import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./auth/auth.routes.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { openApiSpec } from "./openapi.js";
import { projectsRouter } from "./projects/projects.routes.js";
import { tasksRouter } from "./tasks/tasks.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use("/auth", authRouter);
  app.use("/projects", projectsRouter);
  app.use("/tasks", tasksRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
