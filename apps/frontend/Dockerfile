# §6.1 Frontend Tech Stack – Vite React
FROM node:20-slim

WORKDIR /usr/src/app

# Copy root monorepo files for npm workspaces logic
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install root dependencies (concurrently, etc.)
RUN npm install

# Copy source code
COPY apps/frontend ./apps/frontend

# Set scope for subsequent commands to frontend
WORKDIR /usr/src/app/apps/frontend

# Expose Vite dev port (§6.1)
EXPOSE 5173

# Vite requires 'host: 0.0.0.0' for Docker visibility§5.1 Client Layer
CMD ["npm", "run", "dev", "--", "--host"]
