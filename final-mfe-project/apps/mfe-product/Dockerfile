# Build context is the monorepo root — see apps/api/Dockerfile's comment
# for why. This app depends on the shared libs in ../../libs plus the
# workspace's nx.json/tsconfig.base.json to build via Nx at all.
FROM node:20-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json* nx.json tsconfig.base.json ./
COPY apps/mfe-product/package.json apps/mfe-product/package.json
COPY libs libs
RUN npm install
COPY apps/mfe-product apps/mfe-product
RUN npx nx build mfe-product

FROM nginx:alpine
COPY --from=build /workspace/apps/mfe-product/dist /usr/share/nginx/html
EXPOSE 4201
