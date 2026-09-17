# Build context is the monorepo root — see apps/api/Dockerfile's comment
# for why. This app depends on the shared libs in ../../libs plus the
# workspace's nx.json/tsconfig.base.json to build via Nx at all.
FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json* nx.json tsconfig.base.json ./
COPY apps/gateway/package.json apps/gateway/package.json
COPY libs libs
RUN npm install
COPY apps/gateway apps/gateway
RUN npx nx build gateway

FROM nginx:alpine
COPY --from=build /workspace/apps/gateway/dist /usr/share/nginx/html
EXPOSE 4200
