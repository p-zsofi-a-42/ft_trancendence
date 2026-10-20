FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

# Dev stage: source is bind-mounted in docker-compose.yml, so `npm run dev`
# picks up file changes and hot-reloads without rebuilding the image.
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
