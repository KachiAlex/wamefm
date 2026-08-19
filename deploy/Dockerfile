FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY deploy/tsconfig.docker.json ./tsconfig.json
COPY backend/src ./src

RUN npm install -g typescript && tsc && npm uninstall -g typescript

EXPOSE 3001

CMD ["node", "dist/server.js"]
