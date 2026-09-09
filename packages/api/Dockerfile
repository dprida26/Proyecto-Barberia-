FROM node:22-alpine AS base
WORKDIR /repo
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/api/package.json packages/api/package.json
RUN npm install --workspaces --include-workspace-root=false --workspace=packages/shared --workspace=packages/api

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/api packages/api
RUN npm run build --workspace=packages/shared
RUN npm run db:generate --workspace=packages/api
RUN npm run build --workspace=packages/api

FROM node:22-alpine AS runner
WORKDIR /repo
RUN apk add --no-cache openssl tzdata
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared ./packages/shared
COPY --from=build /repo/packages/api ./packages/api
WORKDIR /repo/packages/api
EXPOSE 3001
CMD ["sh", "-c", "npm run db:migrate:deploy && node dist/server.js"]
