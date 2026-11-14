# Build context: frontend/  ->  docker build -t portfolio-web frontend
# npm is pinned exactly (npm 12 needs Node ^24.15.0; the base image is newer).
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm install -g npm@12.2.2 && node --version && npm --version
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g npm@12.2.2 && node --version && npm --version
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js
COPY routeLookup.js ./routeLookup.js
EXPOSE 3000
CMD ["node", "server.js"]
