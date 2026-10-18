FROM node:24.20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:24.20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund

FROM node:24.20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
EXPOSE 4000
CMD ["node", "dist/main.js"]

FROM deps AS test
WORKDIR /app
COPY . .
RUN npx prisma generate
CMD ["npm", "run", "test:all:container"]
