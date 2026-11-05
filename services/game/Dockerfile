FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS dev
RUN npm ci
COPY . .
ENV HOST=0.0.0.0 PORT=8000
EXPOSE 8000
CMD ["npm", "run", "dev"]

# ?
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.output ./.output
EXPOSE 8000
CMD ["node", ".output/server/index.mjs"]
