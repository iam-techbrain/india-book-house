# ==========================================
# Multi-Stage Dockerfile for India Book House
# ==========================================

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package manifests and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source files and build production static bundle
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-slim AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Install curl for Docker health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy backend package manifests and install production dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev

# Copy backend source files
COPY backend/ ./

# Ensure data directory exists for SQLite database storage
RUN mkdir -p /app/backend/data

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose backend HTTP port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
