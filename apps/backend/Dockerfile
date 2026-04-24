# §6.2 Backend Tech Stack – Node.js 20 LTS
FROM node:20-slim AS base

WORKDIR /usr/src/app

# Install dependencies needed for certain node-gyp builds or export logic (§12.2 Puppeteer)
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libgtk-3-0 \
  && rm -rf /var/lib/apt/lists/*

# Copy root monorepo files for npm workspaces logic (§Root package.json)
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install root dependencies (concurrently, etc.)
RUN npm install

# Copy source code 
COPY apps/backend ./apps/backend

# Set scope for subsequent commands to backend 
WORKDIR /usr/src/app/apps/backend

# Development build uses local ts-node-dev (managed via Compose volumes)
# For production we would use multistage, but we provide dev entrypoint here.
EXPOSE 5000

CMD ["npm", "run", "dev"]
