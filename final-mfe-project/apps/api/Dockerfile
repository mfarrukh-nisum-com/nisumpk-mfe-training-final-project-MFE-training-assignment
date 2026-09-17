# Build context is the MONOREPO ROOT (see docker-compose.yml and
# .github/workflows/cd.yml — both point context at ".", not this
# folder), because this app is built with Nx and resolves
# @final-mfe/shared-types via the workspace's tsconfig path aliases,
# both of which require the rest of the workspace to be present.
FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json* nx.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY libs/shared-types/package.json libs/shared-types/package.json
RUN npm install
COPY libs/shared-types libs/shared-types
COPY apps/api apps/api
RUN npx nx build api

FROM node:20-alpine
WORKDIR /app
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/package.json ./package.json
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "dist/server.js"]
