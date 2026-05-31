FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# Create a stub for the web workspace so npm doesn't fail on missing workspace
RUN mkdir -p apps/web && echo '{"name":"@task-tracker/web","private":true}' > apps/web/package.json
COPY apps/api/package.json apps/api/

RUN npm install --workspace=apps/api --include-workspace-root

COPY apps/api apps/api
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# --- Production ---
FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api apps/api

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
