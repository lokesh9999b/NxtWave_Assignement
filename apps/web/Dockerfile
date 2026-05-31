FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json apps/web/
RUN npm install

COPY apps/web apps/web
WORKDIR /app/apps/web

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/web apps/web

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]
